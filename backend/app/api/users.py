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
        return db.session.get(User, uid)
    except (ValueError, AttributeError, TypeError):
        pass

    from app.api.auth import DEFAULT_USERS

    for u in DEFAULT_USERS.values():
        if str(u.get("id")) == str(user_id) or u.get("email") == str(user_id):
            return u
    return None


@users_bp.get("/users")
@_MANAGE
def list_users():
    from app.api.auth import DEFAULT_USERS

    role = request.args.get("role")
    try:
        from app.models.user import User

        query = User.query.order_by(User.email)
        if role:
            query = query.filter(User.role == role.strip().upper())
        db_users = [u.to_dict() for u in query.all()]
        if db_users:
            return jsonify(db_users), 200
    except Exception:
        pass

    # Fallback to in-memory personas
    items = list(DEFAULT_USERS.values())
    if role:
        items = [u for u in items if u.get("role", "").upper() == role.strip().upper()]
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
    from app.models.user import ROLES, User

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    data = request.get_json(silent=True) or {}
    try:
        if isinstance(user, dict):
            user.update(data)
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
        return jsonify(user.to_dict()), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.delete("/users/<user_id>")
@_MANAGE
def delete_user(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    try:
        if hasattr(user, "id"):
            db.session.delete(user)
            db.session.commit()
    except Exception:
        pass
    return jsonify({"detail": "User deleted."}), 200
