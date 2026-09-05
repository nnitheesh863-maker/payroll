"""
TimeOffRequest model — employee leave request with approval lifecycle.

Phase 3 (Attendance & Time Off). Lifecycle: draft → submitted → approved /
rejected, with cancellation from draft/submitted/approved. Allocation
deduction happens exactly once at approval (via the time-off service) and
is restored if an approved request is cancelled. ``approved_by`` is a plain
identifier (no FK) so Phase 8 authentication can own approver identity.
"""

import uuid

from sqlalchemy import CheckConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class TimeOffRequest(Base, TimestampMixin):
    """A leave request filed by an employee."""

    __tablename__ = "time_off_requests"
    __table_args__ = (
        CheckConstraint(
            "end_date >= start_date",
            name="ck_time_off_request_end_date_after_start_date",
        ),
        CheckConstraint(
            "requested_days > 0",
            name="ck_time_off_request_requested_days_positive",
        ),
        db.Index(
            "ix_time_off_requests_employee_dates",
            "employee_id",
            "start_date",
            "end_date",
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
    allocation_id = db.Column(
        db.ForeignKey("time_off_allocations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    requested_days = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    # Typical values: "draft", "submitted", "approved", "rejected", "cancelled".
    status = db.Column(db.String(30), nullable=False, default="draft")
    approved_by = db.Column(Uuid(as_uuid=True), nullable=True)
    approved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship(
        "Employee", back_populates="time_off_requests"
    )
    time_off_type = db.relationship(
        "TimeOffType", back_populates="requests"
    )
    allocation = db.relationship(
        "TimeOffAllocation", back_populates="requests"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<TimeOffRequest employee={self.employee_id} "
            f"{self.start_date}→{self.end_date} status={self.status}>"
        )
