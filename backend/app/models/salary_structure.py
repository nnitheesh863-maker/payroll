"""
SalaryStructure model — reusable collection of ordered salary rules.

Phase 4 (Salary Structure & Salary Rules). A structure groups SalaryRule
rows that Phase 5 will execute in sequence to build payslips. This phase
defines configuration only; no payroll calculation happens here.
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class SalaryStructure(Base, TimestampMixin):
    """A named, reusable salary configuration template."""

    __tablename__ = "salary_structures"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False, unique=True, index=True)
    code = db.Column(db.String(30), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # ── Relationships ──────────────────────────────────────────────
    # Rules die with their structure (same convention as contracts,
    # attendance and allocations owned by an employee).
    rules = db.relationship(
        "SalaryRule",
        back_populates="salary_structure",
        cascade="all, delete-orphan",
        order_by="SalaryRule.sequence",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<SalaryStructure {self.code} {self.name}>"
