"""
WorkingSchedule model — weekly work schedule definitions.

Phase 2 (Contracts & Working Schedules). Defines the weekly schedule template
and timezone, and references schedule days. Total weekly hours are derived
from its associated WorkingScheduleDay records.
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class WorkingSchedule(Base, TimestampMixin):
    """A weekly work schedule configuration."""

    __tablename__ = "working_schedules"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(30), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    timezone = db.Column(db.String(50), nullable=False, default="UTC")
    weekly_hours = db.Column(db.Float, nullable=False, default=0.0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # ── Relationships ──────────────────────────────────────────────
    days = db.relationship(
        "WorkingScheduleDay",
        back_populates="working_schedule",
        cascade="all, delete-orphan",
        order_by="WorkingScheduleDay.weekday",
    )
    contracts = db.relationship(
        "Contract",
        back_populates="working_schedule",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<WorkingSchedule {self.code} ({self.weekly_hours}h/wk)>"
