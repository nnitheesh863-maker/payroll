"""
User model — authentication identity with role and employee link.

Phase 8 (Authentication & RBAC). Stores a scrypt password hash (never a
plaintext password) plus a stable role identifier and an optional link to
the HR Employee row for ownership checks. Role strings match the
challenge's required roles verbatim so they double as stable identifiers.
"""

import uuid

from sqlalchemy import CheckConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin

ROLE_ADMIN = "ADMIN"
ROLE_HR_MANAGER = "HR_MANAGER"
ROLE_HR_PAYROLL_USER = "HR_PAYROLL_USER"
ROLE_HR_PAYROLL_MANAGER = "HR_PAYROLL_MANAGER"
ROLE_EMPLOYEE = "EMPLOYEE"

ROLES = (
    ROLE_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_HR_PAYROLL_USER,
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_EMPLOYEE,
)


class User(Base, TimestampMixin):
    """An authentication identity."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', "
            "'HR_PAYROLL_MANAGER', 'EMPLOYEE')",
            name="ck_users_role",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(
        db.String(255), nullable=False, unique=True, index=True
    )
    # Scrypt hash via werkzeug.security. Never plaintext, never serialized.
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(30), nullable=False, default=ROLE_EMPLOYEE)
    employee_id = db.Column(
        db.ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # ── Relationships ──────────────────────────────────────────────
    employee = db.relationship("Employee")

    def to_dict(self) -> dict:
        """Public representation — password hash is never included."""
        return {
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "employee_id": str(self.employee_id) if self.employee_id else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
        }

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.email} role={self.role}>"
