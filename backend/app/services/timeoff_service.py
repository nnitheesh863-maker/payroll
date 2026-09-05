"""
Time-off domain service — deterministic durations, approvals and balances.

Phase 3 (Attendance & Time Off). owns the request lifecycle
(draft → submitted → approved / rejected, cancellation), single-shot
allocation deduction on approval, restoration on cancellation of approved
requests, overlap detection, and derived balance reporting. Nothing here
commits — the caller owns the transaction.
"""

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Sequence
import uuid

if TYPE_CHECKING:  # pragma: no cover
    from app.models.time_off_allocation import TimeOffAllocation
    from app.models.time_off_request import TimeOffRequest
    from app.models.time_off_type import TimeOffType


class TimeOffDomainError(ValueError):
    """Base exception for time-off domain validation errors."""


class TimeOffValidationError(TimeOffDomainError):
    """Raised when time-off dates, days or values are invalid."""


class TimeOffStateError(TimeOffDomainError):
    """Raised when a request state transition is not allowed."""


class InsufficientBalanceError(TimeOffDomainError):
    """Raised when an allocation cannot cover an approval."""


class TimeOffOverlapError(TimeOffDomainError):
    """Raised when a request overlaps a conflicting request."""


# Statuses that block overlapping requests (at minimum: approved).
_BLOCKING_STATUSES = ("submitted", "approved")

# Valid transitions: {current: {allowed next states}}.
_VALID_TRANSITIONS = {
    "draft": {"submitted", "cancelled"},
    "submitted": {"approved", "rejected", "cancelled"},
    "approved": {"cancelled"},
    "rejected": set(),
    "cancelled": set(),
}


def calculate_requested_days(start_date: date, end_date: date) -> int:
    """Calculate inclusive calendar days between two dates.

    2026-09-01 → 2026-09-01 = 1 day; 2026-09-01 → 2026-09-03 = 3 days.
    Working-day-only leave is out of scope for this base calculation.
    """
    validate_request_dates(start_date, end_date)
    return (end_date - start_date).days + 1


def validate_request_dates(start_date: date, end_date: date) -> None:
    """Validate a leave date range."""
    if start_date is None or end_date is None:
        raise TimeOffValidationError(
            "Time-off start_date and end_date are required."
        )
    if end_date < start_date:
        raise TimeOffValidationError(
            "Time-off end_date cannot precede start_date."
        )


def validate_allocation_values(
    allocated_days: float, used_days: float
) -> None:
    """Validate allocation day counters."""
    if allocated_days is None or allocated_days < 0:
        raise TimeOffValidationError("allocated_days must be non-negative.")
    if used_days is None or used_days < 0:
        raise TimeOffValidationError("used_days must be non-negative.")


def get_allocation_balance(allocation: "TimeOffAllocation") -> dict:
    """Return the derived balance for one allocation (never stored)."""
    allocated = allocation.allocated_days or 0.0
    used = allocation.used_days or 0.0
    return {
        "allocated_days": allocated,
        "used_days": used,
        "available_days": round(allocated - used, 2),
    }


def _window_covers(
    start: date | None, end: date | None, target_start: date, target_end: date
) -> bool:
    """Check an allocation validity window covers a request range."""
    if start is not None and target_start < start:
        return False
    if end is not None and target_end > end:
        return False
    return True


def find_applicable_allocation(
    allocations: Sequence["TimeOffAllocation"],
    employee_id: uuid.UUID | str,
    time_off_type_id: uuid.UUID | str,
    start_date: date,
    end_date: date,
) -> "TimeOffAllocation | None":
    """Locate the deterministic allocation for a request range.

    Considers ``approved`` allocations for the employee + type whose validity
    window covers the request. Earliest window start wins (then earliest
    creation, then id) so multiple allocations resolve deterministically.
    """
    emp = str(employee_id)
    typ = str(time_off_type_id)
    candidates = [
        a
        for a in allocations
        if str(a.employee_id) == emp
        and str(a.time_off_type_id) == typ
        and a.status == "approved"
        and _window_covers(a.start_date, a.end_date, start_date, end_date)
    ]
    if not candidates:
        return None
    candidates.sort(
        key=lambda a: (
            a.start_date or date.min,
            a.created_at or datetime.min.replace(tzinfo=timezone.utc),
            str(a.id),
        )
    )
    return candidates[0]


def validate_no_overlapping_requests(
    requests: Sequence["TimeOffRequest"],
    start_date: date,
    end_date: date,
    exclude_request_id: uuid.UUID | str | None = None,
    blocking_statuses: Sequence[str] = _BLOCKING_STATUSES,
) -> None:
    """Ensure no blocking request overlaps the given range."""
    validate_request_dates(start_date, end_date)
    exclude_id_str = str(exclude_request_id) if exclude_request_id else None
    for existing in requests:
        if exclude_id_str and str(existing.id) == exclude_id_str:
            continue
        if existing.status not in blocking_statuses:
            continue
        if start_date <= existing.end_date and existing.start_date <= end_date:
            raise TimeOffOverlapError(
                f"Request overlaps {existing.status} request {existing.id} "
                f"[{existing.start_date} → {existing.end_date}]."
            )


def _require_transition(request: "TimeOffRequest", next_status: str) -> None:
    allowed = _VALID_TRANSITIONS.get(request.status, set())
    if next_status not in allowed:
        raise TimeOffStateError(
            f"Cannot transition time-off request from "
            f"'{request.status}' to '{next_status}'."
        )


