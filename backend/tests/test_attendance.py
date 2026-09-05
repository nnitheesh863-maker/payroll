"""
Phase 3 Attendance tests — records, check-in/out, corrections and
working-schedule integration.

SQLite-backed (in-memory); PostgreSQL schema is covered by the migration.
"""

from datetime import date, datetime, time, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import (
    Attendance,
    Contract,
    Employee,
    WorkingSchedule,
    WorkingScheduleDay,
)
from app.services.attendance_service import (
    AttendanceDuplicateError,
    AttendanceValidationError,
    calculate_worked_hours,
    correct_attendance,
    get_attendance_health,
    is_attendance_incomplete,
    mark_absent,
    record_check_in,
    record_check_out,
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


def _dt(day=5, hour=9, minute=0):
    return datetime(2026, 9, day, hour, minute, tzinfo=timezone.utc)


def _as_aware(moment):
    """Normalise a DB-round-tripped timestamp (SQLite drops tzinfo)."""
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment


def _schedule_with_monday():
    sched = WorkingSchedule(code="STD-40", name="Standard 40h")
    sched.days.append(
        WorkingScheduleDay(
            weekday=0,
            is_working_day=True,
            start_time=time(9, 0),
            end_time=time(17, 0),
            break_minutes=60,
        )
    )
    return sched


# ── 1. Create attendance record ──────────────────────────────────
def test_create_attendance_record(session):
    emp = _employee()
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt())
    session.add(emp)
    session.commit()

    fetched = session.get(Attendance, rec.id)
    assert fetched is not None
    assert fetched.attendance_date == date(2026, 9, 7)
    assert _as_aware(fetched.check_in) == _dt()
    assert fetched.status == "incomplete"
    assert fetched.created_at is not None


# ── 2. Employee relationship ─────────────────────────────────────
def test_employee_attendance_relationship(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt())
    session.commit()

    assert rec.employee == emp
    assert emp.attendance_records == [rec]


# ── 3. Check-in ──────────────────────────────────────────────────
def test_check_in_creates_open_record(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 5))
    session.commit()

    assert rec.check_out is None
    assert rec.worked_hours is None
    assert is_attendance_incomplete(rec) is True


# ── 4/5. Check-out + worked-hours calculation ────────────────────
def test_check_out_calculates_worked_hours(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 0))
    record_check_out(rec, _dt(7, 17, 30))
    session.commit()

    assert rec.worked_hours == 8.5
    assert rec.status == "present"
    assert is_attendance_incomplete(rec) is False


def test_calculate_worked_hours_unit():
    assert calculate_worked_hours(_dt(7, 9, 0), _dt(7, 17, 0)) == 8.0
    assert calculate_worked_hours(_dt(7, 9, 15), _dt(7, 17, 45)) == 8.5
    assert calculate_worked_hours(_dt(7, 9, 0), None) is None


# ── 6. Missing check-out stays incomplete (never false zero) ─────
def test_open_record_has_no_worked_hours(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt())
    session.commit()

    assert rec.worked_hours is None
    assert rec.worked_hours != 0
    assert is_attendance_incomplete(rec) is True


# ── 7. Invalid check-out before check-in ─────────────────────────
def test_checkout_before_checkin_rejected(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 0))
    with pytest.raises(AttendanceValidationError):
        record_check_out(rec, _dt(7, 8, 59))
    session.rollback()

    with pytest.raises(AttendanceValidationError):
        calculate_worked_hours(_dt(7, 17, 0), _dt(7, 9, 0))


def test_naive_timestamps_treated_as_utc():
    """Naive timestamps are interpreted as UTC (SQLite drops tzinfo)."""
    naive_out = datetime(2026, 9, 7, 17, 0)
    assert calculate_worked_hours(_dt(7, 9, 0), naive_out) == 8.0


# ── 8. Duplicate employee/date handling ──────────────────────────
def test_duplicate_attendance_rejected(session):
    emp = _employee()
    session.add(emp)
    record_check_in(session, emp, date(2026, 9, 7), _dt())
    session.commit()

    with pytest.raises(AttendanceDuplicateError):
        record_check_in(session, emp, date(2026, 9, 7), _dt(7, 10, 0))
    session.rollback()

    # Same employee, different date is fine.
    record_check_in(session, emp, date(2026, 9, 8), _dt(8, 9, 0))
    session.commit()
    assert len(emp.attendance_records) == 2


def test_duplicate_attendance_db_constraint(session):
    emp = _employee()
    session.add(emp)
    session.commit()
    session.add(
        Attendance(
            employee_id=emp.id,
            attendance_date=date(2026, 9, 7),
            check_in=_dt(),
            status="present",
        )
    )
    session.commit()
    session.add(
        Attendance(
            employee_id=emp.id,
            attendance_date=date(2026, 9, 7),
            check_in=_dt(7, 10, 0),
            status="present",
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 9. Attendance correction ─────────────────────────────────────
def test_correct_attendance(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 0))
    record_check_out(rec, _dt(7, 17, 0))
    session.commit()

    correct_attendance(
        rec,
        check_out=_dt(7, 18, 0),
        correction_reason="Missed overtime punch",
    )
    session.commit()

    assert rec.status == "corrected"
    assert rec.correction_reason == "Missed overtime punch"
    assert rec.worked_hours == 9.0


def test_correction_requires_reason(session):
    emp = _employee()
    session.add(emp)
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 0))
    session.commit()

    with pytest.raises(AttendanceValidationError):
        correct_attendance(rec, check_out=_dt(7, 18, 0), correction_reason=" ")
    session.rollback()


def test_absent_record(session):
    emp = _employee()
    session.add(emp)
    rec = mark_absent(session, emp, date(2026, 9, 7), notes="Sick, no leave filed")
    session.commit()

    assert rec.status == "absent"
    assert rec.check_in is None
    assert is_attendance_incomplete(rec) is False


# ── 10. Contract/schedule integration ────────────────────────────
def test_attendance_health_with_schedule(session):
    emp = _employee()
    sched = _schedule_with_monday()
    ctr = Contract(
        employee=emp,
        contract_reference="CTR-001",
        contract_type="full_time",
        start_date=date(2026, 1, 1),
        status="active",
        salary=50000.0,
        working_schedule=sched,
    )
    session.add_all([emp, sched, ctr])
    rec = record_check_in(session, emp, date(2026, 9, 7), _dt(7, 9, 0))
    record_check_out(rec, _dt(7, 17, 0))
    session.commit()

    # 2026-09-07 is a Monday.
    health = get_attendance_health(emp.id, date(2026, 9, 7), record=rec)
    assert health["has_contract"] is True
    assert health["contract_reference"] == "CTR-001"
    assert health["is_working_day"] is True
    assert health["expected_hours"] == 7.0  # 8h shift minus 1h break
    assert health["worked_hours"] == 8.0
    assert health["is_incomplete"] is False


def test_attendance_health_without_contract(session):
    emp = _employee()
    session.add(emp)
    session.commit()

    health = get_attendance_health(emp.id, date(2026, 9, 7))
    assert health["has_contract"] is False
    assert health["expected_hours"] is None


def test_employee_must_exist(session):
    import uuid as uuid_lib

    with pytest.raises(AttendanceValidationError):
        record_check_in(
            session, uuid_lib.uuid4(), date(2026, 9, 7), _dt()
        )
