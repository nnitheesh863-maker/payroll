"""
Department model — organisational unit that groups employees.

Phase 1 (Database & Core HR). Extended by later phases via the
``employees`` relationship (contracts, attendance, payroll all resolve
through Employee → Department).
"""

import uuid

from sqlalchemy import Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin


class Department(Base, TimestampMixin):
    """A department within the organisation."""

    __tablename__ = "departments"

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False, unique=True, index=True)
    code = db.Column(db.String(30), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    # No delete cascade: deleting a department must not delete employees.
    # The Employee.department_id FK uses ON DELETE SET NULL instead.
    employees = db.relationship("Employee", back_populates="department")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Department {self.code} {self.name}>"
