"""
TimeOffType model — configurable leave categories.

Phase 3 (Attendance & Time Off). Types are organisation configuration
(e.g. Annual Leave, Sick Leave, Unpaid Leave) rather than hard-coded
values. ``requires_allocation`` controls whether approved requests must
consume an allocation; ``allow_negative`` permits overdrawn balances.
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class TimeOffType(Base, TimestampMixin):
    """A configurable time-off / leave category."""

    __tablename__ = "time_off_types"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False, unique=True, index=True)
    code = db.Column(db.String(30), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    requires_allocation = db.Column(
        db.Boolean, nullable=False, default=True
    )
    allow_negative = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # ── Relationships ──────────────────────────────────────────────
    allocations = db.relationship(
        "TimeOffAllocation",
        back_populates="time_off_type",
    )
    requests = db.relationship(
        "TimeOffRequest",
        back_populates="time_off_type",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<TimeOffType {self.code} {self.name}>"
