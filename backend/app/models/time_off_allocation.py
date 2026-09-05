"""
TimeOffAllocation model — leave entitlement granted to an employee.

Phase 3 (Attendance & Time Off). Tracks granted days (``allocated_days``)
and consumed days (``used_days``) for one employee + type pair over an
optional validity window. The available balance is always derived as
``allocated_days - used_days`` and is never stored independently.
"""

import uuid

from sqlalchemy import CheckConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class TimeOffAllocation(Base, TimestampMixin):
    """Leave days allocated to an employee for a time-off type."""

    __tablename__ = "time_off_allocations"
    __table_args__ = (
        CheckConstraint(
            "allocated_days >= 0",
            name="ck_time_off_allocation_allocated_non_negative",
        ),
        CheckConstraint(
            "used_days >= 0",
            name="ck_time_off_allocation_used_non_negative",
        ),
        db.Index(
            "ix_time_off_allocations_employee_type",
            "employee_id",
            "time_off_type_id",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    time_off_type_id = db.Column(
        db.ForeignKey("time_off_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    allocated_days = db.Column(db.Float, nullable=False, default=0.0)
    used_days = db.Column(db.Float, nullable=False, default=0.0)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    # Typical values: "draft", "approved", "expired", "cancelled".
    status = db.Column(db.String(30), nullable=False, default="draft")
    notes = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship(
        "Employee", back_populates="time_off_allocations"
    )
    time_off_type = db.relationship(
        "TimeOffType", back_populates="allocations"
    )
    requests = db.relationship(
        "TimeOffRequest",
        back_populates="allocation",
    )

    @property
    def available_days(self) -> float:
        """Derived balance: allocated minus used (never stored)."""
        return round((self.allocated_days or 0.0) - (self.used_days or 0.0), 2)

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<TimeOffAllocation employee={self.employee_id} "
            f"type={self.time_off_type_id} "
            f"allocated={self.allocated_days} used={self.used_days}>"
        )
