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

    def to_dict(self) -> dict:
        from decimal import Decimal

        total_gross = Decimal("0.00")
        total_ded = Decimal("0.00")
        total_net = Decimal("0.00")
        total_contrib = Decimal("0.00")

        for s in self.payslips:
            if s.gross_salary is not None:
                total_gross += Decimal(str(s.gross_salary))
            if s.total_deductions is not None:
                total_ded += Decimal(str(s.total_deductions))
            if s.net_salary is not None:
                total_net += Decimal(str(s.net_salary))
            if s.total_contributions is not None:
                total_contrib += Decimal(str(s.total_contributions))

        return {
            "id": str(self.id),
            "name": self.name,
            "reference": self.reference,
            "batch_number": self.reference,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "salary_structure_id": str(self.salary_structure_id) if self.salary_structure_id else None,
            "status": (self.status or "draft").upper(),
            "employee_count": len(self.payrun_employees),
            "employee_ids": [str(pe.employee_id) for pe in self.payrun_employees],
            "total_gross": float(total_gross),
            "total_deductions": float(total_ded),
            "total_net": float(total_net),
            "total_employer_contributions": float(total_contrib),
            "computed_at": self.computed_at.isoformat() if self.computed_at else None,
            "validated_at": self.validated_at.isoformat() if self.validated_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if hasattr(self, "created_at") and self.created_at else None,
        }

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Payrun {self.reference} status={self.status} [{self.period_start} -> {self.period_end}]>"
