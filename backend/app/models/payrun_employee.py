"""
PayrunEmployee model — explicit employee scope for a batch Payrun.

Phase 6 (Payrun & Payslip). Associates an employee with a Payrun batch so the
batch scope is persisted and immutable once configured.
"""

import uuid

from sqlalchemy import UniqueConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class PayrunEmployee(Base, TimestampMixin):
    """An employee included in a batch payrun."""

    __tablename__ = "payrun_employees"
    __table_args__ = (
        UniqueConstraint("payrun_id", "employee_id", name="uq_payrun_employee"),
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

    # ── Relationships ──────────────────────────────────────────────
    payrun = db.relationship("Payrun", back_populates="payrun_employees")
    employee = db.relationship("Employee")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<PayrunEmployee payrun={self.payrun_id} employee={self.employee_id}>"
