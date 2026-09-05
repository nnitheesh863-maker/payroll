"""
Payroll validation service — deterministic pre-finalization checks.

Phase 7.1 (Validation). Inspects persisted Payrun/Payslip state and reports
structured blocking errors vs non-blocking warnings. Read-only: never
mutates payroll data and never recalculates salaries (Phase 5 remains the
sole calculation authority; totals are cross-checked from persisted lines
only).

Severity contract:
- errors present   → computed → validated MUST be rejected.
- warnings only    → validation may proceed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence, TYPE_CHECKING
import uuid

from app.services.contract_service import (
    ContractConflictError,
    NoApplicableContractError,
    get_applicable_contract,
    validate_no_overlapping_contracts,
)
from app.services.payrun_service import PayrunValidationError

if TYPE_CHECKING:  # pragma: no cover
    from app.models.payrun import Payrun
    from app.models.payslip import Payslip

MONEY_ROUNDING = ROUND_HALF_UP
TWO_PLACES = Decimal("0.01")
TOTAL_TOLERANCE = Decimal("0.01")


def _quantize_money(amount: Decimal | float | int | None) -> Decimal:
    if amount is None:
        return Decimal("0.00")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(TWO_PLACES, rounding=MONEY_ROUNDING)


@dataclass
class ValidationIssue:
    """One structured validation finding."""

    code: str
    severity: str  # "error" | "warning"
    message: str
    employee_id: uuid.UUID | None = None
    payslip_id: uuid.UUID | None = None

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "severity": self.severity,
            "message": self.message,
            "employee_id": str(self.employee_id) if self.employee_id else None,
            "payslip_id": str(self.payslip_id) if self.payslip_id else None,
        }


@dataclass
class PayrunValidationResult:
    """Aggregated validation outcome for one payrun."""

    valid: bool
    errors: list[ValidationIssue] = field(default_factory=list)
    warnings: list[ValidationIssue] = field(default_factory=list)

    @property
    def summary(self) -> dict:
        return {
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
        }

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "errors": [e.to_dict() for e in self.errors],
            "warnings": [w.to_dict() for w in self.warnings],
            "summary": self.summary,
        }


def _error(code, message, employee_id=None, payslip_id=None) -> ValidationIssue:
    return ValidationIssue(
        code=code,
        severity="error",
        message=message,
        employee_id=employee_id,
        payslip_id=payslip_id,
    )


def _warning(code, message, employee_id=None, payslip_id=None) -> ValidationIssue:
    return ValidationIssue(
        code=code,
        severity="warning",
        message=message,
        employee_id=employee_id,
        payslip_id=payslip_id,
    )


def _blank(value) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _check_employee_data(employee, errors, warnings) -> None:
    """Blocking errors for missing payroll-required fields; warnings otherwise."""
    required = {
        "employee_code": "employee code",
        "first_name": "first name",
        "last_name": "last name",
        "email": "email",
        "joining_date": "joining date",
    }
    for attr, label in required.items():
        if _blank(getattr(employee, attr, None)):
            errors.append(
                _error(
                    "INCOMPLETE_EMPLOYEE",
                    f"Employee is missing required payroll data: {label}.",
                    employee_id=employee.id,
                )
            )
    bank_fields = ("bank_name", "bank_account_number", "bank_ifsc_code")
    if any(_blank(getattr(employee, attr, None)) for attr in bank_fields):
        warnings.append(
            _warning(
                "MISSING_BANK_DETAILS",
                "Employee bank details are incomplete.",
                employee_id=employee.id,
            )
        )
    optional = {"phone": "phone number", "department_id": "department"}
    for attr, label in optional.items():
        if _blank(getattr(employee, attr, None)):
            warnings.append(
                _warning(
                    "MISSING_OPTIONAL_INFO",
                    f"Employee optional information missing: {label}.",
                    employee_id=employee.id,
                )
            )


def _check_employee_contracts(employee, payrun, errors) -> None:
    """Reuse Phase 2 contract logic: applicability at both period ends + overlap."""
    from app.services.contract_service import ContractOverlapError

    contracts = list(employee.contracts or [])
    try:
        start_contract = get_applicable_contract(
            employee.id, payrun.period_start, contracts=contracts
        )
    except NoApplicableContractError:
        errors.append(
            _error(
                "MISSING_CONTRACT",
                "No applicable contract found for the payroll period.",
                employee_id=employee.id,
            )
        )
        return
    except ContractConflictError as err:
        errors.append(
            _error(
                "OVERLAPPING_CONTRACTS",
                f"Conflicting contracts apply on {payrun.period_start}: {err}",
                employee_id=employee.id,
            )
        )
        return

    try:
        end_contract = get_applicable_contract(
            employee.id, payrun.period_end, contracts=contracts
        )
    except (NoApplicableContractError, ContractConflictError):
        end_contract = None
    if end_contract is None or end_contract.id != start_contract.id:
        errors.append(
            _error(
                "CONTRACT_PERIOD_MISMATCH",
                "Applicable contract does not cover the full payroll period.",
                employee_id=employee.id,
            )
        )

    try:
        validate_no_overlapping_contracts(
            contracts,
            payrun.period_start,
            payrun.period_end,
            exclude_contract_id=start_contract.id,
        )
    except ContractOverlapError as err:
        errors.append(
            _error(
                "OVERLAPPING_CONTRACTS",
                f"Overlapping contracts detected: {err}",
                employee_id=employee.id,
            )
        )


def _check_payslip_consistency(payrun, payslip, errors) -> None:
    """Cross-check persisted payslip data without recalculating payroll."""
    if payslip.payrun_id != payrun.id:
        errors.append(
            _error(
                "PAYRUN_EMPLOYEE_MISMATCH",
                "Payslip belongs to a different payrun.",
                employee_id=payslip.employee_id,
                payslip_id=payslip.id,
            )
        )
    if payslip.period_start != payrun.period_start or payslip.period_end != payrun.period_end:
        errors.append(
            _error(
                "PERIOD_MISMATCH",
                "Payslip period does not match the payrun period.",
                employee_id=payslip.employee_id,
                payslip_id=payslip.id,
            )
        )
    if payslip.salary_structure_id != payrun.salary_structure_id:
        errors.append(
            _error(
                "STRUCTURE_MISMATCH",
                "Payslip salary structure does not match the payrun structure.",
                employee_id=payslip.employee_id,
                payslip_id=payslip.id,
            )
        )
    employee = payslip.employee
    if employee is None or payslip.contract_id not in {
        c.id for c in (employee.contracts or [])
    }:
        errors.append(
            _error(
                "CONTRACT_MISMATCH",
                "Payslip contract does not belong to the payslip employee.",
                employee_id=payslip.employee_id,
                payslip_id=payslip.id,
            )
        )
    if not payslip.lines:
        errors.append(
            _error(
                "MISSING_PAYSLIP_LINES",
                "Payslip has no persisted salary-rule lines.",
                employee_id=payslip.employee_id,
                payslip_id=payslip.id,
            )
        )
        return

    earnings = Decimal("0.00")
    allowances = Decimal("0.00")
    deductions = Decimal("0.00")
    contributions = Decimal("0.00")
    for line in payslip.lines:
        amount = _quantize_money(line.amount)
        if line.category == "earning":
            earnings += amount
        elif line.category == "allowance":
            allowances += amount
        elif line.category == "deduction":
            deductions += amount
        elif line.category == "contribution":
            contributions += amount

    has_basic = any((line.rule_code or "").upper() == "BASIC" for line in payslip.lines)
    if has_basic:
        expected_gross = earnings + allowances
    else:
        expected_gross = _quantize_money(payslip.basic_salary) + earnings + allowances
    expected_net = expected_gross - deductions

    for label, expected, actual in (
        ("total_earnings", earnings, payslip.total_earnings),
        ("total_allowances", allowances, payslip.total_allowances),
        ("gross_salary", expected_gross, payslip.gross_salary),
        ("total_deductions", deductions, payslip.total_deductions),
        ("total_contributions", contributions, payslip.total_contributions),
        ("net_salary", expected_net, payslip.net_salary),
    ):
        if abs(_quantize_money(expected) - _quantize_money(actual)) > TOTAL_TOLERANCE:
            errors.append(
                _error(
                    "TOTALS_MISMATCH",
                    f"Payslip {label} is inconsistent with persisted lines.",
                    employee_id=payslip.employee_id,
                    payslip_id=payslip.id,
                )
            )
            break


def validate_payrun_result(session, payrun_id: uuid.UUID | str) -> PayrunValidationResult:
    """Validate persisted payrun state. Read-only — never mutates payroll data.

    :raises PayrunValidationError: If the payrun does not exist.
    """
    from app.models.payrun import Payrun
    from app.models.payslip import Payslip

    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        uid = None
    payrun = session.get(Payrun, uid) if uid else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")

    errors: list[ValidationIssue] = []
    warnings: list[ValidationIssue] = []

    if payrun.status not in ("draft", "computed"):
        errors.append(
            _error(
                "INVALID_LIFECYCLE_STATE",
                f"Payrun in status '{payrun.status}' cannot be validated.",
            )
        )
        return PayrunValidationResult(valid=False, errors=errors, warnings=warnings)

    scoped = list(payrun.payrun_employees or [])
    if not scoped:
        errors.append(_error("EMPTY_PAYRUN", "Payrun has no selected employees."))
        return PayrunValidationResult(valid=False, errors=errors, warnings=warnings)

    if payrun.salary_structure is None:
        errors.append(_error("MISSING_SALARY_STRUCTURE", "Payrun salary structure is missing."))
    elif not payrun.salary_structure.is_active:
        errors.append(
            _error(
                "INACTIVE_SALARY_STRUCTURE",
                f"Salary structure '{payrun.salary_structure.code}' is inactive.",
            )
        )

    slips_by_employee: dict[str, list] = {}
    for slip in payrun.payslips or []:
        slips_by_employee.setdefault(str(slip.employee_id), []).append(slip)
    for emp_key, slips in slips_by_employee.items():
        if len(slips) > 1:
            errors.append(
                _error(
                    "DUPLICATE_PAYSLIP",
                    "Multiple payslips exist for the same payrun and employee.",
                    employee_id=slips[0].employee_id,
                    payslip_id=slips[0].id,
                )
            )

    scoped_ids = {str(pe.employee_id) for pe in scoped}
    for slip in payrun.payslips or []:
        if str(slip.employee_id) not in scoped_ids:
            errors.append(
                _error(
                    "PAYRUN_EMPLOYEE_MISMATCH",
                    "Payslip employee is not in the payrun scope.",
                    employee_id=slip.employee_id,
                    payslip_id=slip.id,
                )
            )

    for pe in scoped:
        employee = pe.employee
        if employee is None:
            errors.append(_error("MISSING_EMPLOYEE", "Payrun references a missing employee."))
            continue
        _check_employee_data(employee, errors, warnings)
        _check_employee_contracts(employee, payrun, errors)

        slips = slips_by_employee.get(str(employee.id), [])
        if not slips:
            errors.append(
                _error(
                    "MISSING_PAYSLIP",
                    "No payslip generated for a selected employee.",
                    employee_id=employee.id,
                )
            )
            continue
        for slip in slips:
            _check_payslip_consistency(payrun, slip, errors)

    return PayrunValidationResult(valid=not errors, errors=errors, warnings=warnings)
