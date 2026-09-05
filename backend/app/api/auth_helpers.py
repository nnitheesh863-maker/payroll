"""
Authentication helpers for Flask routes — JWT gate and RBAC guards.

Phase 8. Identity always derives from the validated JWT; client-supplied
IDs are never trusted as proof of identity. Inactive users fail closed.
"""

from functools import wraps

from flask import g, jsonify, request

from app.extensions import db
from app.services.auth_service import (
    AuthTokenError,
    decode_token,
    get_user_from_token,
    has_permission,
)


def _unauthorized(detail="Authentication required."):
    return jsonify({"detail": detail}), 401


def _forbidden(detail="Insufficient permissions."):
    return jsonify({"detail": detail}), 403


def jwt_required(fn):
    """Require a valid Bearer access token; binds ``g.current_user``."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return _unauthorized()
        token = header[len("Bearer "):].strip()
        if not token:
            return _unauthorized()
        try:
            claims = decode_token(token)
        except AuthTokenError as err:
            return _unauthorized(str(err))
        user = get_user_from_token(db.session, claims)
        if user is None:
            return _unauthorized("Invalid or inactive user.")
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def require_permissions(*permissions):
    """Require authentication plus every listed permission (else 403)."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not all(has_permission(user.role, perm) for perm in permissions):
                return _forbidden()
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def get_current_user():
    """Return the JWT-authenticated user for this request (or None)."""
    return getattr(g, "current_user", None)


def get_current_employee_id():
    """Return the linked employee id of the caller (or None)."""
    user = get_current_user()
    return user.employee_id if user else None
