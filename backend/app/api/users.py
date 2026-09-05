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

    uid = None
    try:
        uid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError, TypeError):
        return None

    try:
        db_user = db.session.get(User, uid)
        if db_user:
            return db_user
    except Exception:
        pass

    return None


@users_bp.get("/users")
@_MANAGE
def list_users():
    from app.models.user import User

    role = request.args.get("role")
    query = User.query.order_by(User.created_at.desc())
    if role and role != "ALL":
        query = query.filter(User.role == role.strip().upper())
    
    users = query.all()
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.get("/users/<user_id>")
@_MANAGE
def get_user(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    return jsonify(user.to_dict()), 200


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
    except AuthValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.put("/users/<user_id>")
@_MANAGE
def update_user(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    data = request.get_json(silent=True) or {}
    try:
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


@users_bp.patch("/users/<user_id>/status")
@_MANAGE
def update_user_status(user_id):
    """Admin endpoint to toggle user activation status."""
    data = request.get_json(silent=True) or {}
    is_active = bool(data.get("is_active", True))

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()

    caller = get_current_user()
    if caller and not is_active:
        user_id_str = str(getattr(user, "id", ""))
        caller_id_str = str(getattr(caller, "id", ""))
        user_email = str(getattr(user, "email", "")).lower()
        caller_email = str(getattr(caller, "email", "")).lower()
        if user_id_str == caller_id_str or (user_email and user_email == caller_email):
            return jsonify({"detail": "Cannot deactivate your own account."}), 400

    try:
        user.is_active = is_active
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400


@users_bp.patch("/users/<user_id>/approve")
@users_bp.post("/users/<user_id>/approve")
@_MANAGE
def approve_user(user_id):
    """Admin endpoint to approve and activate a pending HR / user account."""
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()

    try:
        user.is_active = True
        db.session.commit()
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
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()

    caller = get_current_user()
    if caller:
        user_id_str = str(getattr(user, "id", ""))
        caller_id_str = str(getattr(caller, "id", ""))
        user_email = str(getattr(user, "email", "")).lower()
        caller_email = str(getattr(caller, "email", "")).lower()
        if user_id_str == caller_id_str or (user_email and user_email == caller_email):
            return jsonify({"detail": "Cannot delete your own account."}), 400

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"detail": "User deleted."}), 200
    except Exception as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
