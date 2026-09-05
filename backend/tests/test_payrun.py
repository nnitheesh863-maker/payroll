"""
Phase 6 Payrun unit tests.

Tests Payrun creation, employee scope management, batch computation using Phase 5 engine,
transactional rollback, recomputation idempotency, state transitions, validation, and marking paid.
"""

from datetime import date
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import (
    Contract,
    Employee,
    Payrun,
    PayrunEmployee,
    Payslip,
    SalaryRule,
    SalaryStructure,
)
from app.services import (
    PayrunComputationError,
    PayrunStateError,
    PayrunValidationError,
    add_employee_to_payrun,
    compute_payrun,
    create_payrun,
    mark_payrun_paid,
    remove_employee_from_payrun,
    validate_payrun,
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


def _employee(code="EMP-100", email="payrun@example.com"):
    return Employee(
        employee_code=code,
        first_name="Alice",
        last_name="Smith",
        email=email,
        joining_date=date(2024, 1, 1),
    )


def _structure(name="Tech Standard", code="TECH_STD"):
    struct = SalaryStructure(name=name, code=code, is_active=True)
    rule_basic = SalaryRule(
        salary_structure=struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=Decimal("5000.00"),
    )
    rule_tax = SalaryRule(
        salary_structure=struct,
        name="Income Tax",
        code="TAX",
        category="deduction",
        calculation_method="percentage",
        sequence=20,
        percentage=10.0,
        formula="BASIC",
    )
    return struct


def _contract(employee, salary=5000.0, start=date(2026, 1, 1), structure=None):
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


# ── PAYRUN CREATION & SCOPE ─────────────────────────────────────────
def test_payrun_creation_valid(session):
    struct = _structure()
    emp1 = _employee("EMP-001", "one@example.com")
    emp2 = _employee("EMP-002", "two@example.com")
    session.add_all([struct, emp1, emp2])
    session.commit()

    pr = create_payrun(
        session,
        name="January 2026 Batch",
        reference="PR-2026-01",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id, emp2.id],
    )
    session.commit()

    assert pr.id is not None
    assert pr.status == "draft"
    assert len(pr.payrun_employees) == 2
    assert pr.salary_structure == struct


def test_payrun_creation_invalid_period(session):
    struct = _structure()
    session.add(struct)
    session.commit()

    with pytest.raises(PayrunValidationError, match="cannot precede"):
        create_payrun(
            session,
            name="Invalid Period",
            reference="PR-ERR-01",
            period_start=date(2026, 1, 31),
            period_end=date(2026, 1, 1),
            salary_structure_id=struct.id,
        )


def test_payrun_creation_inactive_structure(session):
    struct = SalaryStructure(name="Inactive", code="INACTIVE", is_active=False)
    session.add(struct)
    session.commit()

    with pytest.raises(PayrunValidationError, match="is inactive"):
        create_payrun(
            session,
            name="Inactive Struct Payrun",
            reference="PR-INACTIVE",
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            salary_structure_id=struct.id,
        )


def test_payrun_scope_duplicate_employee_prevention(session):
    struct = _structure()
    emp = _employee()
    session.add_all([struct, emp])
    session.commit()

    with pytest.raises(PayrunValidationError, match="Duplicate employee_id"):
        create_payrun(
            session,
            name="Dup Test",
            reference="PR-DUP",
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            salary_structure_id=struct.id,
            employee_ids=[emp.id, emp.id],
        )


def test_add_and_remove_employee_from_payrun(session):
    struct = _structure()
    emp1 = _employee("EMP-001", "one@example.com")
    emp2 = _employee("EMP-002", "two@example.com")
    session.add_all([struct, emp1, emp2])
    session.commit()

    pr = create_payrun(
        session,
        name="Scope Test",
        reference="PR-SCOPE",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id],
    )
    session.commit()

    # Add emp2
    add_employee_to_payrun(session, pr.id, emp2.id)
    session.commit()
    assert len(pr.payrun_employees) == 2

    # Remove emp1
    removed = remove_employee_from_payrun(session, pr.id, emp1.id)
    session.commit()
    assert removed is True
    assert len(pr.payrun_employees) == 1


