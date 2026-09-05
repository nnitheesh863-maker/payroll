"""
Payrun domain service — batch payroll execution and lifecycle management.

Phase 6 (Payrun & Payslip). Manages Payrun lifecycle (draft -> computed -> validated -> paid),
persists employee scope, delegates salary calculation to Phase 5 calculate_payroll(),
persists Payslips and PayslipLines, and provides transactional, idempotent batch execution.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence
import uuid

from app.models.base import utcnow
from app.services.payroll_calculation import calculate_payroll

MONEY_ROUNDING = ROUND_HALF_UP
TWO_PLACES = Decimal("0.01")


def _quantize_money(amount: Decimal | float | int | None) -> Decimal:
    """Quantize an amount to 2 decimal places using ROUND_HALF_UP."""
    if amount is None:
        return Decimal("0.00")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(TWO_PLACES, rounding=MONEY_ROUNDING)


class PayrunDomainError(ValueError):
    """Base exception for Payrun domain validation errors."""


class PayrunValidationError(PayrunDomainError):
    """Raised when Payrun parameters, dates or scopes are invalid."""


class PayrunStateError(PayrunDomainError):
    """Raised when a Payrun lifecycle state transition is prohibited."""


class PayrunComputationError(PayrunDomainError):
    """Raised when Payrun computation fails for an employee."""


def _coerce_uuid(val: uuid.UUID | str | None) -> uuid.UUID | None:
    if val is None:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except (ValueError, AttributeError):
        return None


def create_payrun(
    session,
    *,
    name: str,
    reference: str,
    period_start: date,
    period_end: date,
    salary_structure_id: uuid.UUID | str,
    employee_ids: Sequence[uuid.UUID | str] | None = None,
) -> "Payrun":
    """Create a new batch Payrun in draft status.

    :raises PayrunValidationError: If required fields are missing, period is invalid,
        salary structure is inactive/missing, or reference is duplicated.
    """
    from app.models.payrun import Payrun
    from app.models.payrun_employee import PayrunEmployee
    from app.models.salary_structure import SalaryStructure

    if not name or not str(name).strip():
        raise PayrunValidationError("Payrun name is required.")
    if not reference or not str(reference).strip():
        raise PayrunValidationError("Payrun reference is required.")
    if period_start is None or period_end is None:
        raise PayrunValidationError("period_start and period_end are required.")
    if period_end < period_start:
        raise PayrunValidationError("period_end cannot precede period_start.")

    name = str(name).strip()
    reference = str(reference).strip()

    # Verify reference uniqueness
    if session.query(Payrun).filter_by(reference=reference).first() is not None:
        raise PayrunValidationError(f"Payrun reference '{reference}' already exists.")

    # Verify salary structure exists and is active
    struct_id = _coerce_uuid(salary_structure_id)
    if struct_id is None:
        raise PayrunValidationError("Invalid salary_structure_id.")
    structure = session.get(SalaryStructure, struct_id)
    if structure is None:
        raise PayrunValidationError(f"SalaryStructure '{salary_structure_id}' does not exist.")
    if not structure.is_active:
        raise PayrunValidationError(f"SalaryStructure '{structure.name}' is inactive.")

    payrun = Payrun(
        name=name,
        reference=reference,
        period_start=period_start,
        period_end=period_end,
        salary_structure_id=structure.id,
        status="draft",
    )
    session.add(payrun)

    if employee_ids:
        from app.models.employee import Employee
        seen_ids = set()
        for emp_id_raw in employee_ids:
            emp_id = _coerce_uuid(emp_id_raw)
            if emp_id is None:
                raise PayrunValidationError(f"Invalid employee_id '{emp_id_raw}'.")
            if emp_id in seen_ids:
                raise PayrunValidationError(f"Duplicate employee_id '{emp_id}' in payrun scope.")
            seen_ids.add(emp_id)

            emp = session.get(Employee, emp_id)
            if emp is None:
                raise PayrunValidationError(f"Employee '{emp_id}' does not exist.")

            pe = PayrunEmployee(payrun=payrun, employee=emp)
            session.add(pe)

    return payrun


def add_employee_to_payrun(
    session, payrun_id: uuid.UUID | str, employee_id: uuid.UUID | str
) -> "PayrunEmployee":
    """Add an employee to an existing draft Payrun scope."""
    from app.models.employee import Employee
    from app.models.payrun import Payrun
    from app.models.payrun_employee import PayrunEmployee

    p_id = _coerce_uuid(payrun_id)
    payrun = session.get(Payrun, p_id) if p_id else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")
    if payrun.status != "draft":
        raise PayrunStateError(f"Cannot modify employee scope for Payrun in status '{payrun.status}'.")

    e_id = _coerce_uuid(employee_id)
    emp = session.get(Employee, e_id) if e_id else None
    if emp is None:
        raise PayrunValidationError(f"Employee '{employee_id}' does not exist.")

    existing = (
        session.query(PayrunEmployee)
        .filter_by(payrun_id=payrun.id, employee_id=emp.id)
        .first()
    )
    if existing is not None:
        raise PayrunValidationError(
            f"Employee '{emp.id}' is already included in Payrun '{payrun.reference}'."
        )

    pe = PayrunEmployee(payrun=payrun, employee=emp)
    session.add(pe)
    return pe


def remove_employee_from_payrun(
    session, payrun_id: uuid.UUID | str, employee_id: uuid.UUID | str
) -> bool:
    """Remove an employee from a draft Payrun scope."""
    from app.models.payrun import Payrun
    from app.models.payrun_employee import PayrunEmployee

    p_id = _coerce_uuid(payrun_id)
    payrun = session.get(Payrun, p_id) if p_id else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")
    if payrun.status != "draft":
        raise PayrunStateError(f"Cannot modify employee scope for Payrun in status '{payrun.status}'.")

    e_id = _coerce_uuid(employee_id)
    pe = (
        session.query(PayrunEmployee)
        .filter_by(payrun_id=payrun.id, employee_id=e_id)
        .first()
    )
    if pe:
        session.delete(pe)
        return True
    return False


def compute_payrun(session, payrun_id: uuid.UUID | str) -> "Payrun":
    """Compute payslips for all employees in the Payrun batch.

    Calls Phase 5 calculate_payroll() for each employee, creating or updating
    Payslips and PayslipLines. Computation is transactional (rolls back if any
    employee fails) and idempotent (supports recomputation without duplicate records).

    :raises PayrunValidationError: If payrun does not exist or scope is empty.
    :raises PayrunStateError: If payrun is already validated or paid.
    :raises PayrunComputationError: If payroll calculation fails for any employee.
    """
    from app.models.payrun import Payrun
    from app.models.payslip import Payslip
    from app.models.payslip_line import PayslipLine

    p_id = _coerce_uuid(payrun_id)
    payrun = session.get(Payrun, p_id) if p_id else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")

    if payrun.status in ("validated", "paid"):
        raise PayrunStateError(f"Cannot compute Payrun in status '{payrun.status}'.")

    if not payrun.payrun_employees:
        raise PayrunValidationError(f"Payrun '{payrun.reference}' has no selected employees.")

    now = utcnow()

    # Transactional computation: savepoint ensures all-or-nothing rollback
    try:
        with session.begin_nested():
            for pe in payrun.payrun_employees:
                emp = pe.employee
                try:
                    calc = calculate_payroll(
                        session=session,
                        employee_id=emp.id,
                        period_start=payrun.period_start,
                        period_end=payrun.period_end,
                        salary_structure_id=payrun.salary_structure_id,
                    )
                except Exception as err:
                    raise PayrunComputationError(
                        f"Computation failed for employee '{emp.employee_code}' ({emp.id}): {err}"
                    ) from err

                # Find or create Payslip
                payslip = (
                    session.query(Payslip)
                    .filter_by(payrun_id=payrun.id, employee_id=emp.id)
                    .first()
                )
                if payslip is None:
                    payslip = Payslip(
                        payrun=payrun,
                        employee=emp,
                        contract_id=calc.contract_id,
                        salary_structure_id=calc.salary_structure_id,
                        period_start=payrun.period_start,
                        period_end=payrun.period_end,
                    )
                    session.add(payslip)
                else:
                    payslip.contract_id = calc.contract_id
                    payslip.salary_structure_id = calc.salary_structure_id
                    payslip.period_start = payrun.period_start
                    payslip.period_end = payrun.period_end

                payslip.status = "computed"
                payslip.computed_at = now
                payslip.basic_salary = calc.basic_salary
                payslip.total_earnings = calc.total_earnings
                payslip.total_allowances = calc.total_allowances
                payslip.gross_salary = calc.gross_salary
                payslip.total_deductions = calc.total_deductions
                payslip.total_contributions = calc.total_contributions
                payslip.net_salary = calc.net_salary

                # Replace lines (Idempotency)
                payslip.lines.clear()
                for rule_res in calc.rule_results:
                    line = PayslipLine(
                        payslip=payslip,
                        salary_rule_id=rule_res.rule_id,
                        rule_code=rule_res.rule_code,
                        rule_name=rule_res.rule_name,
                        category=rule_res.category,
                        calculation_method=rule_res.calculation_method,
                        sequence=rule_res.sequence,
                        base_amount=rule_res.base_amount,
                        amount=rule_res.calculated_amount,
                    )
                    session.add(line)

            payrun.status = "computed"
            payrun.computed_at = now
    except PayrunComputationError:
        raise
    except Exception as err:
        raise PayrunComputationError(f"Payrun computation failed: {err}") from err

    return payrun


def validate_payrun(session, payrun_id: uuid.UUID | str) -> "Payrun":
    """Validate a computed Payrun batch.

    Verifies all selected employees have valid computed payslips, and sets
    status to validated for payrun and all associated payslips.

    :raises PayrunValidationError: If payrun does not exist or payslips are incomplete.
    :raises PayrunStateError: If payrun status is not computed.
    """
    from app.models.payrun import Payrun

    p_id = _coerce_uuid(payrun_id)
    payrun = session.get(Payrun, p_id) if p_id else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")

    if payrun.status != "computed":
        raise PayrunStateError(f"Payrun must be in 'computed' status to validate (current: '{payrun.status}').")

    if not payrun.payrun_employees:
        raise PayrunValidationError("Cannot validate payrun with no employees.")

    if len(payrun.payslips) != len(payrun.payrun_employees):
        raise PayrunValidationError(
            f"Payrun payslips count ({len(payrun.payslips)}) does not match "
            f"employee scope count ({len(payrun.payrun_employees)})."
        )

    now = utcnow()
    payrun.status = "validated"
    payrun.validated_at = now

    for slip in payrun.payslips:
        if not slip.contract_id or not slip.salary_structure_id:
            raise PayrunValidationError(f"Payslip '{slip.id}' has missing contract or salary structure.")
        slip.status = "validated"
        slip.validated_at = now

    return payrun


def mark_payrun_paid(session, payrun_id: uuid.UUID | str) -> "Payrun":
    """Mark a validated Payrun and all its payslips as paid.

    :raises PayrunValidationError: If payrun does not exist.
    :raises PayrunStateError: If payrun status is not validated.
    """
    from app.models.payrun import Payrun

    p_id = _coerce_uuid(payrun_id)
    payrun = session.get(Payrun, p_id) if p_id else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")

    if payrun.status != "validated":
        raise PayrunStateError(f"Payrun must be in 'validated' status to mark paid (current: '{payrun.status}').")

    now = utcnow()
    payrun.status = "paid"
    payrun.paid_at = now

    for slip in payrun.payslips:
        slip.status = "paid"
        slip.paid_at = now

    return payrun


def get_payrun_totals(payrun: "Payrun") -> dict:
    """Calculate aggregate monetary totals across all payslips in a Payrun."""
    basic = Decimal("0.00")
    earnings = Decimal("0.00")
    allowances = Decimal("0.00")
    gross = Decimal("0.00")
    deductions = Decimal("0.00")
    contributions = Decimal("0.00")
    net = Decimal("0.00")

    for slip in payrun.payslips:
        basic += _quantize_money(slip.basic_salary)
        earnings += _quantize_money(slip.total_earnings)
        allowances += _quantize_money(slip.total_allowances)
        gross += _quantize_money(slip.gross_salary)
        deductions += _quantize_money(slip.total_deductions)
        contributions += _quantize_money(slip.total_contributions)
        net += _quantize_money(slip.net_salary)

    return {
        "payslip_count": len(payrun.payslips),
        "total_basic_salary": basic,
        "total_earnings": earnings,
        "total_allowances": allowances,
        "total_gross_salary": gross,
        "total_deductions": deductions,
        "total_contributions": contributions,
        "total_net_salary": net,
    }
