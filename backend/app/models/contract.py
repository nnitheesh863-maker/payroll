"""
Contract model — employment contract terms and schedule assignment.

Phase 2 (Contracts & Working Schedules). Links an employee to employment terms,
salary, date bounds, and a working schedule. Used by later payroll phases to
determine active terms and hourly/monthly wage rules.
"""

import uuid

from sqlalchemy import CheckConstraint, Numeric, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class Contract(Base, TimestampMixin):
    """An employment contract for an employee."""

    __tablename__ = "contracts"
    __table_args__ = (
        CheckConstraint(
            "salary >= 0",
            name="ck_contract_salary_non_negative",
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_contract_end_date_after_start_date",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contract_reference = db.Column(
        db.String(50), nullable=False, unique=True, index=True
    )
    contract_type = db.Column(db.String(50), nullable=False, default="full_time")
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(30), nullable=False, default="draft")
    salary = db.Column(Numeric(12, 2), nullable=False, default=0.0)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    working_schedule_id = db.Column(
        db.ForeignKey("working_schedules.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    salary_structure_id = db.Column(
        db.ForeignKey("salary_structures.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    notes = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship("Employee", back_populates="contracts")
    working_schedule = db.relationship("WorkingSchedule", back_populates="contracts")
    salary_structure = db.relationship("SalaryStructure")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Contract {self.contract_reference} employee={self.employee_id} status={self.status}>"
