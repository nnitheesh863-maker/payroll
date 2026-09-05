from datetime import datetime, timezone
import uuid
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.services.auth_service import (
    AuthTokenError,
    AuthValidationError,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_user,
    decode_token,
    get_user_from_token,
)

make_jwt = create_access_token

auth_bp = Blueprint("auth", __name__)

# Pre-seeded enterprise personas
DEFAULT_USERS = {
    "admin@peoplepay360.com": {
        "id": 1,
        "email": "admin@peoplepay360.com",
        "full_name": "Alexander Wright",
        "role": "ADMIN",
        "is_active": True,
        "password": "Admin@123",
        "created_at": "2026-01-01T00:00:00Z",
    },
    "hrmanager@peoplepay360.com": {
        "id": 2,
        "email": "hrmanager@peoplepay360.com",
        "full_name": "Sarah Jenkins",
        "role": "HR_MANAGER",
        "is_active": True,
        "password": "HrManager@123",
        "created_at": "2026-01-01T00:00:00Z",
    },
    "payrollmanager@peoplepay360.com": {
        "id": 3,
        "email": "payrollmanager@peoplepay360.com",
        "full_name": "Marcus Chen",
        "role": "HR_PAYROLL_MANAGER",
        "is_active": True,
        "password": "PayrollManager@123",
        "created_at": "2026-01-01T00:00:00Z",
    },
    "payrolluser@peoplepay360.com": {
        "id": 4,
        "email": "payrolluser@peoplepay360.com",
        "full_name": "Elena Rostova",
        "role": "HR_PAYROLL_USER",
        "is_active": True,
        "password": "PayrollUser@123",
        "created_at": "2026-01-01T00:00:00Z",
    },
    "employee@peoplepay360.com": {
        "id": 5,
        "email": "employee@peoplepay360.com",
        "full_name": "David Kumar",
        "role": "EMPLOYEE",
        "is_active": True,
        "password": "Employee@123",
        "created_at": "2026-01-01T00:00:00Z",
    },
}


@auth_bp.post("/auth/login")
def login():
    """Authenticate with email + password and receive signed JWT tokens."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "") or "").strip().lower()
    password = str(data.get("password", "") or "").strip()

    if not email or not password:
        return jsonify({"detail": "Invalid credentials."}), 401

    # 1. Attempt database authentication
    db_user = authenticate_user(db.session, email, password)
    if db_user is not None:
        access_token = create_access_token(db_user)
        refresh_token = create_refresh_token(db_user)
        return (
            jsonify(
                {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "user": db_user.to_dict(),
                }
            ),
            200,
        )

    # 2. Check in-memory persona fallback
    p_user = DEFAULT_USERS.get(email)
    if p_user and p_user.get("password") == password and p_user.get("is_active", True):
        access_token = create_access_token(p_user)
        refresh_token = create_refresh_token(p_user)
        safe_user = {k: v for k, v in p_user.items() if k != "password"}
        return (
            jsonify(
                {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "user": safe_user,
                }
            ),
            200,
        )

    return jsonify({"detail": "Invalid credentials."}), 401


@auth_bp.get("/auth/me")
def get_me():
    """Return the profile of the JWT-authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"detail": "Authentication token missing or invalid."}), 401

    token = auth_header[len("Bearer ") :].strip()
    if not token:
        return jsonify({"detail": "Authentication token missing or invalid."}), 401

    try:
        claims = decode_token(token, expected_type="access")
        user = get_user_from_token(db.session, claims)
        if user is None:
            return jsonify({"detail": "User not found or inactive."}), 401

        if hasattr(user, "to_dict"):
            u_dict = user.to_dict()
        elif isinstance(user, dict):
            u_dict = user
        else:
            u_dict = {
                "id": getattr(user, "id", 1),
                "email": getattr(user, "email", "admin@peoplepay360.com"),
                "full_name": getattr(user, "full_name", "System Administrator"),
                "role": getattr(user, "role", "ADMIN"),
                "is_active": getattr(user, "is_active", True),
            }

        safe_dict = {k: v for k, v in u_dict.items() if k not in ("password", "password_hash")}
        return jsonify(safe_dict), 200
    except AuthTokenError as err:
        return jsonify({"detail": str(err)}), 401
    except Exception:
        return jsonify({"detail": "Invalid or expired token."}), 401


@auth_bp.post("/auth/refresh")
def refresh():
    """Exchange a valid refresh token for a new access token."""
    data = request.get_json(silent=True) or {}
    ref_tok = str(data.get("refresh_token", "") or "").strip()
    if not ref_tok:
        return jsonify({"detail": "Refresh token is required."}), 401

    try:
        claims = decode_token(ref_tok, expected_type="refresh")
        sub = str(claims.get("sub", "")).strip()

        user = None
        try:
            from app.models.user import User

            try:
                uid = uuid.UUID(sub)
                user = db.session.get(User, uid)
            except Exception:
                pass
            if user is None:
                user = db.session.query(User).filter(
                    (User.id == sub) | (User.email == sub.lower())
                ).first()
        except Exception:
            pass

        if user is None:
            for email, u in DEFAULT_USERS.items():
                if sub.lower() == email.lower() or sub == str(u.get("id")):
                    user = u
                    break

        if user is None:
            user = {
                "id": sub,
                "email": sub if "@" in sub else f"{sub.lower()}@peoplepay360.com",
                "role": claims.get("role", "ADMIN"),
                "is_active": True,
            }

        new_access = create_access_token(user)
        new_refresh = create_refresh_token(user)
        return (
            jsonify(
                {
                    "access_token": new_access,
                    "refresh_token": new_refresh,
                    "token_type": "bearer",
                }
            ),
            200,
        )
    except AuthTokenError as err:
        return jsonify({"detail": str(err)}), 401
    except Exception:
        return jsonify({"detail": "Invalid or expired refresh token."}), 401


@auth_bp.post("/auth/register")
def register():
    """Registers a new user; default role is always EMPLOYEE."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "") or "").strip().lower()
    full_name = str(data.get("full_name", data.get("name", "")) or "").strip()
    password = data.get("password")

    if not password:
        return jsonify({"detail": "Password is required."}), 400
    if not email:
        return jsonify({"detail": "Email is required."}), 400
    if not full_name:
        return jsonify({"detail": "Full name is required."}), 400

    # Ensure tables exist
    try:
        db.create_all()
    except Exception:
        pass

    # Check if in DEFAULT_USERS
    if email in DEFAULT_USERS:
        return jsonify({"detail": "Email already registered."}), 400

    try:
        user = create_user(
            db.session,
            email=email,
            password=str(password),
            full_name=full_name,
            role="EMPLOYEE",
            is_active=True,
        )
        db.session.commit()

        return (
            jsonify(
                {
                    "user": user.to_dict(),
                    "access_token": create_access_token(user),
                    "refresh_token": create_refresh_token(user),
                    "token_type": "bearer",
                }
            ),
            201,
        )
    except AuthValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": f"Registration failed: {str(err)}"}), 400
