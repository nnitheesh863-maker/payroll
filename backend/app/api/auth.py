"""
Authentication API — database-backed login, identity and registration.

Phase 8. Replaces the former insecure mock (plaintext passwords, unsigned
tokens). Route paths and response shapes are preserved. Public
registration always creates EMPLOYEE-role users; privileged roles are
assigned only through the admin-guarded user API.
"""

from flask import Blueprint, jsonify, request

from app.api.auth_helpers import get_current_user, jwt_required
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

auth_bp = Blueprint("auth", __name__)

def _invalid_credentials():
    return jsonify({"detail": "Invalid credentials."}), 401


def _token_pair(user):
    return {
        "access_token": create_access_token(user),
        "refresh_token": create_refresh_token(user),
        "token_type": "bearer",
    }


@auth_bp.post("/auth/login")
def login():
    """Authenticate with email + password and receive tokens."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "") or "")
    password = data.get("password", "") or ""
    if not email.strip() or not password:
        return _invalid_credentials()
    user = authenticate_user(db.session, email, password)
    if user is None:
        return _invalid_credentials()
    payload = _token_pair(user)
    payload["user"] = user.to_dict()
    return jsonify(payload), 200


@auth_bp.get("/auth/me")
@jwt_required
def get_me():
    """Return the profile of the JWT-authenticated user."""
    return jsonify(get_current_user().to_dict()), 200


@auth_bp.post("/auth/refresh")
def refresh():
    """Exchange a valid refresh token for a new token pair."""
    data = request.get_json(silent=True) or {}
    token = str(data.get("refresh_token", "") or "").strip()
    if not token:
        return jsonify({"detail": "Refresh token is required."}), 401
    try:
        claims = decode_token(token, expected_type="refresh")
    except AuthTokenError as err:
        return jsonify({"detail": str(err)}), 401
    user = get_user_from_token(db.session, claims)
    if user is None:
        return jsonify({"detail": "Invalid or inactive user."}), 401
    return jsonify(_token_pair(user)), 200


@auth_bp.post("/auth/register")
def register():
    """Public self-registration — always creates an EMPLOYEE user.

    Any client-supplied role is ignored so callers cannot promote
    themselves; privileged roles require the admin user API.
    """
    data = request.get_json(silent=True) or {}
    try:
        user = create_user(
            db.session,
            email=data.get("email", ""),
            password=data.get("password", ""),
            full_name=data.get("full_name", data.get("name", "")),
            role="EMPLOYEE",
        )
        db.session.commit()
    except AuthValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    payload = _token_pair(user)
    payload["user"] = user.to_dict()
    return jsonify(payload), 201
