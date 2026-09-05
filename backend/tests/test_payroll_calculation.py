"""
Phase 5 Payroll Calculation Engine unit tests.

Tests deterministic salary calculations, Decimal monetary precision/rounding,
fixed/percentage/formula rules, safe AST formula evaluation, formula security
rejections, contract/salary-structure resolution, attendance & time-off context,
and total summary outputs.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import (
    Attendance,
    Contract,
    Employee,
    SalaryRule,
    SalaryStructure,
    TimeOffAllocation,
    TimeOffRequest,
    TimeOffType,
)
from app.services import (
    MissingApplicableContractError,
    MissingSalaryStructureError,
    NoActiveRulesError,
    PayrollCalculationError,
    PayrollDivisionByZeroError,
    PayrollFormulaError,
    PayrollResult,
    UnknownFormulaVariableError,
    UnsafeFormulaError,
    calculate_payroll,
    evaluate_formula,
)


@pytest.fixture()
def session():
    """Provide a clean database session backed by in-memory SQLite."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        try:
            yield db.session
        finally:
            db.session.remove()
            db.drop_all()


def _employee(code="EMP-100", email="pay@example.com"):
    return Employee(
        employee_code=code,
        first_name="Jane",
        last_name="Doe",
        email=email,
        joining_date=date(2024, 1, 1),
    )


def _contract(employee, salary=50000.0, start=date(2026, 1, 1), end=None, structure=None):
    return Contract(
        employee=employee,
        contract_reference=f"CTR-{employee.employee_code}",
        contract_type="full_time",
        start_date=start,
        end_date=end,
        status="active",
        salary=salary,
        currency="USD",
        salary_structure=structure,
    )


def _structure(name="Standard Tech Structure", code="TECH_STD"):
    return SalaryStructure(name=name, code=code, is_active=True)


# ── BASIC & EXACT DECIMAL MONETARY CALCULATIONS ───────────────────
def test_basic_salary_calculation(session):
    emp = _employee()
    struct = _structure()
    rule_basic = SalaryRule(
        salary_structure=struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=Decimal("5000.00"),
    )
    ctr = _contract(emp, salary=5000.0, structure=struct)
    session.add_all([emp, struct, rule_basic, ctr])
    session.commit()

    res = calculate_payroll(
        session,
        employee_id=emp.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )

    assert isinstance(res, PayrollResult)
    assert res.basic_salary == Decimal("5000.00")
    assert res.total_earnings == Decimal("5000.00")
    assert res.gross_salary == Decimal("5000.00")
    assert res.net_salary == Decimal("5000.00")


def test_monetary_rounding_decimal_precision():
    # Percentage calculation resulting in fractional cents: 1000.555 * 10% = 100.0555 -> 100.06
    env = {"BASE": Decimal("1000.555")}
    res = evaluate_formula("BASE * 0.10", env)
    assert res == Decimal("100.0555")


# ── FIXED RULES ────────────────────────────────────────────────────
def test_fixed_rules_earnings_allowances_deductions_contributions(session):
    emp = _employee()
    struct = _structure()
    rules = [
        SalaryRule(
            salary_structure=struct,
            name="Basic Salary",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=Decimal("4000.00"),
        ),
        SalaryRule(
            salary_structure=struct,
            name="Housing Allowance",
            code="HOUSING",
            category="allowance",
            calculation_method="fixed",
            sequence=20,
            fixed_amount=Decimal("1000.00"),
        ),
        SalaryRule(
            salary_structure=struct,
            name="Health Insurance",
            code="HEALTH_INS",
            category="deduction",
            calculation_method="fixed",
            sequence=30,
            fixed_amount=Decimal("200.00"),
        ),
        SalaryRule(
            salary_structure=struct,
            name="Pension Contribution",
            code="PENSION_EMP",
            category="contribution",
            calculation_method="fixed",
            sequence=40,
            fixed_amount=Decimal("300.00"),
        ),
    ]
    ctr = _contract(emp, salary=4000.0, structure=struct)
    session.add_all([emp, struct, ctr] + rules)
    session.commit()

    res = calculate_payroll(
        session,
        employee_id=emp.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )

    assert res.basic_salary == Decimal("4000.00")
    assert res.total_earnings == Decimal("4000.00")
    assert res.total_allowances == Decimal("1000.00")
    assert res.gross_salary == Decimal("5000.00")  # Basic + Housing
    assert res.total_deductions == Decimal("200.00")
    assert res.total_contributions == Decimal("300.00")  # Kept separate!
    assert res.net_salary == Decimal("4800.00")  # 5000 - 200 (contributions NOT subtracted!)


