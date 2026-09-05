"""
Attendance domain service — deterministic check-in/out and corrections.

Phase 3 (Attendance & Time Off). All duration math lives here; the
``Attendance.worked_hours`` column is always derived from check-in /
check-out and is never accepted as input. Persistence helpers add to the
given session but never commit — the caller owns the transaction.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Sequence
import uuid

from app.services.contract_service import (
    NoApplicableContractError,
    get_applicable_contract,
)
from app.services.schedule_service import calculate_day_working_hours

if TYPE_CHECKING:  # pragma: no cover
    from app.models.attendance import Attendance
    from app.models.employee import Employee


class AttendanceDomainError(ValueError):
    """Base exception for attendance domain validation errors."""


class AttendanceValidationError(AttendanceDomainError):
    """Raised when attendance timestamps or fields are invalid."""


class AttendanceDuplicateError(AttendanceDomainError):
    """Raised when an attendance record already exists for employee/date."""


def _coerce_aware(moment: datetime) -> datetime:
    """Return a timezone-aware instant, assuming UTC when naive.

    Timestamps are stored as UTC instants; backends such as SQLite drop
    tzinfo on read, so naive values are interpreted as UTC to keep
    duration math deterministic across databases.
    """
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment


def calculate_worked_hours(
    check_in: datetime | None, check_out: datetime | None
) -> float | None:
    """Calculate worked hours from check-in/check-out timestamps.

    :param check_in: Check-in timestamp.
    :param check_out: Check-out timestamp (None for open records).
    :return: Rounded worked hours, or None when check-out is missing so an
        open record is never falsely reported as zero hours.
    :raises AttendanceValidationError: If timestamps are invalid or the
        duration would be negative.
    """
    if check_in is None:
        raise AttendanceValidationError(
            "Cannot calculate worked hours without check_in."
        )
    if check_out is None:
        return None
    validate_attendance_timestamps(check_in, check_out)
    start = _coerce_aware(check_in)
    end = _coerce_aware(check_out)
    seconds = (end - start).total_seconds()
    return round(seconds / 3600.0, 2)


def validate_attendance_timestamps(
    check_in: datetime | None, check_out: datetime | None
) -> None:
    """Validate a check-in/check-out pair.

    Naive timestamps are interpreted as UTC (see :func:`_coerce_aware`).

    :raises AttendanceValidationError: If check_out precedes check_in.
    """
    if check_in is None or check_out is None:
        return
    if _coerce_aware(check_out) < _coerce_aware(check_in):
        raise AttendanceValidationError(
            "check_out cannot be before check_in."
        )


def validate_no_duplicate_attendance(
    attendance_records: Sequence["Attendance"],
    attendance_date: date,
    exclude_attendance_id: uuid.UUID | str | None = None,
) -> None:
    """Ensure no other record exists for the same date.

    :raises AttendanceDuplicateError: If a conflicting record is found.
    """
    exclude_id_str = str(exclude_attendance_id) if exclude_attendance_id else None
    for existing in attendance_records:
        if exclude_id_str and str(existing.id) == exclude_id_str:
            continue
        if existing.attendance_date == attendance_date:
            raise AttendanceDuplicateError(
                f"Attendance already recorded for {attendance_date} "
                f"(record {existing.id}). Correct it instead of duplicating."
            )


def is_attendance_incomplete(record: "Attendance") -> bool:
    """Detect open/incomplete attendance.

    A record is incomplete when it has no check-out and is not a resolved
    absence. Absent records carry no timestamps by design.
    """
    if record.status == "absent":
        return False
    return record.check_out is None


def record_check_in(
    session,
    employee: "Employee" | uuid.UUID | str,
    attendance_date: date,
    check_in: datetime,
    notes: str | None = None,
) -> "Attendance":
    """Create an open attendance record for an employee/date.

    The record starts as ``incomplete`` until :func:`record_check_out`
    closes it. Never overwrites an existing record for the same date.

    :raises AttendanceValidationError: If the employee does not exist or
        check_in is missing.
    :raises AttendanceDuplicateError: If a record already exists.
    """
    from app.models.attendance import Attendance
    from app.models.employee import Employee

    if check_in is None:
        raise AttendanceValidationError("check_in is required.")
    if isinstance(employee, (uuid.UUID, str)):
        employee = session.get(Employee, employee)
    if employee is None:
        raise AttendanceValidationError("Employee does not exist.")

    existing = (
        session.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == attendance_date,
        )
        .all()
    )
    validate_no_duplicate_attendance(existing, attendance_date)

    record = Attendance(
        employee=employee,
        attendance_date=attendance_date,
        check_in=check_in,
        check_out=None,
        worked_hours=None,
        status="incomplete",
        notes=notes,
    )
    session.add(record)
    return record


def record_check_out(record: "Attendance", check_out: datetime) -> "Attendance":
    """Close an open attendance record with a check-out timestamp.

    Derives ``worked_hours`` from the stored check-in; manually supplied
    hours are never accepted. A corrected record keeps its ``corrected``
    status so the correction stays identifiable.
    """
    validate_attendance_timestamps(record.check_in, check_out)
    record.check_out = check_out
    record.worked_hours = calculate_worked_hours(record.check_in, check_out)
    if record.status != "corrected":
        record.status = "present"
    return record


def mark_absent(
    session,
    employee: "Employee" | uuid.UUID | str,
    attendance_date: date,
    notes: str | None = None,
) -> "Attendance":
    """Record an absence (no timestamps by design)."""
    from app.models.attendance import Attendance
    from app.models.employee import Employee

    if isinstance(employee, (uuid.UUID, str)):
        employee = session.get(Employee, employee)
    if employee is None:
        raise AttendanceValidationError("Employee does not exist.")

    existing = (
        session.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == attendance_date,
        )
        .all()
    )
    validate_no_duplicate_attendance(existing, attendance_date)

    record = Attendance(
        employee=employee,
        attendance_date=attendance_date,
        check_in=None,
        check_out=None,
        worked_hours=None,
        status="absent",
        notes=notes,
    )
    session.add(record)
    return record


def correct_attendance(
    record: "Attendance",
    check_in: datetime | None = None,
    check_out: datetime | None = None,
    correction_reason: str | None = None,
    notes: str | None = None,
) -> "Attendance":
    """Correct an attendance record while keeping it identifiable.

    The record is marked ``corrected`` with the reason preserved, and
    ``worked_hours`` is recomputed from the (possibly updated) timestamps.
    """
    if not correction_reason or not correction_reason.strip():
        raise AttendanceValidationError(
            "A correction_reason is required to correct attendance."
        )
    new_check_in = check_in if check_in is not None else record.check_in
    new_check_out = check_out if check_out is not None else record.check_out
    if new_check_in is None:
        raise AttendanceValidationError(
            "Corrected attendance requires a check_in."
        )
    validate_attendance_timestamps(new_check_in, new_check_out)
    record.check_in = new_check_in
    record.check_out = new_check_out
    record.worked_hours = calculate_worked_hours(new_check_in, new_check_out)
    record.status = "corrected"
    record.correction_reason = correction_reason.strip()
    if notes is not None:
        record.notes = notes
    return record


def get_attendance_health(
    employee_id: uuid.UUID | str,
    attendance_date: date,
    record: "Attendance | None" = None,
    contracts: Sequence | None = None,
    session=None,
) -> dict:
    """Describe attendance against the employee's working schedule.

    Resolves the applicable Phase 2 contract (never duplicating selection
    logic) and reports expected schedule info alongside actuals. This is
    informational only — no payroll or salary math happens here.

    :return: Dict with contract/schedule expectations and actuals.
    """
    try:
        contract = get_applicable_contract(
            employee_id, attendance_date, contracts=contracts, session=session
        )
    except NoApplicableContractError:
        return {
            "has_contract": False,
            "contract_reference": None,
            "is_working_day": None,
            "expected_hours": None,
            "worked_hours": record.worked_hours if record else None,
            "status": record.status if record else None,
            "is_incomplete": is_attendance_incomplete(record)
            if record
            else None,
        }

    schedule = contract.working_schedule
    weekday = attendance_date.weekday()
    day = None
    if schedule is not None:
        day = next(
            (d for d in schedule.days if d.weekday == weekday), None
        )

    expected_hours = None
    is_working_day = None
    if day is not None:
        is_working_day = day.is_working_day
        expected_hours = calculate_day_working_hours(
            is_working_day=day.is_working_day,
            start_time=day.start_time,
            end_time=day.end_time,
            break_minutes=day.break_minutes,
        )

    return {
        "has_contract": True,
        "contract_reference": contract.contract_reference,
        "is_working_day": is_working_day,
        "expected_hours": expected_hours,
        "worked_hours": record.worked_hours if record else None,
        "status": record.status if record else None,
        "is_incomplete": is_attendance_incomplete(record)
        if record
        else None,
    }
