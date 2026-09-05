"""
Employee model — core HR profile.

Phase 1 (Database & Core HR). Holds identity, contact, employment and
bank/account details. Bank fields are informational only in this phase;
later payroll phases use them for payout warnings. No authentication
credentials are stored here (authentication belongs to Phase 8).
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class Employee(Base, TimestampMixin):
    """An employee of the organisation."""

    __tablename__ = "employees"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Identity ───────────────────────────────────────────────────
    employee_code = db.Column(
        db.String(50), nullable=False, unique=True, index=True
    )
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(
        db.String(255), nullable=False, unique=True, index=True
    )
    phone = db.Column(db.String(30), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)

    # ── Address ────────────────────────────────────────────────────
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)

    # ── Employment ─────────────────────────────────────────────────
    joining_date = db.Column(db.Date, nullable=False)
    # Typical values: "active", "on_leave", "terminated", "resigned".
    employment_status = db.Column(
        db.String(30), nullable=False, default="active"
    )
    department_id = db.Column(
        db.ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    job_title = db.Column(db.String(120), nullable=True)

    # ── Bank / account info (informational in Phase 1) ─────────────
    bank_name = db.Column(db.String(120), nullable=True)
    bank_account_number = db.Column(db.String(60), nullable=True)
    bank_ifsc_code = db.Column(db.String(30), nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    department = db.relationship("Department", back_populates="employees")
    employment_history = db.relationship(
        "EmploymentHistory",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="EmploymentHistory.effective_from",
    )
    contracts = db.relationship(
        "Contract",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="Contract.start_date",
    )
    attendance_records = db.relationship(
        "Attendance",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="Attendance.attendance_date",
    )
    time_off_allocations = db.relationship(
        "TimeOffAllocation",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    time_off_requests = db.relationship(
        "TimeOffRequest",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Employee {self.employee_code} {self.email}>"