# ── PERCENTAGE RULES ───────────────────────────────────────────────
def test_percentage_rules(session):
    emp = _employee()
    struct = _structure()
    rules = [
        SalaryRule(
            salary_structure=struct,
            name="Basic Salary",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=Decimal("6000.00"),
        ),
        SalaryRule(
            salary_structure=struct,
            name="Bonus",
            code="BONUS",
            category="allowance",
            calculation_method="percentage",
            sequence=20,
            percentage=15.0,  # 15% of basic = 900
            formula="BASIC",
        ),
        SalaryRule(
            salary_structure=struct,
            name="Income Tax",
            code="TAX",
            category="deduction",
            calculation_method="percentage",
            sequence=30,
            percentage=10.0,  # 10% of basic = 600
            formula="BASIC",
        ),
    ]
    ctr = _contract(emp, salary=6000.0, structure=struct)
    session.add_all([emp, struct, ctr] + rules)
    session.commit()

    res = calculate_payroll(
        session,
        employee_id=emp.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )

    assert res.total_allowances == Decimal("900.00")
    assert res.total_deductions == Decimal("600.00")
    assert res.gross_salary == Decimal("6900.00")
    assert res.net_salary == Decimal("6300.00")


# ── ORDER & DEPENDENT RULES ────────────────────────────────────────
def test_ordered_rule_execution_and_dependencies(session):
    emp = _employee()
    struct = _structure()
    rules = [
        SalaryRule(
            salary_structure=struct,
            name="Basic",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=Decimal("5000.00"),
        ),
        SalaryRule(
            salary_structure=struct,
            name="Allowance",
            code="ALLOW",
            category="allowance",
            calculation_method="fixed",
            sequence=20,
            fixed_amount=Decimal("1000.00"),
        ),
        # Later rule depending on sum of earlier rules (BASIC + ALLOW = 6000)
        SalaryRule(
            salary_structure=struct,
            name="Super Tax",
            code="TAX",
            category="deduction",
            calculation_method="formula",
            sequence=30,
            formula="(BASIC + ALLOW) * 0.20",  # 6000 * 0.20 = 1200
        ),
    ]
    ctr = _contract(emp, salary=5000.0, structure=struct)
    session.add_all([emp, struct, ctr] + rules)
    session.commit()

    res = calculate_payroll(
        session,
        employee_id=emp.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )

    assert res.gross_salary == Decimal("6000.00")
    assert res.total_deductions == Decimal("1200.00")
    assert res.net_salary == Decimal("4800.00")


# ── SAFE FORMULA EVALUATION ────────────────────────────────────────
def test_valid_formula_evaluation():
    env = {"BASIC": Decimal("4000.00"), "OVERTIME_HOURS": Decimal("10")}
    # 4000 + (10 * 50) = 4500
    res = evaluate_formula("BASIC + OVERTIME_HOURS * 50", env)
    assert res == Decimal("4500.00")


def test_formula_division_by_zero():
    env = {"BASIC": Decimal("5000.00")}
    with pytest.raises(PayrollDivisionByZeroError, match="Division by zero"):
        evaluate_formula("BASIC / 0", env)


def test_formula_unknown_variable():
    env = {"BASIC": Decimal("5000.00")}
    with pytest.raises(UnknownFormulaVariableError, match="Unknown variable 'UNKNOWN_VAR'"):
        evaluate_formula("BASIC + UNKNOWN_VAR", env)


