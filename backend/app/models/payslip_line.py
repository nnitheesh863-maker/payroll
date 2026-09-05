"""
PayslipLine model — individual salary rule calculation result.

Phase 6 (Payrun & Payslip). Preserves rule-level computation results from Phase 5
for a payslip, supporting breakdown, validation, and auditability.
"""

import uuid

from sqlalchemy import Numeric, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class PayslipLine(Base, TimestampMixin):
    """An individual line item on a payslip."""

    __tablename__ = "payslip_lines"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payslip_id = db.Column(
        db.ForeignKey("payslips.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    salary_rule_id = db.Column(
        db.ForeignKey("salary_rules.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    rule_code = db.Column(db.String(30), nullable=False)
    rule_name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(30), nullable=False)
    calculation_method = db.Column(db.String(30), nullable=False)
    sequence = db.Column(db.Integer, nullable=False, default=0)
    base_amount = db.Column(Numeric(12, 2), nullable=True)
    amount = db.Column(Numeric(12, 2), nullable=False, default=0.00)

    # ── Relationships ──────────────────────────────────────────────
    payslip = db.relationship("Payslip", back_populates="lines")
    salary_rule = db.relationship("SalaryRule")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "payslip_id": str(self.payslip_id),
            "salary_rule_id": str(self.salary_rule_id) if self.salary_rule_id else None,
            "rule_code": self.rule_code,
            "rule_name": self.rule_name,
            "category": self.category,
            "calculation_method": self.calculation_method,
            "sequence": self.sequence,
            "base_amount": float(self.base_amount) if self.base_amount is not None else None,
            "amount": float(self.amount) if self.amount is not None else 0.0,
        }

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<PayslipLine {self.rule_code} ({self.category}) "
            f"amount={self.amount} seq={self.sequence}>"
        )
