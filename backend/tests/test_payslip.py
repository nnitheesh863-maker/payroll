"""
Phase 6 Payslip unit tests.

Tests Payslip and PayslipLine fields, exact Decimal monetary precision,
line item sequence ordering, unique constraints, and Payrun aggregate totals calculations.
"""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import (
    Contract,
    Employee,
    Payrun,
    Payslip,
    PayslipLine,
    SalaryRule,
    SalaryStructure,
)
from app.services import (
    compute_payrun,
    create_payrun,
    get_payrun_totals,
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


def _employee(code="EMP-100", email="payslip@example.com"):
    return Employee(
        employee_code=code,
        first_name="Bob",
        last_name="Martin",
        email=email,
        joining_date=date(2024, 1, 1),
    )


def _structure(name="Executive Structure", code="EXEC_STD"):
    struct = SalaryStructure(name=name, code=code, is_active=True)
    rule_basic = SalaryRule(
        salary_structure=struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=Decimal("10000.00"),
    )
    rule_allow = SalaryRule(
        salary_structure=struct,
        name="Executive Allowance",
        code="EXEC_ALLOW",
        category="allowance",
        calculation_method="fixed",
        sequence=20,
        fixed_amount=Decimal("2000.00"),
    )
    rule_tax = SalaryRule(
        salary_structure=struct,
        name="Income Tax",
        code="TAX",
        category="deduction",
        calculation_method="percentage",
        sequence=30,
        percentage=20.0,
        formula="BASIC",
    )
    rule_pension = SalaryRule(
        salary_structure=struct,
        name="Employer Pension",
        code="PENSION_ER",
        category="contribution",
        calculation_method="fixed",
        sequence=40,
        fixed_amount=Decimal("500.00"),
    )
    return struct


def _contract(employee, salary=10000.0, start=date(2026, 1, 1), structure=None):
    return Contract(
        employee=employee,
        contract_reference=f"CTR-{employee.employee_code}",
        contract_type="full_time",
        start_date=start,
        status="active",
        salary=salary,
        currency="USD",
        salary_structure=structure,
    )


# ── PAYSLIP & PAYSLIP LINE FIELDS & PRECISION ──────────────────────
def test_payslip_and_line_fields_and_decimal_precision(session):
    struct = _structure()
    emp = _employee()
    ctr = _contract(emp, salary=10000.0, structure=struct)
    session.add_all([struct, emp, ctr])
    session.commit()

    pr = create_payrun(
        session,
        name="Exec Jan Payroll",
        reference="PR-EXEC-01",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()

    compute_payrun(session, pr.id)
    session.commit()

    slip = pr.payslips[0]
    assert slip.employee_id == emp.id
    assert slip.contract_id == ctr.id
    assert slip.salary_structure_id == struct.id
    assert slip.period_start == date(2026, 1, 1)
    assert slip.period_end == date(2026, 1, 31)

    # Exact Decimal checks
    assert slip.basic_salary == Decimal("10000.00")
    assert slip.total_earnings == Decimal("10000.00")
    assert slip.total_allowances == Decimal("2000.00")
    assert slip.gross_salary == Decimal("12000.00")
    assert slip.total_deductions == Decimal("2000.00")  # 20% of 10000
    assert slip.total_contributions == Decimal("500.00")
    assert slip.net_salary == Decimal("10000.00")  # 12000 - 2000

    # Payslip lines sequence ordering & traceability
    assert len(slip.lines) == 4
    sequences = [line.sequence for line in slip.lines]
    assert sequences == [10, 20, 30, 40]

    line_codes = [line.rule_code for line in slip.lines]
    assert line_codes == ["BASIC", "EXEC_ALLOW", "TAX", "PENSION_ER"]


# ── PAYRUN AGGREGATE TOTALS ─────────────────────────────────────────
def test_payrun_totals_aggregation(session):
    struct = _structure()
    emp1 = _employee("EMP-001", "one@example.com")
    emp2 = _employee("EMP-002", "two@example.com")
    ctr1 = _contract(emp1, salary=10000.0, structure=struct)
    ctr2 = _contract(emp2, salary=10000.0, structure=struct)
    session.add_all([struct, emp1, emp2, ctr1, ctr2])
    session.commit()

    pr = create_payrun(
        session,
        name="Multi Batch",
        reference="PR-MULTI",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id, emp2.id],
    )
    session.commit()

    compute_payrun(session, pr.id)
    session.commit()

    totals = get_payrun_totals(pr)
    assert totals["payslip_count"] == 2
    assert totals["total_basic_salary"] == Decimal("20000.00")
    assert totals["total_allowances"] == Decimal("4000.00")
    assert totals["total_gross_salary"] == Decimal("24000.00")
    assert totals["total_deductions"] == Decimal("4000.00")
    assert totals["total_contributions"] == Decimal("1000.00")
    assert totals["total_net_salary"] == Decimal("20000.00")


# ── PAYSLIP UNIQUENESS CONSTRAINT ──────────────────────────────────
def test_duplicate_payslip_prevention(session):
    struct = _structure()
    emp = _employee()
    ctr = _contract(emp, salary=10000.0, structure=struct)
    session.add_all([struct, emp, ctr])
    session.commit()

    pr = create_payrun(
        session,
        name="Unique Test",
        reference="PR-UNIQUE",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()

    slip1 = Payslip(
        payrun=pr,
        employee=emp,
        contract=ctr,
        salary_structure=struct,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )
    slip2 = Payslip(
        payrun=pr,
        employee=emp,  # Duplicate payslip for same payrun & employee!
        contract=ctr,
        salary_structure=struct,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )
    session.add_all([slip1, slip2])
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()
