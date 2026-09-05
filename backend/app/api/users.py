"""
User Management & Access Control API Blueprint
Flow 0: User Management, Roles, and Employee Linking
"""

from flask import Blueprint, request, jsonify

users_bp = Blueprint("users", __name__, url_prefix="/api")

USERS = [
    {
        "id": 1,
        "email": "admin@peoplepay360.com",
        "full_name": "System Administrator",
        "role": "ADMIN",
        "employee_id": None,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": 2,
        "email": "hrmanager@peoplepay360.com",
        "full_name": "Sara Khan",
        "role": "HR_MANAGER",
        "employee_id": 2,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": 3,
        "email": "payrollmanager@peoplepay360.com",
        "full_name": "Rajesh Sharma",
        "role": "HR_PAYROLL_MANAGER",
        "employee_id": None,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": 4,
        "email": "payrolluser@peoplepay360.com",
        "full_name": "Priya Varma",
        "role": "HR_PAYROLL_USER",
        "employee_id": None,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": 5,
        "email": "employee@peoplepay360.com",
        "full_name": "Aarav Mehta",
        "role": "EMPLOYEE",
        "employee_id": 1,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
    },
]

@users_bp.get("/users")
def list_users():
    role = request.args.get("role")
    if role:
        filtered = [u for u in USERS if u["role"] == role]
        return jsonify(filtered), 200
    return jsonify(USERS), 200

@users_bp.get("/users/<int:user_id>")
def get_user(user_id):
    for u in USERS:
        if u["id"] == user_id:
            return jsonify(u), 200
    return jsonify({"detail": "User not found"}), 404

@users_bp.post("/users")
def create_user():
    data = request.get_json() or {}
    new_id = max([u["id"] for u in USERS], default=0) + 1
    new_user = {
        "id": new_id,
        "email": data.get("email", ""),
        "full_name": data.get("full_name", "New User"),
        "role": data.get("role", "EMPLOYEE"),
        "employee_id": data.get("employee_id"),
        "is_active": data.get("is_active", True),
        "created_at": "2026-09-01T00:00:00Z",
    }
    USERS.append(new_user)
    return jsonify(new_user), 201

@users_bp.put("/users/<int:user_id>")
def update_user(user_id):
    data = request.get_json() or {}
    for u in USERS:
        if u["id"] == user_id:
            u.update(data)
            return jsonify(u), 200
    return jsonify({"detail": "User not found"}), 404

@users_bp.patch("/users/<int:user_id>/status")
def update_user_status(user_id):
    data = request.get_json() or {}
    for u in USERS:
        if u["id"] == user_id:
            u["is_active"] = data.get("is_active", True)
            return jsonify(u), 200
    return jsonify({"detail": "User not found"}), 404
