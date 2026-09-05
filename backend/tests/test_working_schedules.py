"""
Phase 2 Working Schedule unit tests.

Tests WorkingSchedule and WorkingScheduleDay creation, unique constraints,
and deterministic weekly hours calculation logic.
"""

from datetime import time

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import WorkingSchedule, WorkingScheduleDay
from app.services.schedule_service import (
    calculate_day_working_hours,
    calculate_weekly_hours,
    sync_schedule_weekly_hours,
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


def _schedule(code="STD-40", name="Standard 40h Schedule"):
    return WorkingSchedule(
        code=code,
        name=name,
        description="Standard full-time schedule",
        timezone="UTC",
    )


# ── 1. Schedule creation ───────────────────────────────────────────
def test_schedule_creation(session):
    sched = _schedule()
    session.add(sched)
    session.commit()

    fetched = session.get(WorkingSchedule, sched.id)
    assert fetched is not None
    assert fetched.code == "STD-40"
    assert fetched.name == "Standard 40h Schedule"
    assert fetched.weekly_hours == 0.0
    assert fetched.is_active is True
    assert fetched.created_at is not None


# ── 2. Schedule code uniqueness ───────────────────────────────────
def test_schedule_code_uniqueness(session):
    session.add(_schedule(code="STD-40", name="Standard 40h"))
    session.commit()

    session.add(_schedule(code="STD-40", name="Duplicate Code"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 3. Schedule-day creation ───────────────────────────────────────
def test_schedule_day_creation(session):
    sched = _schedule()
    day = WorkingScheduleDay(
        working_schedule=sched,
        weekday=0,  # Monday
        is_working_day=True,
        start_time=time(9, 0),
        end_time=time(17, 0),
        break_minutes=60,
    )
    session.add_all([sched, day])
    session.commit()

    assert len(sched.days) == 1
    assert sched.days[0].weekday == 0
    assert sched.days[0].start_time == time(9, 0)
    assert sched.days[0].end_time == time(17, 0)
    assert sched.days[0].break_minutes == 60


# ── 4. Duplicate weekday prevention ───────────────────────────────
def test_duplicate_weekday_prevention(session):
    sched = _schedule()
    day1 = WorkingScheduleDay(
        working_schedule=sched,
        weekday=0,
        is_working_day=True,
        start_time=time(9, 0),
        end_time=time(17, 0),
    )
    day2 = WorkingScheduleDay(
        working_schedule=sched,
        weekday=0,  # Duplicate Monday
        is_working_day=True,
        start_time=time(10, 0),
        end_time=time(18, 0),
    )
    session.add_all([sched, day1, day2])
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── 5. Weekly-hours calculation ───────────────────────────────────
def test_weekly_hours_calculation(session):
    sched = _schedule()
    # Add Mon-Fri (0..4), 09:00 -> 17:00 (8h) - 60m break = 7 working hours/day
    for w in range(5):
        sched.days.append(
            WorkingScheduleDay(
                weekday=w,
                is_working_day=True,
                start_time=time(9, 0),
                end_time=time(17, 0),
                break_minutes=60,
            )
        )
    session.add(sched)
    session.commit()

    total = sync_schedule_weekly_hours(sched)
    session.commit()

    assert total == 35.0  # 5 days * 7h
    assert sched.weekly_hours == 35.0


# ── 6. Non-working days ───────────────────────────────────────────
def test_non_working_days(session):
    sched = _schedule()
    sched.days.append(
        WorkingScheduleDay(
            weekday=5,  # Saturday
            is_working_day=False,
            start_time=None,
            end_time=None,
            break_minutes=0,
        )
    )
    session.add(sched)
    session.commit()

    hours = calculate_day_working_hours(
        is_working_day=False,
        start_time=None,
        end_time=None,
        break_minutes=0,
    )
    assert hours == 0.0
    assert calculate_weekly_hours(sched) == 0.0


# ── 7. Break calculation ──────────────────────────────────────────
def test_break_calculation():
    # 08:30 to 17:30 = 9 hours (540 mins). Break 45 mins -> 495 mins = 8.25 hours
    hours = calculate_day_working_hours(
        is_working_day=True,
        start_time=time(8, 30),
        end_time=time(17, 30),
        break_minutes=45,
    )
    assert hours == 8.25


# ── 8. Invalid/negative duration handling ──────────────────────────
def test_invalid_duration_handling():
    # End time before start time
    with pytest.raises(ValueError, match="end_time must be after start_time"):
        calculate_day_working_hours(
            is_working_day=True,
            start_time=time(17, 0),
            end_time=time(9, 0),
            break_minutes=0,
        )

    # Negative break minutes
    with pytest.raises(ValueError, match="cannot be negative"):
        calculate_day_working_hours(
            is_working_day=True,
            start_time=time(9, 0),
            end_time=time(17, 0),
            break_minutes=-30,
        )

    # Break exceeds total shift duration
    with pytest.raises(ValueError, match="exceeds shift duration"):
        calculate_day_working_hours(
            is_working_day=True,
            start_time=time(9, 0),
            end_time=time(10, 0),  # 1 hour shift
            break_minutes=120,     # 2 hour break
        )

    # Working day missing start/end times
    with pytest.raises(ValueError, match="require valid start_time"):
        calculate_day_working_hours(
            is_working_day=True,
            start_time=None,
            end_time=time(17, 0),
        )