def submit_request(
    request: "TimeOffRequest",
    existing_requests: Sequence["TimeOffRequest"] | None = None,
) -> "TimeOffRequest":
    """Move a draft request to submitted (no allocation impact)."""
    _require_transition(request, "submitted")
    validate_request_dates(request.start_date, request.end_date)
    if request.requested_days is None or request.requested_days <= 0:
        raise TimeOffValidationError("requested_days must be positive.")
    if existing_requests is not None:
        validate_no_overlapping_requests(
            existing_requests,
            request.start_date,
            request.end_date,
            exclude_request_id=request.id,
        )
    request.status = "submitted"
    return request


def approve_request(
    request: "TimeOffRequest",
    allocation: "TimeOffAllocation | None" = None,
    allocations: Sequence["TimeOffAllocation"] | None = None,
    existing_requests: Sequence["TimeOffRequest"] | None = None,
    approved_by: uuid.UUID | str | None = None,
) -> "TimeOffRequest":
    """Approve a submitted request, deducting allocation exactly once.

    Already-approved requests are returned unchanged (idempotent — never a
    second deduction). Types with ``requires_allocation=False`` skip the
    allocation entirely (e.g. unpaid leave).
    """
    if request.status == "approved":
        return request
    _require_transition(request, "approved")
    validate_request_dates(request.start_date, request.end_date)
    if request.requested_days is None or request.requested_days <= 0:
        raise TimeOffValidationError("requested_days must be positive.")
    if existing_requests is not None:
        validate_no_overlapping_requests(
            existing_requests,
            request.start_date,
            request.end_date,
            exclude_request_id=request.id,
        )

    leave_type = request.time_off_type
    if leave_type is not None and leave_type.requires_allocation:
        resolved = allocation if allocation is not None else None
        if resolved is None:
            if allocations is None:
                raise TimeOffValidationError(
                    "No allocation available for this approval."
                )
            resolved = find_applicable_allocation(
                allocations,
                request.employee_id,
                request.time_off_type_id,
                request.start_date,
                request.end_date,
            )
        if resolved is None:
            raise TimeOffValidationError(
                "No applicable allocation covers this request."
            )
        if str(resolved.employee_id) != str(request.employee_id) or str(
            resolved.time_off_type_id
        ) != str(request.time_off_type_id):
            raise TimeOffValidationError(
                "Allocation does not belong to this employee/type."
            )
        if resolved.status != "approved":
            raise TimeOffValidationError(
                "Only approved allocations can cover requests."
            )
        balance = get_allocation_balance(resolved)
        allow_negative = bool(
            leave_type is not None and leave_type.allow_negative
        )
        if not allow_negative and balance["available_days"] < (
            request.requested_days or 0.0
        ):
            raise InsufficientBalanceError(
                f"Insufficient balance: available "
                f"{balance['available_days']} days, requested "
                f"{request.requested_days} days."
            )
        resolved.used_days = round(
            (resolved.used_days or 0.0) + (request.requested_days or 0.0), 2
        )
        request.allocation = resolved

    request.status = "approved"
    request.approved_at = datetime.now(timezone.utc)
    if approved_by is not None:
        request.approved_by = approved_by
    return request


def reject_request(
    request: "TimeOffRequest", rejection_reason: str
) -> "TimeOffRequest":
    """Reject a submitted request (never consumes allocation)."""
    _require_transition(request, "rejected")
    if not rejection_reason or not rejection_reason.strip():
        raise TimeOffValidationError(
            "A rejection_reason is required to reject a request."
        )
    request.status = "rejected"
    request.rejection_reason = rejection_reason.strip()
    return request


def cancel_request(request: "TimeOffRequest") -> "TimeOffRequest":
    """Cancel a request, restoring allocation once if it was approved.

    A second cancellation is an invalid transition, so restoration can
    never happen twice.
    """
    _require_transition(request, "cancelled")
    was_approved = request.status == "approved"
    consumed = request.allocation
    request.status = "cancelled"
    if was_approved and consumed is not None:
        consumed.used_days = round(
            max(
                0.0,
                (consumed.used_days or 0.0) - (request.requested_days or 0.0),
            ),
            2,
        )
    return request


def get_time_off_balance(
    employee_id: uuid.UUID | str,
    time_off_type_id: uuid.UUID | str,
    target_date: date,
    allocations: Sequence["TimeOffAllocation"],
) -> dict:
    """Report derived balances across applicable allocations.

    Each allocation is counted exactly once: ``approved`` allocations for
    the employee + type whose validity window covers ``target_date``.
    Approved usage is already folded into ``used_days`` by
    :func:`approve_request`, so no separate request scan is needed.
    """
    emp = str(employee_id)
    typ = str(time_off_type_id)
    relevant = [
        a
        for a in allocations
        if str(a.employee_id) == emp
        and str(a.time_off_type_id) == typ
        and a.status == "approved"
        and _window_covers(a.start_date, a.end_date, target_date, target_date)
    ]
    allocated = round(sum(a.allocated_days or 0.0 for a in relevant), 2)
    used = round(sum(a.used_days or 0.0 for a in relevant), 2)
    return {
        "allocated_days": allocated,
        "used_days": used,
        "available_days": round(allocated - used, 2),
    }
