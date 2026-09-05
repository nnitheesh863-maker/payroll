"""
Contract domain service — deterministic applicability and overlap logic.

Phase 2 (Contracts & Working Schedules). Validates date ranges, detects contract
overlaps, and resolves applicable contracts for an employee on a given target date.
"""

from datetime import date
from typing import TYPE_CHECKING, Sequence
import uuid

if TYPE_CHECKING:  # pragma: no cover
    from app.models.contract import Contract


class ContractDomainError(ValueError):
    """Base exception for contract domain validation errors."""


class NoApplicableContractError(ContractDomainError):
    """Raised when no contract applies to an employee on a target date."""


class ContractConflictError(ContractDomainError):
    """Raised when multiple active/applicable contracts conflict on a target date."""


class ContractOverlapError(ContractDomainError):
    """Raised when creating or updating a contract that overlaps with an existing contract."""


def validate_contract_dates(start_date: date, end_date: date | None) -> None:
    """Validate contract start and end dates.

    :param start_date: Contract start date.
    :param end_date: Contract end date (None for open-ended).
    :raises ValueError: If end_date is before start_date.
    """
    if end_date is not None and end_date < start_date:
        raise ValueError("Contract end_date cannot precede start_date.")


def is_contract_applicable_on_date(contract: "Contract", target_date: date) -> bool:
    """Check if a contract is applicable on a target date.

    :param contract: Contract instance.
    :param target_date: Date to test applicability against.
    :return: True if target_date falls within [start_date, end_date], False otherwise.
    """
    if contract.start_date > target_date:
        return False
    if contract.end_date is not None and target_date > contract.end_date:
        return False
    return True


def do_date_ranges_overlap(
    start1: date, end1: date | None, start2: date, end2: date | None
) -> bool:
    """Check if two date ranges [start1, end1] and [start2, end2] overlap.

    Open-ended ranges (end=None) extend indefinitely into the future.
    """
    max_date = date.max
    effective_end1 = end1 if end1 is not None else max_date
    effective_end2 = end2 if end2 is not None else max_date

    return start1 <= effective_end2 and start2 <= effective_end1


def validate_no_overlapping_contracts(
    employee_contracts: Sequence["Contract"],
    start_date: date,
    end_date: date | None,
    exclude_contract_id: uuid.UUID | str | None = None,
) -> None:
    """Validate that proposed contract dates do not overlap with existing employee contracts.

    :param employee_contracts: List/query of existing contracts for the employee.
    :param start_date: Proposed contract start_date.
    :param end_date: Proposed contract end_date.
    :param exclude_contract_id: Optional ID to ignore when updating an existing contract.
    :raises ContractOverlapError: If an overlap is detected.
    """
    validate_contract_dates(start_date, end_date)

    exclude_id_str = str(exclude_contract_id) if exclude_contract_id else None

    for existing in employee_contracts:
        if exclude_id_str and str(existing.id) == exclude_id_str:
            continue

        # Ignore terminated contracts if status is terminated
        if getattr(existing, "status", None) == "terminated":
            continue

        if do_date_ranges_overlap(start_date, end_date, existing.start_date, existing.end_date):
            raise ContractOverlapError(
                f"Contract dates [{start_date} to {end_date or 'Open'}] overlap with "
                f"existing contract {existing.contract_reference} [{existing.start_date} to {existing.end_date or 'Open'}]."
            )


def get_applicable_contract(
    employee_id: uuid.UUID | str,
    target_date: date,
    contracts: Sequence["Contract"] | None = None,
    session=None,
) -> "Contract":
    """Find the single applicable contract for an employee on a target_date.

    :param employee_id: Target employee ID.
    :param target_date: Target date to find contract for.
    :param contracts: Optional sequence of Employee contracts (if already loaded).
    :param session: Optional DB session to query contracts if not provided.
    :return: The matching applicable Contract instance.
    :raises NoApplicableContractError: If no contract applies on target_date.
    :raises ContractConflictError: If multiple contracts apply simultaneously.
    """
    if contracts is None:
        if session is None:
            from app.extensions import db
            session = db.session
        from app.models.contract import Contract
        emp_id = uuid.UUID(str(employee_id)) if isinstance(employee_id, str) else employee_id
        contracts = session.query(Contract).filter(Contract.employee_id == emp_id).all()

    applicable = [
        c for c in contracts
        if is_contract_applicable_on_date(c, target_date)
        and getattr(c, "status", None) != "terminated"
    ]

    if not applicable:
        raise NoApplicableContractError(
            f"No applicable contract found for employee '{employee_id}' on {target_date}."
        )

    if len(applicable) > 1:
        refs = [c.contract_reference for c in applicable]
        raise ContractConflictError(
            f"Multiple contracts ({', '.join(refs)}) apply to employee '{employee_id}' on {target_date}."
        )

    return applicable[0]
