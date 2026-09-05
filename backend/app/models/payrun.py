"""
Payrun model — batch payroll processing for a payroll period.

Phase 6 (Payrun & Payslip). Represents a batch payroll run associated with a
specific period and SalaryStructure, tracking lifecycle status from draft to paid.
"""

import uuid

from sqlalchemy import CheckConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin

PAYRUN_STATUSES = ("draft", "computed", "validated", "paid")


class Payrun(Base, TimestampMixin):
    """A batch payroll run for an organisation."""

    __tablename__ = "payruns"
    __table_args__ = (
        CheckConstraint(
            "period_end >= period_start",
            name="ck_payrun_period_dates",
        ),
        CheckConstraint(
            "status IN ('draft', 'computed', 'validated', 'paid')",
            name="ck_payrun_status",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False)
    reference = db.Column(
        db.String(50), nullable=False, unique=True, index=True
    )
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    salary_structure_id = db.Column(
        db.ForeignKey("salary_structures.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status = db.Column(db.String(30), nullable=False, default="draft")
    computed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    salary_structure = db.relationship("SalaryStructure")
    payrun_employees = db.relationship(
        "PayrunEmployee",
        back_populates="payrun",
        cascade="all, delete-orphan",
    )
    payslips = db.relationship(
        "Payslip",
        back_populates="payrun",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Payrun {self.reference} status={self.status} [{self.period_start} -> {self.period_end}]>"
