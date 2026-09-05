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

    def to_dict(self) -> dict:
        emp_name = ""
        emp_code = ""
        if self.employee:
            emp_name = f"{self.employee.first_name} {self.employee.last_name}".strip()
            emp_code = self.employee.employee_code or ""

        return {
            "id": str(self.id),
            "payrun_id": str(self.payrun_id),
            "employee_id": str(self.employee_id),
            "employee_name": emp_name,
            "employee_code": emp_code,
            "contract_id": str(self.contract_id) if self.contract_id else None,
            "salary_structure_id": str(self.salary_structure_id) if self.salary_structure_id else None,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "basic_salary": float(self.basic_salary or 0),
            "total_earnings": float(self.total_earnings or 0),
            "total_allowances": float(self.total_allowances or 0),
            "gross_salary": float(self.gross_salary or 0),
            "total_deductions": float(self.total_deductions or 0),
            "total_contributions": float(self.total_contributions or 0),
            "net_salary": float(self.net_salary or 0),
            "status": (self.status or "draft").upper(),
            "computed_at": self.computed_at.isoformat() if self.computed_at else None,
            "validated_at": self.validated_at.isoformat() if self.validated_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "lines": [line.to_dict() for line in self.lines],
        }

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Payslip employee={self.employee_id} payrun={self.payrun_id} "
            f"net={self.net_salary} status={self.status}>"
        )
