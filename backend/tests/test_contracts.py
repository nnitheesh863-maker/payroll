"""
Phase 2 Employee Contract unit tests.

Tests Contract creation, relationships (Employee, WorkingSchedule), date validation,
salary non-negativity, contract date applicability, single contract selection, and
overlapping contract detection.
"""

from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, WorkingSchedule
from app.services.contract_service import (
    ContractConflictError,
    ContractOverlapError,
    NoApplicableContractError,
    get_applicable_contract,
    is_contract_applicable_on_date,
    validate_contract_dates,
    validate_no_overlapping_contracts,
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


def _employee(code="EMP-001", email="ada@example.com"):
    return Employee(
        employee_code=code,
        first_name="Ada",
        last_name="Lovelace",
        email=email,
        joining_date=date(2024, 1, 15),
    )


def _schedule(code="STD-40"):
    return WorkingSchedule(code=code, name="Standard Schedule")


def _contract(employee, ref="CTR-001", start=date(2026, 1, 1), end=None, salary=50000.0, **kwargs):
    params = {
        "employee": employee,
        "contract_reference": ref,
        "contract_type": "full_time",
        "start_date": start,
        "end_date": end,
        "status": "active",
        "salary": salary,
        "currency": "USD",
    }
    params.update(kwargs)
    return Contract(**params)


# ── 9. Contract creation ───────────────────────────────────────────
def test_contract_creation(session):
    emp = _employee()
    ctr = _contract(emp)
    session.add_all([emp, ctr])
    session.commit()

    fetched = session.get(Contract, ctr.id)
    assert fetched is not None
    assert fetched.contract_reference == "CTR-001"
    assert fetched.start_date == date(2026, 1, 1)
    assert fetched.end_date is None
    assert fetched.status == "active"
    assert fetched.salary == 50000.0
    assert fetched.created_at is not None


# ── 10. Employee → Contract relationship ───────────────────────────
def test_employee_contract_relationship(session):
    emp = _employee()
    ctr1 = _contract(emp, ref="CTR-001", start=date(2026, 1, 1), end=date(2026, 6, 30))
    ctr2 = _contract(emp, ref="CTR-002", start=date(2026, 7, 1))
    session.add_all([emp, ctr1, ctr2])
    session.commit()

    assert len(emp.contracts) == 2
    assert ctr1.employee == emp
    assert ctr2.employee == emp
    assert emp.contracts == [ctr1, ctr2]


# ── 11. Contract → Working Schedule relationship ───────────────────
def test_contract_working_schedule_relationship(session):
    emp = _employee()
    sched = _schedule()
    ctr = _contract(emp, working_schedule=sched)
    session.add_all([emp, sched, ctr])
    session.commit()

    assert ctr.working_schedule == sched
    assert ctr.working_schedule_id == sched.id
    assert sched.contracts == [ctr]


# ── 12. End date cannot precede start date ─────────────────────────
def test_end_date_cannot_precede_start_date(session):
    emp = _employee()
    session.add(emp)
    session.commit()

    # Service validation
    with pytest.raises(ValueError, match="cannot precede start_date"):
        validate_contract_dates(start_date=date(2026, 6, 1), end_date=date(2026, 1, 1))

    # DB CheckConstraint validation
    ctr = _contract(emp, start=date(2026, 6, 1), end=date(2026, 1, 1))
    session.add(ctr)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 13. Salary cannot be negative ──────────────────────────────────
def test_salary_cannot_be_negative(session):
    emp = _employee()
    session.add(emp)
    session.commit()

    ctr = _contract(emp, salary=-1000.0)
    session.add(ctr)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 14. Contract date applicability ───────────────────────────────
def test_contract_date_applicability():
    ctr = Contract(
        contract_reference="CTR-001",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
    )
    assert is_contract_applicable_on_date(ctr, date(2026, 1, 1)) is True
    assert is_contract_applicable_on_date(ctr, date(2026, 3, 15)) is True
    assert is_contract_applicable_on_date(ctr, date(2026, 6, 30)) is True
    assert is_contract_applicable_on_date(ctr, date(2025, 12, 31)) is False
    assert is_contract_applicable_on_date(ctr, date(2026, 7, 1)) is False


# ── 15. No applicable contract ────────────────────────────────────
def test_no_applicable_contract(session):
    emp = _employee()
    ctr = _contract(emp, start=date(2026, 1, 1), end=date(2026, 6, 30))
    session.add_all([emp, ctr])
    session.commit()

    with pytest.raises(NoApplicableContractError, match="No applicable contract found"):
        get_applicable_contract(emp.id, date(2026, 7, 15), session=session)


# ── 16. Single applicable contract ─────────────────────────────────
def test_single_applicable_contract(session):
    emp = _employee()
    ctr1 = _contract(emp, ref="CTR-001", start=date(2026, 1, 1), end=date(2026, 6, 30))
    ctr2 = _contract(emp, ref="CTR-002", start=date(2026, 7, 1))
    session.add_all([emp, ctr1, ctr2])
    session.commit()

    app1 = get_applicable_contract(emp.id, date(2026, 3, 1), session=session)
    assert app1.contract_reference == "CTR-001"

    app2 = get_applicable_contract(emp.id, date(2026, 8, 1), session=session)
    assert app2.contract_reference == "CTR-002"


# ── 17. Overlapping contract detection ─────────────────────────────
def test_overlapping_contract_detection(session):
    emp = _employee()
    ctr1 = _contract(emp, ref="CTR-001", start=date(2026, 1, 1), end=date(2026, 6, 30))
    session.add_all([emp, ctr1])
    session.commit()

    # Attempting to create CTR-002: 2026-05-01 -> 2026-12-31 overlaps with CTR-001
    existing_contracts = emp.contracts
    with pytest.raises(ContractOverlapError, match="overlap with existing contract"):
        validate_no_overlapping_contracts(
            existing_contracts,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 12, 31),
        )

    # Valid non-overlapping historical contract passes
    validate_no_overlapping_contracts(
        existing_contracts,
        start_date=date(2025, 1, 1),
        end_date=date(2025, 12, 31),
    )


# ── 18. Open-ended contract overlap detection ──────────────────────
def test_open_ended_contract_overlap_detection(session):
    emp = _employee()
    ctr1 = _contract(emp, ref="CTR-001", start=date(2026, 1, 1), end=None)
    session.add_all([emp, ctr1])
    session.commit()

    # Attempting to create open-ended contract CTR-002 starting 2026-06-01 overlaps
    existing_contracts = emp.contracts
    with pytest.raises(ContractOverlapError, match="overlap with existing contract"):
        validate_no_overlapping_contracts(
            existing_contracts,
            start_date=date(2026, 6, 1),
            end_date=None,
        )

    # Test ContractConflictError when querying target date if two overlapping contracts exist
    ctr2 = _contract(emp, ref="CTR-002", start=date(2026, 6, 1), end=None)
    session.add(ctr2)
    session.commit()

    with pytest.raises(ContractConflictError, match="Multiple contracts"):
        get_applicable_contract(emp.id, date(2026, 7, 1), session=session)
