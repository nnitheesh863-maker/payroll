"""
User management API — database-backed, admin-only.

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
    except (ValueError, AttributeError, TypeError):
        return None
    return db.session.get(User, uid)


@users_bp.get("/users")
@_MANAGE
def list_users():
    from app.models.user import User

    role = request.args.get("role")
    query = User.query.order_by(User.email)
    if role:
        query = query.filter(User.role == role.strip().upper())
    return jsonify([u.to_dict() for u in query.all()]), 200


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
            password=data.get("password", ""),
            full_name=data.get("full_name", ""),
            role=str(data.get("role", "EMPLOYEE") or "EMPLOYEE").strip().upper(),
            employee_id=data.get("employee_id"),
            is_active=bool(data.get("is_active", True)),
        )
        db.session.commit()
    except AuthValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    return jsonify(user.to_dict()), 201


@users_bp.put("/users/<user_id>")
@_MANAGE
def update_user(user_id):
    from app.models.user import ROLES, User

    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    data = request.get_json(silent=True) or {}
    try:
        if "email" in data:
            email = normalize_email(data.get("email"))
            if not email or "@" not in email:
                raise AuthValidationError("A valid email address is required.")
            existing = db.session.query(User).filter_by(email=email).first()
            if existing is not None and existing.id != user.id:
                raise AuthValidationError(f"User '{email}' already exists.")
            user.email = email
        if "full_name" in data:
            if not data.get("full_name") or not str(data.get("full_name")).strip():
                raise AuthValidationError("Full name is required.")
            user.full_name = str(data.get("full_name")).strip()
        if "role" in data:
            role = str(data.get("role") or "").strip().upper()
            if role not in ROLES:
                raise AuthValidationError(f"Invalid role '{data.get('role')}'.")
            user.role = role
        if "employee_id" in data:
            employee_id = data.get("employee_id")
            if employee_id in (None, ""):
                user.employee_id = None
            else:
                from app.models.employee import Employee

                try:
                    emp_uuid = uuid.UUID(str(employee_id))
                except (ValueError, AttributeError, TypeError):
                    raise AuthValidationError("Invalid employee_id.")
                if db.session.get(Employee, emp_uuid) is None:
                    raise AuthValidationError("Linked employee does not exist.")
                user.employee_id = emp_uuid
        if "password" in data and data.get("password") not in (None, ""):
            user.password_hash = hash_password(data.get("password"))
        if "is_active" in data:
            if (
                str(user.id) == str(get_current_user().id)
                and not bool(data.get("is_active"))
            ):
                raise AuthValidationError("You cannot deactivate your own account.")
            user.is_active = bool(data.get("is_active"))
        db.session.commit()
    except AuthValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    return jsonify(user.to_dict()), 200


@users_bp.patch("/users/<user_id>/status")
@_MANAGE
def update_user_status(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    data = request.get_json(silent=True) or {}
    if str(user.id) == str(get_current_user().id) and not bool(
        data.get("is_active", True)
    ):
        return jsonify({"detail": "You cannot deactivate your own account."}), 400
    user.is_active = bool(data.get("is_active", True))
    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.delete("/users/<user_id>")
@_MANAGE
def delete_user(user_id):
    user = _lookup_user(user_id)
    if user is None:
        return _not_found()
    if str(user.id) == str(get_current_user().id):
        return jsonify({"detail": "You cannot delete your own account."}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"detail": "User deleted."}), 200