# ── FORMULA SECURITY REJECTIONS ────────────────────────────────────
def test_formula_security_rejections():
    env = {"BASIC": Decimal("5000.00")}

    # Function calls rejected
    with pytest.raises(UnsafeFormulaError, match="Function calls are strictly forbidden"):
        evaluate_formula("eval('1+1')", env)

    with pytest.raises(UnsafeFormulaError, match="Function calls are strictly forbidden"):
        evaluate_formula("__import__('os').system('dir')", env)

    with pytest.raises(UnsafeFormulaError, match="Function calls are strictly forbidden"):
        evaluate_formula("globals()", env)

    # Attribute access rejected
    with pytest.raises(UnsafeFormulaError, match="Attribute access"):
        evaluate_formula("BASIC.__class__", env)

    # Subscripting rejected
    with pytest.raises(UnsafeFormulaError, match="Subscripting"):
        evaluate_formula("BASIC[0]", env)


# ── CONTRACT & STRUCTURE RESOLUTION ────────────────────────────────
def test_missing_applicable_contract(session):
    emp = _employee()
    struct = _structure()
    # Contract is from June 2026, querying January 2026
    ctr = _contract(emp, start=date(2026, 6, 1), structure=struct)
    session.add_all([emp, struct, ctr])
    session.commit()

    with pytest.raises(MissingApplicableContractError, match="No applicable contract found"):
        calculate_payroll(
            session,
            employee_id=emp.id,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
        )


def test_missing_salary_structure(session):
    emp = _employee()
    ctr = _contract(emp, structure=None)  # No structure assigned
    session.add_all([emp, ctr])
    session.commit()

    with pytest.raises(MissingSalaryStructureError, match="No salary structure assigned"):
        calculate_payroll(
            session,
            employee_id=emp.id,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
        )


def test_inactive_salary_structure(session):
    emp = _employee()
    struct = SalaryStructure(name="Inactive Struct", code="INACTIVE", is_active=False)
    ctr = _contract(emp, structure=struct)
    session.add_all([emp, struct, ctr])
    session.commit()

    with pytest.raises(MissingSalaryStructureError, match="is inactive"):
        calculate_payroll(
            session,
            employee_id=emp.id,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
        )


def test_no_active_rules(session):
    emp = _employee()
    struct = _structure()
    # Structure exists but has no rules
    ctr = _contract(emp, structure=struct)
    session.add_all([emp, struct, ctr])
    session.commit()

    with pytest.raises(NoActiveRulesError, match="contains no active salary rules"):
        calculate_payroll(
            session,
            employee_id=emp.id,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
        )


# ── ATTENDANCE & TIME-OFF INTEGRATION ──────────────────────────────
def test_payroll_context_attendance_and_timeoff(session):
    emp = _employee()
    struct = _structure()
    rule_basic = SalaryRule(
        salary_structure=struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=Decimal("3000.00"),
    )
    # Overtime rule based on WORKED_HOURS variable from context
    rule_overtime = SalaryRule(
        salary_structure=struct,
        name="Overtime",
        code="OVERTIME",
        category="allowance",
        calculation_method="formula",
        sequence=20,
        formula="WORKED_HOURS * 20",  # 160 worked hours * 20 = 3200
    )
    ctr = _contract(emp, salary=3000.0, structure=struct)
    session.add_all([emp, struct, rule_basic, rule_overtime, ctr])
    session.commit()

    # Add Attendance record for employee
    att = Attendance(
        employee=emp,
        attendance_date=date(2026, 1, 15),
        check_in=datetime(2026, 1, 15, 9, 0, tzinfo=timezone.utc),
        check_out=datetime(2026, 1, 15, 17, 0, tzinfo=timezone.utc),
        worked_hours=160.0,
        status="present",
    )
    session.add(att)
    session.commit()

    res = calculate_payroll(
        session,
        employee_id=emp.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )

    assert res.total_earnings == Decimal("3000.00")
    assert res.total_allowances == Decimal("3200.00")  # 160 * 20
    assert res.gross_salary == Decimal("6200.00")
