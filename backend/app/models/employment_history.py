"""
EmploymentHistory model — point-in-time employment changes.

Phase 1 (Database & Core HR). Records historical assignments (department,
job title, status) with an effective period instead of overwriting the
Employee row, so contracts, attendance, time off and payroll in later
phases can resolve "who was where, when".
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class EmploymentHistory(Base, TimestampMixin):
    """One historical employment record for an employee."""

    __tablename__ = "employment_history"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    department_id = db.Column(
        db.ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_title = db.Column(db.String(120), nullable=True)
    employment_status = db.Column(db.String(30), nullable=True)
    effective_from = db.Column(db.Date, nullable=False)
    effective_to = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship("Employee", back_populates="employment_history")
    department = db.relationship("Department")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<EmploymentHistory employee={self.employee_id} "
            f"from={self.effective_from}>"
        )
