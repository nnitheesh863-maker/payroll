"""
Attendance model — daily employee attendance records.

Phase 3 (Attendance & Time Off). Records check-in/check-out timestamps per
employee per day. ``worked_hours`` is always derived from check-in/check-out
by the attendance service and is never an independent source of truth.
A record with no check-out is open/incomplete (unless marked absent).
"""

import uuid

from sqlalchemy import CheckConstraint, UniqueConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class Attendance(Base, TimestampMixin):
    """One daily attendance record for an employee."""

    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "attendance_date",
            name="uq_attendance_employee_date",
        ),
        CheckConstraint(
            "check_out IS NULL OR check_out >= check_in",
            name="ck_attendance_checkout_after_checkin",
        ),
        CheckConstraint(
            "worked_hours IS NULL OR worked_hours >= 0",
            name="ck_attendance_worked_hours_non_negative",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attendance_date = db.Column(db.Date, nullable=False, index=True)
    check_in = db.Column(db.DateTime(timezone=True), nullable=True)
    check_out = db.Column(db.DateTime(timezone=True), nullable=True)
    worked_hours = db.Column(db.Float, nullable=True)
    # Typical values: "present", "absent", "corrected", "incomplete".
    status = db.Column(db.String(30), nullable=False, default="present")
    correction_reason = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship("Employee", back_populates="attendance_records")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Attendance employee={self.employee_id} "
            f"date={self.attendance_date} status={self.status}>"
        )
