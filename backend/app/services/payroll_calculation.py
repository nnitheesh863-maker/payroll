"""
Payroll Calculation Engine — deterministic salary computation.

Phase 5 (Payroll Calculation Engine). Consumes Employee, Applicable Contract,
Salary Structure, Ordered Salary Rules, Payroll Period, and Attendance / Time Off
context to compute exact monetary salary components (Basic, Earnings, Allowances,
Gross, Deductions, Net, Contributions) using Decimal arithmetic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence
import uuid

from app.services.contract_service import (
    ContractConflictError,
    NoApplicableContractError,
    get_applicable_contract,
)
from app.services.payroll_formula import (
    PayrollDivisionByZeroError,
    PayrollFormulaError,
    UnknownFormulaVariableError,
    UnsafeFormulaError,
    evaluate_formula,
)
from app.services.salary_rule_service import get_ordered_active_rules

MONEY_ROUNDING = ROUND_HALF_UP
TWO_PLACES = Decimal("0.01")


def _quantize_money(amount: Decimal | float | int) -> Decimal:
    """Quantize an amount to 2 decimal places using ROUND_HALF_UP."""
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(TWO_PLACES, rounding=MONEY_ROUNDING)


class PayrollCalculationError(ValueError):
    """Base exception for payroll calculation errors."""


class MissingApplicableContractError(PayrollCalculationError):
    """Raised when an applicable contract cannot be resolved for the payroll period."""


class MissingSalaryStructureError(PayrollCalculationError):
    """Raised when no active salary structure is assigned to the contract or employee."""


class NoActiveRulesError(PayrollCalculationError):
    """Raised when a salary structure has no active rules to evaluate."""


@dataclass(frozen=True)
class RuleEvaluationResult:
    """Detailed breakdown of one evaluated salary rule."""

    rule_id: uuid.UUID | None
    rule_code: str
    rule_name: str
    category: str
    calculation_method: str
    sequence: int
    base_amount: Decimal | None
    calculated_amount: Decimal

    def to_dict(self) -> dict:
        return {
            "rule_id": str(self.rule_id) if self.rule_id else None,
            "rule_code": self.rule_code,
            "rule_name": self.rule_name,
            "category": self.category,
            "calculation_method": self.calculation_method,
            "sequence": self.sequence,
            "base_amount": float(self.base_amount) if self.base_amount is not None else None,
            "calculated_amount": float(self.calculated_amount),
        }


@dataclass
class PayrollContext:
    """Calculation context passed to salary rules during evaluation."""

    employee_id: uuid.UUID
    contract_id: uuid.UUID
    period_start: date
    period_end: date
    contract_salary: Decimal
    scheduled_hours: Decimal = Decimal("0.00")
    worked_hours: Decimal = Decimal("0.00")
    present_days: int = 0
    absent_days: int = 0
    paid_leave_days: Decimal = Decimal("0.00")
    unpaid_leave_days: Decimal = Decimal("0.00")
    rule_results: dict[str, Decimal] = field(default_factory=dict)
    category_totals: dict[str, Decimal] = field(default_factory=dict)

    def get_eval_environment(self) -> dict[str, Decimal]:
        """Expose deterministic context variables for percentage & formula evaluations."""
        env: dict[str, Decimal] = {
            "CONTRACT_SALARY": self.contract_salary,
            "WORKED_HOURS": self.worked_hours,
            "SCHEDULED_HOURS": self.scheduled_hours,
            "PRESENT_DAYS": Decimal(str(self.present_days)),
            "ABSENT_DAYS": Decimal(str(self.absent_days)),
            "PAID_LEAVE_DAYS": self.paid_leave_days,
            "UNPAID_LEAVE_DAYS": self.unpaid_leave_days,
        }
        # Add all previously calculated rule results (e.g. BASIC, GROSS, etc.)
        for code, val in self.rule_results.items():
            env[code] = val
            env[code.upper()] = val
            env[code.lower()] = val
        return env


@dataclass(frozen=True)
class PayrollResult:
    """Complete structured output of a payroll calculation."""

    employee_id: uuid.UUID
    contract_id: uuid.UUID
    salary_structure_id: uuid.UUID
    period_start: date
    period_end: date
    rule_results: list[RuleEvaluationResult]
    basic_salary: Decimal
    total_earnings: Decimal
    total_allowances: Decimal
    gross_salary: Decimal
    total_deductions: Decimal
    total_contributions: Decimal
    net_salary: Decimal

    def to_dict(self) -> dict:
        return {
            "employee_id": str(self.employee_id),
            "contract_id": str(self.contract_id),
            "salary_structure_id": str(self.salary_structure_id),
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "rule_results": [r.to_dict() for r in self.rule_results],
            "basic_salary": float(self.basic_salary),
            "total_earnings": float(self.total_earnings),
            "total_allowances": float(self.total_allowances),
            "gross_salary": float(self.gross_salary),
            "total_deductions": float(self.total_deductions),
            "total_contributions": float(self.total_contributions),
            "net_salary": float(self.net_salary),
        }


def _build_context_attendance_timeoff(
    employee_id: uuid.UUID,
    period_start: date,
    period_end: date,
    attendances: Sequence | None = None,
    time_off_requests: Sequence | None = None,
    session=None,
) -> dict:
    """Build attendance and time-off aggregate metrics for the context."""
    if attendances is None and session is not None:
        from app.models.attendance import Attendance
        attendances = (
            session.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.attendance_date >= period_start,
                Attendance.attendance_date <= period_end,
            )
            .all()
        )
    elif attendances is None:
        attendances = []

    if time_off_requests is None and session is not None:
        from app.models.time_off_request import TimeOffRequest
        time_off_requests = (
            session.query(TimeOffRequest)
            .filter(
                TimeOffRequest.employee_id == employee_id,
                TimeOffRequest.status == "approved",
                TimeOffRequest.start_date <= period_end,
                TimeOffRequest.end_date >= period_start,
            )
            .all()
        )
    elif time_off_requests is None:
        time_off_requests = []

    worked_hours = Decimal("0.00")
    present_days = 0
    absent_days = 0
    for att in attendances:
        if att.status in ("present", "corrected"):
            present_days += 1
            if att.worked_hours is not None:
                worked_hours += Decimal(str(att.worked_hours))
        elif att.status == "absent":
            absent_days += 1

    paid_leave_days = Decimal("0.00")
    unpaid_leave_days = Decimal("0.00")
    for req in time_off_requests:
        req_days = Decimal(str(req.requested_days or 0.0))
        leave_type = getattr(req, "time_off_type", None)
        if leave_type is not None and not leave_type.requires_allocation:
            unpaid_leave_days += req_days
        else:
            paid_leave_days += req_days

    return {
        "worked_hours": _quantize_money(worked_hours),
        "present_days": present_days,
        "absent_days": absent_days,
        "paid_leave_days": _quantize_money(paid_leave_days),
        "unpaid_leave_days": _quantize_money(unpaid_leave_days),
    }


def calculate_payroll(
    session=None,
    employee_id: uuid.UUID | str | None = None,
    period_start: date | None = None,
    period_end: date | None = None,
    salary_structure_id: uuid.UUID | str | None = None,
    contracts: Sequence | None = None,
    attendances: Sequence | None = None,
    time_off_requests: Sequence | None = None,
) -> PayrollResult:
    """Calculate deterministic payroll components for an employee/period.

    :param session: SQLAlchemy DB session (optional if all models passed).
    :param employee_id: Employee UUID or string.
    :param period_start: Start date of payroll period.
    :param period_end: End date of payroll period.
    :param salary_structure_id: Optional explicit SalaryStructure override.
    :param contracts: Optional sequence of Employee Contracts for in-memory testing.
    :param attendances: Optional sequence of Attendance records for in-memory testing.
    :param time_off_requests: Optional sequence of TimeOffRequest records for testing.
    :return: Typed PayrollResult object.
    :raises PayrollCalculationError: On missing or ambiguous contracts, missing structure, or invalid rules.
    """
    if period_start is None or period_end is None:
        raise PayrollCalculationError("period_start and period_end are required.")

    if period_end < period_start:
        raise PayrollCalculationError("period_end cannot precede period_start.")

    if employee_id is None:
        raise PayrollCalculationError("employee_id is required.")

    emp_uuid = uuid.UUID(str(employee_id)) if isinstance(employee_id, str) else employee_id

    # 1. Resolve Applicable Contract
    try:
        contract = get_applicable_contract(
            emp_uuid, target_date=period_start, contracts=contracts, session=session
        )
    except (NoApplicableContractError, ContractConflictError) as err:
        raise MissingApplicableContractError(str(err)) from err

    # 2. Resolve Salary Structure
    structure = None
    if salary_structure_id is not None:
        from app.models.salary_structure import SalaryStructure
        struct_uuid = uuid.UUID(str(salary_structure_id)) if isinstance(salary_structure_id, str) else salary_structure_id
        structure = session.get(SalaryStructure, struct_uuid) if session else None
    elif getattr(contract, "salary_structure", None) is not None:
        structure = contract.salary_structure
    elif getattr(contract, "salary_structure_id", None) is not None and session:
        from app.models.salary_structure import SalaryStructure
        structure = session.get(SalaryStructure, contract.salary_structure_id)

    if structure is None:
        raise MissingSalaryStructureError(
            f"No salary structure assigned to contract '{contract.contract_reference}' "
            f"or provided for employee '{emp_uuid}'."
        )

    if not structure.is_active:
        raise MissingSalaryStructureError(
            f"Salary structure '{structure.name}' ({structure.code}) is inactive."
        )

    # 3. Retrieve Active Rules Ordered by Sequence
    active_rules = get_ordered_active_rules(structure.rules)
    if not active_rules:
        raise NoActiveRulesError(
            f"Salary structure '{structure.name}' contains no active salary rules."
        )

    # 4. Build Context
    contract_salary = _quantize_money(contract.salary or Decimal("0.00"))
    metrics = _build_context_attendance_timeoff(
        emp_uuid, period_start, period_end, attendances, time_off_requests, session
    )

    ctx = PayrollContext(
        employee_id=emp_uuid,
        contract_id=contract.id,
        period_start=period_start,
        period_end=period_end,
        contract_salary=contract_salary,
        worked_hours=metrics["worked_hours"],
        present_days=metrics["present_days"],
        absent_days=metrics["absent_days"],
        paid_leave_days=metrics["paid_leave_days"],
        unpaid_leave_days=metrics["unpaid_leave_days"],
    )

    # 5. Execute Ordered Rules
    evaluated_results: list[RuleEvaluationResult] = []
    total_earnings = Decimal("0.00")
    total_allowances = Decimal("0.00")
    total_deductions = Decimal("0.00")
    total_contributions = Decimal("0.00")
    basic_salary = Decimal("0.00")
    has_basic_rule = False

    for rule in active_rules:
        calc_method = rule.calculation_method
        category = rule.category
        rule_code = rule.code
        base_amount: Decimal | None = None
        calculated_amount = Decimal("0.00")

        env = ctx.get_eval_environment()

        if calc_method == "fixed":
            if rule.fixed_amount is None:
                raise PayrollCalculationError(
                    f"Rule '{rule_code}' method is fixed but fixed_amount is None."
                )
            calculated_amount = _quantize_money(rule.fixed_amount)

        elif calc_method == "percentage":
            if rule.percentage is None:
                raise PayrollCalculationError(
                    f"Rule '{rule_code}' method is percentage but percentage is None."
                )
            # Determine base: Check if rule formula identifies base or default to contract/basic salary
            base_key = rule.formula.strip() if rule.formula and rule.formula.strip() else "CONTRACT_SALARY"
            if base_key.upper() in env:
                base_amount = env[base_key.upper()]
            elif "BASIC" in env:
                base_amount = env["BASIC"]
            else:
                base_amount = contract_salary

            pct = Decimal(str(rule.percentage)) / Decimal("100")
            calculated_amount = _quantize_money(base_amount * pct)

        elif calc_method == "formula":
            if not rule.formula:
                raise PayrollCalculationError(
                    f"Rule '{rule_code}' method is formula but formula string is empty."
                )
            raw_result = evaluate_formula(rule.formula, env)
            calculated_amount = _quantize_money(raw_result)

        else:
            raise PayrollCalculationError(
                f"Unsupported calculation_method '{calc_method}' on rule '{rule_code}'."
            )

        # Store in context for later rules to reference
        ctx.rule_results[rule_code] = calculated_amount

        # Accumulate Category Totals
        if category == "earning":
            total_earnings += calculated_amount
            if rule_code.upper() == "BASIC" or not has_basic_rule:
                basic_salary = calculated_amount
                has_basic_rule = True
        elif category == "allowance":
            total_allowances += calculated_amount
        elif category == "deduction":
            total_deductions += calculated_amount
        elif category == "contribution":
            total_contributions += calculated_amount

        evaluated_results.append(
            RuleEvaluationResult(
                rule_id=rule.id,
                rule_code=rule_code,
                rule_name=rule.name,
                category=category,
                calculation_method=calc_method,
                sequence=rule.sequence,
                base_amount=base_amount,
                calculated_amount=calculated_amount,
            )
        )

    # Basic salary fallback to contract salary if no earning rule set it
    if not has_basic_rule:
        basic_salary = contract_salary

    # Compute Gross and Net Salary
    # Basic + Earnings + Allowances = Gross (If basic is already included in total_earnings, basic is not double-added)
    if any(r.code.upper() == "BASIC" for r in active_rules):
        gross_salary = total_earnings + total_allowances
    else:
        gross_salary = basic_salary + total_earnings + total_allowances

    net_salary = gross_salary - total_deductions

    return PayrollResult(
        employee_id=emp_uuid,
        contract_id=contract.id,
        salary_structure_id=structure.id,
        period_start=period_start,
        period_end=period_end,
        rule_results=evaluated_results,
        basic_salary=_quantize_money(basic_salary),
        total_earnings=_quantize_money(total_earnings),
        total_allowances=_quantize_money(total_allowances),
        gross_salary=_quantize_money(gross_salary),
        total_deductions=_quantize_money(total_deductions),
        total_contributions=_quantize_money(total_contributions),
        net_salary=_quantize_money(net_salary),
    )
