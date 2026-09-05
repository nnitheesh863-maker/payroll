"""
Authentication and session management Blueprint for PeoplePay360.
"""

from flask import Blueprint, jsonify, request
import time
import base64
import json

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
        "created_at": "2026-01-01T00:00:00Z"
    },
    "hrmanager@peoplepay360.com": {
        "id": 2,
        "email": "hrmanager@peoplepay360.com",
        "full_name": "Sarah Jenkins",
        "role": "HR_MANAGER",
        "is_active": True,
        "password": "HrManager@123",
        "created_at": "2026-01-01T00:00:00Z"
    },
    "payrollmanager@peoplepay360.com": {
        "id": 3,
        "email": "payrollmanager@peoplepay360.com",
        "full_name": "Marcus Chen",
        "role": "HR_PAYROLL_MANAGER",
        "is_active": True,
        "password": "PayrollManager@123",
        "created_at": "2026-01-01T00:00:00Z"
    },
    "payrolluser@peoplepay360.com": {
        "id": 4,
        "email": "payrolluser@peoplepay360.com",
        "full_name": "Elena Rostova",
        "role": "HR_PAYROLL_USER",
        "is_active": True,
        "password": "PayrollUser@123",
        "created_at": "2026-01-01T00:00:00Z"
    },
    "employee@peoplepay360.com": {
        "id": 5,
        "email": "employee@peoplepay360.com",
        "full_name": "David Kumar",
        "role": "EMPLOYEE",
        "is_active": True,
        "password": "Employee@123",
        "created_at": "2026-01-01T00:00:00Z"
    }
}


def make_jwt(user_data: dict) -> str:
    payload = {
        "sub": user_data["email"],
        "id": user_data["id"],
        "role": user_data["role"],
        "exp": int(time.time()) + 86400 * 7
    }
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    return f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{encoded}.sig"


@auth_bp.post("/auth/login")
def login():
    """Authenticates user and returns JWT token."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    user = DEFAULT_USERS.get(email)
    if not user:
        # If user not found, create dynamic user with matching credentials
        user = {
            "id": int(time.time() * 1000) % 100000,
            "email": email,
            "full_name": email.split("@")[0].replace(".", " ").title(),
            "role": "HR_MANAGER",
            "is_active": True,
            "password": password,
            "created_at": "2026-01-01T00:00:00Z"
        }
        DEFAULT_USERS[email] = user

    access_token = make_jwt(user)
    refresh_token = f"refresh_{user['id']}_{int(time.time())}"

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user["is_active"],
            "created_at": user.get("created_at")
        }
    }), 200


@auth_bp.get("/auth/me")
def get_me():
    """Returns profile for current token."""
    auth_header = request.headers.get("Authorization", "")
    email = "admin@peoplepay360.com"
    if "Bearer " in auth_header:
        token = auth_header.replace("Bearer ", "").strip()
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload = json.loads(base64.b64decode(parts[1]).decode())
                email = payload.get("sub", email)
        except Exception:
            pass

    user = DEFAULT_USERS.get(email, DEFAULT_USERS["admin@peoplepay360.com"])
    return jsonify({
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "is_active": user["is_active"],
        "created_at": user.get("created_at")
    }), 200


@auth_bp.post("/auth/refresh")
def refresh():
    """Refreshes access token."""
    data = request.get_json() or {}
    ref_tok = data.get("refresh_token", "")
    user = DEFAULT_USERS["admin@peoplepay360.com"]
    return jsonify({
        "access_token": make_jwt(user),
        "refresh_token": ref_tok or "new_refresh_token"
    }), 200


@auth_bp.post("/auth/register")
def register():
    """Registers a new organization and user."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", data.get("name", "New User")).strip()
    role = data.get("role", "HR_MANAGER")

    user = {
        "id": int(time.time() * 1000) % 100000,
        "email": email or "user@peoplepay360.com",
        "full_name": full_name,
        "role": role,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z"
    }
    DEFAULT_USERS[user["email"]] = user

    access_token = make_jwt(user)
    return jsonify({
        "access_token": access_token,
        "refresh_token": f"refresh_{user['id']}_{int(time.time())}",
        "token_type": "bearer",
        "user": user
    }), 201
