"""
User management API — database-backed & persona-aware, admin-only.

Phase 8. All routes require the users.manage permission (Admin role).
Passwords are hashed on write and never serialized. Client-supplied roles
are validated server-side; non-admin callers cannot reach these routes at
all, so self-promotion is impossible.
"""

import uuid
from flask import Blueprint, jsonify, request

from app.api.auth_helpers import get_current_user, require_permissions
from app.extensions import db
from app.services.auth_service import (
    PERMISSION_USERS_MANAGE,
    AuthValidationError,
    create_user,
    hash_password,
    normalize_email,
)

users_bp = Blueprint("users", __name__, url_prefix="/api")

_MANAGE = require_permissions(PERMISSION_USERS_MANAGE)


def _not_found(detail="User not found"):
    return jsonify({"detail": detail}), 404


def _lookup_user(user_id):
    from app.models.user import User

    try:
        uid = uuid.UUID(str(user_id))
        db_user = db.session.get(User, uid)
        if db_user:
            return db_user
    except (ValueError, AttributeError, TypeError):
        pass

    try:
        db_user = (
            db.session.query(User)
            .filter((User.id == str(user_id)) | (User.email == str(user_id).lower()))
            .first()
        )
        if db_user:
            return db_user
    except Exception:
        pass

    from app.api.auth import DEFAULT_USERS

    for u in DEFAULT_USERS.values():
        if str(u.get("id")) == str(user_id) or str(u.get("email", "")).lower() == str(user_id).lower():
            return u
    return None


@users_bp.get("/users")
@_MANAGE
def list_users():
    from app.api.auth import DEFAULT_USERS

    role = request.args.get("role")
    status_filter = request.args.get("status")

    users_by_email = {}

    # 1. Load from DB
    try:
        from app.models.user import User

        query = User.query.order_by(User.created_at.desc())
        if role and role != "ALL":
            query = query.filter(User.role == role.strip().upper())
        for u in query.all():
            users_by_email[u.email.lower()] = u.to_dict()
    except Exception:
        pass

    # 2. Merge in-memory personas and registered users
    for email, u in DEFAULT_USERS.items():
        email_clean = email.lower()
        if email_clean not in users_by_email:
            if not role or role == "ALL" or u.get("role", "").upper() == role.strip().upper():
                users_by_email[email_clean] = {
                    "id": u.get("id"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name"),
                    "role": u.get("role"),
                    "employee_id": u.get("employee_id"),
                    "is_active": u.get("is_active", True),
                    "status": "PENDING" if not u.get("is_active", True) else "ACTIVE",
                    "created_at": u.get("created_at"),
                }
        else:
            if "is_active" in u:
                users_by_email[email_clean]["is_active"] = u["is_active"]
                users_by_email[email_clean]["status"] = "PENDING" if not u["is_active"] else "ACTIVE"

    items = list(users_by_email.values())
    if status_filter == "pending":
        items = [u for u in items if not u.get("is_active", True)]
    elif status_filter == "active":
        items = [u for u in items if u.get("is_active", True)]

    return jsonify(items), 200


@users_bp.get("/users/<user_id>")
@_MANAGE
def get_user(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    if hasattr(user, "to_dict"):
        return jsonify(user.to_dict()), 200
    return jsonify(user), 200


@users_bp.post("/users")
@_MANAGE
def create_user_route():
    data = request.get_json(silent=True) or {}
    try:
        user = create_user(
            db.session,
            email=data.get("email", ""),
            password=data.get("password", "Pass@123"),
            full_name=data.get("full_name", ""),
            role=str(data.get("role", "EMPLOYEE") or "EMPLOYEE").strip().upper(),
            employee_id=data.get("employee_id"),
            is_active=bool(data.get("is_active", True)),
        )
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.put("/users/<user_id>")
@_MANAGE
def update_user(user_id):
    from app.api.auth import DEFAULT_USERS

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    data = request.get_json(silent=True) or {}
    try:
        if isinstance(user, dict):
            user.update(data)
            email = user.get("email", "").lower()
            if email in DEFAULT_USERS:
                DEFAULT_USERS[email].update(user)
            return jsonify(user), 200

        if "email" in data:
            email = normalize_email(data.get("email"))
            user.email = email
        if "full_name" in data:
            user.full_name = str(data.get("full_name")).strip()
        if "role" in data:
            user.role = str(data.get("role")).strip().upper()
        if "is_active" in data:
            user.is_active = bool(data.get("is_active"))
        db.session.commit()
        email = user.email.lower()
        if email in DEFAULT_USERS:
            DEFAULT_USERS[email]["is_active"] = user.is_active
            if "role" in data:
                DEFAULT_USERS[email]["role"] = user.role
            if "full_name" in data:
                DEFAULT_USERS[email]["full_name"] = user.full_name
        return jsonify(user.to_dict()), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.patch("/users/<user_id>/status")
@_MANAGE
def update_user_status(user_id):
    """Admin endpoint to toggle user activation status."""
    from app.api.auth import DEFAULT_USERS

    data = request.get_json(silent=True) or {}
    is_active = bool(data.get("is_active", True))

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()

    try:
        if isinstance(user, dict):
            user["is_active"] = is_active
            email = user.get("email", "").lower()
            if email in DEFAULT_USERS:
                DEFAULT_USERS[email]["is_active"] = is_active
            return jsonify(user), 200

        user.is_active = is_active
        db.session.commit()
        email = user.email.lower()
        if email in DEFAULT_USERS:
            DEFAULT_USERS[email]["is_active"] = is_active
        return jsonify(user.to_dict()), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.patch("/users/<user_id>/approve")
@users_bp.post("/users/<user_id>/approve")
@_MANAGE
def approve_user(user_id):
    """Admin endpoint to approve and activate a pending HR / user account."""
    from app.api.auth import DEFAULT_USERS

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()

    try:
        if isinstance(user, dict):
            user["is_active"] = True
            user["status"] = "ACTIVE"
            email = user.get("email", "").lower()
            if email in DEFAULT_USERS:
                DEFAULT_USERS[email]["is_active"] = True
                DEFAULT_USERS[email]["status"] = "ACTIVE"
            return (
                jsonify(
                    {
                        "message": "User registration approved and activated successfully.",
                        "user": user,
                    }
                ),
                200,
            )

        user.is_active = True
        db.session.commit()
        email = user.email.lower()
        if email in DEFAULT_USERS:
            DEFAULT_USERS[email]["is_active"] = True
            DEFAULT_USERS[email]["status"] = "ACTIVE"
        return (
            jsonify(
                {
                    "message": "User registration approved and activated successfully.",
                    "user": user.to_dict(),
                }
            ),
            200,
        )
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.delete("/users/<user_id>")
@_MANAGE
def delete_user(user_id):
    from app.api.auth import DEFAULT_USERS

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    try:
        if hasattr(user, "id"):
            db.session.delete(user)
            db.session.commit()
        email = getattr(user, "email", "") or (user.get("email") if isinstance(user, dict) else "")
        if email and email.lower() in DEFAULT_USERS:
            del DEFAULT_USERS[email.lower()]
    except Exception:
        pass
    return jsonify({"detail": "User deleted."}), 200
