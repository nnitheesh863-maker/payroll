"""
Phase 3 Time-off tests — types, allocations, requests, approvals,
overlaps and balances.

SQLite-backed (in-memory); PostgreSQL schema is covered by the migration.
"""

from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import (
    Employee,
    TimeOffAllocation,
    TimeOffRequest,
    TimeOffType,
)
from app.services.timeoff_service import (
    InsufficientBalanceError,
    TimeOffOverlapError,
    TimeOffStateError,
    TimeOffValidationError,
    approve_request,
    calculate_requested_days,
    cancel_request,
    find_applicable_allocation,
    get_allocation_balance,
    get_time_off_balance,
    reject_request,
    submit_request,
    validate_allocation_values,
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


def _leave_type(code="ANNUAL", name="Annual Leave", **kwargs):
    params = {
        "code": code,
        "name": name,
        "requires_allocation": True,
        "allow_negative": False,
        "is_active": True,
    }
    params.update(kwargs)
    return TimeOffType(**params)


def _allocation(employee, leave_type, allocated=20.0, used=0.0, **kwargs):
    params = {
        "employee": employee,
        "time_off_type": leave_type,
        "allocated_days": allocated,
        "used_days": used,
        "status": "approved",
    }
    params.update(kwargs)
    return TimeOffAllocation(**params)


def _request(employee, leave_type, start, end, allocation=None, **kwargs):
    params = {
        "employee": employee,
        "time_off_type": leave_type,
        "start_date": start,
        "end_date": end,
        "requested_days": float(calculate_requested_days(start, end)),
        "status": "draft",
        "reason": "Rest",
    }
    if allocation is not None:
        params["allocation"] = allocation
    params.update(kwargs)
    return TimeOffRequest(**params)


def _approved_setup(session, allocated=20.0, used=5.0):
    """Persist employee + annual type + approved allocation; return them."""
    emp = _employee()
    typ = _leave_type()
    alloc = _allocation(emp, typ, allocated=allocated, used=used)
    session.add_all([emp, typ, alloc])
    session.commit()
    return emp, typ, alloc


# ── 11/12. Time-off types ────────────────────────────────────────
def test_create_time_off_type(session):
    typ = _leave_type(description="Paid yearly leave")
    session.add(typ)
    session.commit()

    fetched = session.get(TimeOffType, typ.id)
    assert fetched.code == "ANNUAL"
    assert fetched.requires_allocation is True
    assert fetched.allow_negative is False
    assert fetched.is_active is True
    assert fetched.created_at is not None


def test_time_off_type_unique_code_and_name(session):
    session.add(_leave_type(code="ANNUAL", name="Annual Leave"))
    session.commit()

    session.add(_leave_type(code="ANNUAL", name="Other"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()

    session.add(_leave_type(code="OTHER", name="Annual Leave"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 13/14. Allocations ───────────────────────────────────────────
def test_create_allocation(session):
    emp, typ, alloc = _approved_setup(session)

    assert alloc.employee == emp
    assert alloc.time_off_type == typ
    assert emp.time_off_allocations == [alloc]
    assert typ.allocations == [alloc]


def test_allocation_balance_derived(session):
    _, _, alloc = _approved_setup(session, allocated=20.0, used=5.0)
    balance = get_allocation_balance(alloc)
    assert balance == {
        "allocated_days": 20.0,
        "used_days": 5.0,
        "available_days": 15.0,
    }
    assert alloc.available_days == 15.0


# ── 15. Non-negative allocation validation ───────────────────────
def test_negative_allocation_rejected(session):
    with pytest.raises(TimeOffValidationError):
        validate_allocation_values(-1.0, 0.0)
    with pytest.raises(TimeOffValidationError):
        validate_allocation_values(10.0, -2.0)

    emp = _employee()
    typ = _leave_type()
    session.add_all([emp, typ])
    session.commit()
    session.add(_allocation(emp, typ, allocated=-5.0))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 17. Allocation validity period ───────────────────────────────
def test_allocation_validity_window(session):
    emp, typ, alloc = _approved_setup(session)
    alloc.start_date = date(2026, 1, 1)
    alloc.end_date = date(2026, 12, 31)
    session.commit()

    inside = find_applicable_allocation(
        [alloc], emp.id, typ.id, date(2026, 9, 1), date(2026, 9, 3)
    )
    assert inside == alloc

    outside = find_applicable_allocation(
        [alloc], emp.id, typ.id, date(2027, 1, 5), date(2027, 1, 6)
    )
    assert outside is None


# ── 18/19/20. Requests, dates, durations ─────────────────────────
def test_create_request(session):
    emp, typ, _ = _approved_setup(session)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()

    assert req.requested_days == 3.0
    assert req.status == "draft"
    assert req.employee == emp
    assert emp.time_off_requests == [req]


def test_requested_days_calculation():
    assert calculate_requested_days(date(2026, 9, 1), date(2026, 9, 1)) == 1
    assert calculate_requested_days(date(2026, 9, 1), date(2026, 9, 3)) == 3


def test_request_date_validation(session):
    emp, typ, _ = _approved_setup(session)
    with pytest.raises(TimeOffValidationError):
        calculate_requested_days(date(2026, 9, 5), date(2026, 9, 1))

    session.add(
        TimeOffRequest(
            employee=emp,
            time_off_type=typ,
            start_date=date(2026, 9, 5),
            end_date=date(2026, 9, 1),
            requested_days=1.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()

    session.add(
        TimeOffRequest(
            employee=emp,
            time_off_type=typ,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 2),
            requested_days=0.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 21/22/23. Submit + approve deducts exactly once ──────────────
def test_submit_and_approve_deducts_allocation(session):
    emp, typ, alloc = _approved_setup(session, allocated=20.0, used=5.0)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()

    submit_request(req)
    assert req.status == "submitted"
    assert alloc.used_days == 5.0  # submission deducts nothing

    approve_request(req, allocations=[alloc])
    session.commit()
    assert req.status == "approved"
    assert req.allocation == alloc
    assert alloc.used_days == 8.0
    assert get_allocation_balance(alloc)["available_days"] == 12.0

    # Approving again must not deduct a second time.
    approve_request(req, allocations=[alloc])
    session.commit()
    assert alloc.used_days == 8.0


# ── 16. Insufficient balance ─────────────────────────────────────
def test_insufficient_balance_rejected(session):
    emp, typ, alloc = _approved_setup(session, allocated=20.0, used=19.0)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()
    submit_request(req)

    with pytest.raises(InsufficientBalanceError):
        approve_request(req, allocations=[alloc])
    session.rollback()
    # Nothing was persisted: no deduction, still a draft in the database.
    assert alloc.used_days == 19.0
    assert req.status == "draft"


def test_negative_allowed_type_overdraws(session):
    emp = _employee()
    typ = _leave_type(code="UNPAID", name="Unpaid Leave", allow_negative=True)
    alloc = _allocation(emp, typ, allocated=0.0, used=0.0)
    session.add_all([emp, typ, alloc])
    session.commit()

    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()
    submit_request(req)
    approve_request(req, allocations=[alloc])
    session.commit()

    assert alloc.used_days == 3.0
    assert alloc.available_days == -3.0


def test_no_allocation_type_skips_deduction(session):
    emp = _employee()
    typ = _leave_type(
        code="UNPAID", name="Unpaid Leave", requires_allocation=False
    )
    session.add_all([emp, typ])
    session.commit()

    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()
    submit_request(req)
    approve_request(req)
    session.commit()

    assert req.status == "approved"
    assert req.allocation is None


# ── 24/25/26. Reject + cancel semantics ──────────────────────────
def test_reject_does_not_deduct(session):
    emp, typ, alloc = _approved_setup(session, allocated=20.0, used=5.0)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()
    submit_request(req)

    reject_request(req, "Peak delivery week")
    session.commit()
    assert req.status == "rejected"
    assert req.rejection_reason == "Peak delivery week"
    assert alloc.used_days == 5.0


def test_cancel_approved_restores_allocation_once(session):
    emp, typ, alloc = _approved_setup(session, allocated=20.0, used=5.0)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()
    submit_request(req)
    approve_request(req, allocations=[alloc])
    session.commit()
    assert alloc.used_days == 8.0

    cancel_request(req)
    session.commit()
    assert req.status == "cancelled"
    assert alloc.used_days == 5.0

    with pytest.raises(TimeOffStateError):
        cancel_request(req)
    session.rollback()
    assert alloc.used_days == 5.0


# ── 27. Overlapping requests ─────────────────────────────────────
def test_overlapping_requests_detected(session):
    emp, typ, alloc = _approved_setup(session)
    first = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 5))
    session.add(first)
    session.commit()
    submit_request(first)
    approve_request(first, allocations=[alloc])
    session.commit()

    second = _request(emp, typ, date(2026, 9, 3), date(2026, 9, 6))
    session.add(second)
    session.commit()
    submit_request(second)
    with pytest.raises(TimeOffOverlapError):
        approve_request(
            second, allocations=[alloc], existing_requests=[first]
        )
    session.rollback()


def test_non_overlapping_requests_allowed(session):
    emp, typ, alloc = _approved_setup(session, used=0.0)
    first = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 5))
    session.add(first)
    session.commit()
    submit_request(first)
    approve_request(first, allocations=[alloc])
    session.commit()

    second = _request(emp, typ, date(2026, 9, 6), date(2026, 9, 7))
    session.add(second)
    session.commit()
    submit_request(second)
    approve_request(
        second, allocations=[alloc], existing_requests=[first]
    )
    session.commit()
    assert second.status == "approved"
    assert alloc.used_days == 7.0


# ── 28. Invalid state transitions ────────────────────────────────
def test_invalid_transitions_rejected(session):
    emp, typ, _ = _approved_setup(session)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 2))
    session.add(req)
    session.commit()

    with pytest.raises(TimeOffStateError):
        approve_request(req, allocations=[])
    session.rollback()
    with pytest.raises(TimeOffStateError):
        reject_request(req, "Nope")
    session.rollback()

    submit_request(req)
    with pytest.raises(TimeOffStateError):
        submit_request(req)
    session.rollback()


# ── 29/30/31. Balances ───────────────────────────────────────────
def test_balance_after_approval_and_cancellation(session):
    emp, typ, alloc = _approved_setup(session, allocated=20.0, used=0.0)
    req = _request(emp, typ, date(2026, 9, 1), date(2026, 9, 3))
    session.add(req)
    session.commit()

    before = get_time_off_balance(emp.id, typ.id, date(2026, 9, 2), [alloc])
    assert before == {
        "allocated_days": 20.0,
        "used_days": 0.0,
        "available_days": 20.0,
    }

    submit_request(req)
    approve_request(req, allocations=[alloc])
    session.commit()
    after = get_time_off_balance(emp.id, typ.id, date(2026, 9, 2), [alloc])
    assert after["used_days"] == 3.0
    assert after["available_days"] == 17.0

    cancel_request(req)
    session.commit()
    restored = get_time_off_balance(emp.id, typ.id, date(2026, 9, 2), [alloc])
    assert restored["available_days"] == 20.0


def test_multiple_allocations_deterministic(session):
    emp = _employee()
    typ = _leave_type()
    early = _allocation(
        emp,
        typ,
        allocated=10.0,
        used=0.0,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
    )
    late = _allocation(
        emp,
        typ,
        allocated=15.0,
        used=2.0,
        start_date=date(2026, 7, 1),
        end_date=date(2026, 12, 31),
    )
    session.add_all([emp, typ, early, late])
    session.commit()

    picked = find_applicable_allocation(
        [late, early], emp.id, typ.id, date(2026, 3, 1), date(2026, 3, 2)
    )
    assert picked == early  # list order does not matter

    balance = get_time_off_balance(emp.id, typ.id, date(2026, 8, 1), [early, late])
    assert balance == {
        "allocated_days": 15.0,
        "used_days": 2.0,
        "available_days": 13.0,
    }