# ── COMPUTE & RECOMPUTATION ─────────────────────────────────────────
def test_compute_payrun_success(session):
    struct = _structure()
    emp1 = _employee("EMP-001", "one@example.com")
    emp2 = _employee("EMP-002", "two@example.com")
    ctr1 = _contract(emp1, salary=5000.0, structure=struct)
    ctr2 = _contract(emp2, salary=6000.0, structure=struct)
    session.add_all([struct, emp1, emp2, ctr1, ctr2])
    session.commit()

    pr = create_payrun(
        session,
        name="Jan Payroll",
        reference="PR-2026-01-COMP",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id, emp2.id],
    )
    session.commit()

    computed_pr = compute_payrun(session, pr.id)
    session.commit()

    assert computed_pr.status == "computed"
    assert computed_pr.computed_at is not None
    assert len(computed_pr.payslips) == 2

    # Verify payslip totals & lines
    slip1 = next(s for s in computed_pr.payslips if s.employee_id == emp1.id)
    assert slip1.basic_salary == Decimal("5000.00")
    assert slip1.gross_salary == Decimal("5000.00")
    assert slip1.total_deductions == Decimal("500.00")  # 10% tax
    assert slip1.net_salary == Decimal("4500.00")
    assert len(slip1.lines) == 2


def test_recompute_payrun_idempotent(session):
    struct = _structure()
    emp = _employee()
    ctr = _contract(emp, salary=5000.0, structure=struct)
    session.add_all([struct, emp, ctr])
    session.commit()

    pr = create_payrun(
        session,
        name="Recompute Test",
        reference="PR-RECOMP",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()

    compute_payrun(session, pr.id)
    session.commit()
    assert len(pr.payslips) == 1
    assert len(pr.payslips[0].lines) == 2

    # Recompute same payrun
    compute_payrun(session, pr.id)
    session.commit()

    # Must NOT create duplicate payslips or lines
    assert len(pr.payslips) == 1
    assert len(pr.payslips[0].lines) == 2


def test_compute_payrun_transactional_rollback(session):
    struct = _structure()
    emp1 = _employee("EMP-001", "one@example.com")
    emp2 = _employee("EMP-002", "two@example.com")
    ctr1 = _contract(emp1, salary=5000.0, structure=struct)
    # emp2 has NO contract! Calculation for emp2 will fail.
    session.add_all([struct, emp1, emp2, ctr1])
    session.commit()

    pr = create_payrun(
        session,
        name="Fail Batch",
        reference="PR-FAIL",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id, emp2.id],
    )
    session.commit()

    with pytest.raises(PayrunComputationError, match="Computation failed"):
        compute_payrun(session, pr.id)

    # Transaction rolled back: No partial payslips persisted!
    session.rollback()
    assert len(pr.payslips) == 0
    assert pr.status == "draft"


# ── LIFECYCLE TRANSITIONS: DRAFT -> COMPUTED -> VALIDATED -> PAID ──
def test_payrun_lifecycle_transitions(session):
    struct = _structure()
    emp = _employee()
    ctr = _contract(emp, salary=5000.0, structure=struct)
    session.add_all([struct, emp, ctr])
    session.commit()

    pr = create_payrun(
        session,
        name="Lifecycle Test",
        reference="PR-LIFE",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()

    # Draft cannot be marked paid or validated
    with pytest.raises(PayrunStateError, match="must be in 'validated' status"):
        mark_payrun_paid(session, pr.id)
    with pytest.raises(PayrunStateError, match="must be in 'computed' status"):
        validate_payrun(session, pr.id)

    # Compute
    compute_payrun(session, pr.id)
    session.commit()
    assert pr.status == "computed"
    assert pr.payslips[0].status == "computed"

    # Validate
    validate_payrun(session, pr.id)
    session.commit()
    assert pr.status == "validated"
    assert pr.validated_at is not None
    assert pr.payslips[0].status == "validated"

    # Validated payrun cannot be recomputed!
    with pytest.raises(PayrunStateError, match="Cannot compute Payrun in status 'validated'"):
        compute_payrun(session, pr.id)

    # Mark Paid
    mark_payrun_paid(session, pr.id)
    session.commit()
    assert pr.status == "paid"
    assert pr.paid_at is not None
    assert pr.payslips[0].status == "paid"
