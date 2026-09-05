"""
Authentication service — users, password hashing, JWT and RBAC.

Phase 8 (Authentication & RBAC). Passwords use Werkzeug scrypt hashing;
tokens are HS256 JWTs issued by PyJWT (a maintained library — no manual
crypto). Persistence helpers add to the given session but never commit;
the caller owns the transaction.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from app.config import settings
from app.models.user import ROLES


class AuthDomainError(ValueError):
    """Base exception for authentication/authorization errors."""


class AuthValidationError(AuthDomainError):
    """Raised when user data or credentials are invalid."""


class AuthTokenError(AuthDomainError):
    """Raised when a JWT cannot be validated (invalid or expired)."""


# ── Central role → permissions mapping ───────────────────────────
# Stable permission names; routes check these, never raw role strings.
PERMISSION_PAYROLL_READ = "payroll.read"
PERMISSION_PAYROLL_COMPUTE = "payroll.compute"
PERMISSION_PAYROLL_VALIDATE = "payroll.validate"
PERMISSION_PAYROLL_PAY = "payroll.mark_paid"
PERMISSION_PAYROLL_SEND = "payroll.send"
PERMISSION_PAYROLL_DASHBOARD = "payroll.dashboard"
PERMISSION_USERS_MANAGE = "users.manage"

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "ADMIN": frozenset(
        {
            PERMISSION_PAYROLL_READ,
            PERMISSION_PAYROLL_COMPUTE,
            PERMISSION_PAYROLL_VALIDATE,
            PERMISSION_PAYROLL_PAY,
            PERMISSION_PAYROLL_SEND,
            PERMISSION_PAYROLL_DASHBOARD,
            PERMISSION_USERS_MANAGE,
        }
    ),
    "HR_MANAGER": frozenset(
        {
            PERMISSION_PAYROLL_READ,
            PERMISSION_PAYROLL_DASHBOARD,
        }
    ),
    "HR_PAYROLL_USER": frozenset(
        {
            PERMISSION_PAYROLL_READ,
            PERMISSION_PAYROLL_COMPUTE,
            PERMISSION_PAYROLL_DASHBOARD,
        }
    ),
    "HR_PAYROLL_MANAGER": frozenset(
        {
            PERMISSION_PAYROLL_READ,
            PERMISSION_PAYROLL_COMPUTE,
            PERMISSION_PAYROLL_VALIDATE,
            PERMISSION_PAYROLL_PAY,
            PERMISSION_PAYROLL_SEND,
            PERMISSION_PAYROLL_DASHBOARD,
        }
    ),
    "EMPLOYEE": frozenset(),
}


def has_permission(role: str | None, permission: str) -> bool:
    """Check a role against the central permission map."""
    return permission in ROLE_PERMISSIONS.get(role or "", frozenset())


# ── Password handling (Werkzeug scrypt) ──────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password. Never store or log the input."""
    if not password or not str(password).strip():
        raise AuthValidationError("Password is required.")
    return generate_password_hash(str(password))


def verify_password(password_hash: str, password: str) -> bool:
    """Verify a plaintext candidate against a stored hash."""
    if not password_hash or not password:
        return False
    try:
        return check_password_hash(password_hash, str(password))
    except (ValueError, TypeError):
        return False


# ── User management ──────────────────────────────────────────────

def normalize_email(email: str | None) -> str:
    """Lowercase and trim an email address."""
    return str(email or "").strip().lower()


def validate_new_user(
    *, email: str, password: str, full_name: str, role: str
) -> str:
    """Validate user fields; returns the normalized email."""
    email = normalize_email(email)
    if not email or "@" not in email:
        raise AuthValidationError("A valid email address is required.")
    if not password or not str(password).strip():
        raise AuthValidationError("Password is required.")
    if not full_name or not str(full_name).strip():
        raise AuthValidationError("Full name is required.")
    if role not in ROLES:
        raise AuthValidationError(
            f"Invalid role '{role}'. Expected one of: {', '.join(ROLES)}."
        )
    return email


def create_user(
    session,
    *,
    email: str,
    password: str,
    full_name: str,
    role: str = "EMPLOYEE",
    employee_id: uuid.UUID | str | None = None,
    is_active: bool = True,
):
    """Create a user with a hashed password (never stored plaintext)."""
    from app.models.employee import Employee
    from app.models.user import User

    email = validate_new_user(
        email=email, password=password, full_name=full_name, role=role
    )
    if session.query(User).filter_by(email=email).first() is not None:
        raise AuthValidationError(f"User '{email}' already exists.")

    employee_uuid = None
    if employee_id is not None:
        try:
            employee_uuid = (
                employee_id
                if isinstance(employee_id, uuid.UUID)
                else uuid.UUID(str(employee_id))
            )
        except (ValueError, AttributeError, TypeError):
            raise AuthValidationError("Invalid employee_id.")
        if session.get(Employee, employee_uuid) is None:
            raise AuthValidationError("Linked employee does not exist.")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=str(full_name).strip(),
        role=role,
        employee_id=employee_uuid,
        is_active=is_active,
    )
    session.add(user)
    return user


def authenticate_user(session, email: str, password: str):
    """Validate credentials; returns the user or None (no existence leak)."""
    from app.models.user import User

    user = (
        session.query(User).filter_by(email=normalize_email(email)).first()
    )
    if user is None or not user.is_active:
        return None
    if not verify_password(user.password_hash, password or ""):
        return None
    return user


# ── JWT (PyJWT, HS256) ───────────────────────────────────────────
# Claims carry identity + role only. Never passwords, hashes, bank
# details or salary data.

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


def _encode(payload: dict) -> str:
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def create_access_token(user) -> str:
    now = datetime.now(timezone.utc)
    return _encode(
        {
            "sub": str(user.id),
            "role": user.role,
            "type": TOKEN_TYPE_ACCESS,
            "iat": int(now.timestamp()),
            "exp": int(
                (
                    now
                    + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRES_MINUTES)
                ).timestamp()
            ),
        }
    )


def create_refresh_token(user) -> str:
    now = datetime.now(timezone.utc)
    return _encode(
        {
            "sub": str(user.id),
            "role": user.role,
            "type": TOKEN_TYPE_REFRESH,
            "iat": int(now.timestamp()),
            "exp": int(
                (
                    now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRES_DAYS)
                ).timestamp()
            ),
        }
    )


def decode_token(token: str, *, expected_type: str = TOKEN_TYPE_ACCESS) -> dict:
    """Verify signature/expiry/type; returns claims or raises AuthTokenError."""
    try:
        claims = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=["HS256"]
        )
    except jwt.ExpiredSignatureError as err:
        raise AuthTokenError("Token has expired.") from err
    except jwt.InvalidTokenError as err:
        raise AuthTokenError("Invalid token.") from err
    if claims.get("type") != expected_type:
        raise AuthTokenError("Invalid token type.")
    if not claims.get("sub"):
        raise AuthTokenError("Invalid token.")
    return claims


def get_user_from_token(session, claims: dict):
    """Resolve the token identity to an active user (None if unusable)."""
    from app.models.user import User

    try:
        uid = uuid.UUID(str(claims.get("sub")))
    except (ValueError, AttributeError, TypeError):
        return None
    user = session.get(User, uid)
    if user is None or not user.is_active:
        return None
    return user
