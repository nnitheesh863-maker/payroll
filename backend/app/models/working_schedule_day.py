"""
WorkingScheduleDay model — day-level working hours and breaks.

Phase 2 (Contracts & Working Schedules). Defines working duration, start/end
times, and break minutes for each day of the week (0=Monday..6=Sunday).
"""

import uuid

from sqlalchemy import CheckConstraint, UniqueConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class WorkingScheduleDay(Base, TimestampMixin):
    """Specific weekday entry for a working schedule."""

    __tablename__ = "working_schedule_days"
    __table_args__ = (
        UniqueConstraint(
            "working_schedule_id",
            "weekday",
            name="uq_working_schedule_day_schedule_weekday",
        ),
        CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="ck_working_schedule_day_weekday",
        ),
        CheckConstraint(
            "break_minutes >= 0",
            name="ck_working_schedule_day_break_minutes",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    working_schedule_id = db.Column(
        db.ForeignKey("working_schedules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weekday = db.Column(db.Integer, nullable=False)
    is_working_day = db.Column(db.Boolean, nullable=False, default=True)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    break_minutes = db.Column(db.Integer, nullable=False, default=0)

    # ── Relationships ──────────────────────────────────────────────
    working_schedule = db.relationship("WorkingSchedule", back_populates="days")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<WorkingScheduleDay schedule={self.working_schedule_id} "
            f"weekday={self.weekday} is_working={self.is_working_day}>"
        )
