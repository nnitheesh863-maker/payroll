"""
Payslip model — persisted employee salary summary for a payroll period.

Phase 6 (Payrun & Payslip). Stores employee payroll summary totals computed by
Phase 5 for a Payrun batch and references detailed payslip line items.
"""

import uuid

from sqlalchemy import CheckConstraint, Numeric, UniqueConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin

PAYSLIP_STATUSES = ("draft", "computed", "validated", "paid")


class Payslip(Base, TimestampMixin):
    """An individual employee payslip record."""

    __tablename__ = "payslips"
    __table_args__ = (
        UniqueConstraint("payrun_id", "employee_id", name="uq_payslip_payrun_employee"),
        CheckConstraint(
            "period_end >= period_start",
            name="ck_payslip_period_dates",
        ),
        CheckConstraint(
            "status IN ('draft', 'computed', 'validated', 'paid')",
            name="ck_payslip_status",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payrun_id = db.Column(
        db.ForeignKey("payruns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    contract_id = db.Column(
        db.ForeignKey("contracts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    salary_structure_id = db.Column(
        db.ForeignKey("salary_structures.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="draft")

    # ── Monetary Summary Amounts (Exact Numeric) ──────────────────
    basic_salary = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    total_earnings = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    total_allowances = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    gross_salary = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    total_deductions = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    total_contributions = db.Column(Numeric(12, 2), nullable=False, default=0.00)
    net_salary = db.Column(Numeric(12, 2), nullable=False, default=0.00)

    # ── Lifecycle Timestamps ───────────────────────────────────────
    computed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    payrun = db.relationship("Payrun", back_populates="payslips")
    employee = db.relationship("Employee")
    contract = db.relationship("Contract")
    salary_structure = db.relationship("SalaryStructure")
    lines = db.relationship(
        "PayslipLine",
        back_populates="payslip",
        cascade="all, delete-orphan",
        order_by="PayslipLine.sequence",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Payslip employee={self.employee_id} payrun={self.payrun_id} "
            f"net={self.net_salary} status={self.status}>"
        )
