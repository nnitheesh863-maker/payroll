"""
Contracts & Attendance & Salary API Blueprints
Flow 1 & 2 & 4
"""

from flask import Blueprint, request, jsonify

contracts_bp = Blueprint("contracts", __name__, url_prefix="/api")
attendance_bp = Blueprint("attendance", __name__, url_prefix="/api")
salary_bp = Blueprint("salary", __name__, url_prefix="/api")

# ─── CONTRACTS ───────────────────────────────────────────────────────────────
CONTRACTS = [
    {
        "id": 1,
        "contract_code": "CNT-001",
        "employee_id": 1,
        "contract_title": "Full-Time Senior Financial Analyst",
        "contract_type": "Permanent",
        "start_date": "2024-01-15",
        "wage": 105000,
        "working_hours_per_week": 40,
        "salary_structure_id": 1,
        "salary_structure_name": "Standard Professional Structure",
        "status": "Running",
        "employee": {"first_name": "Aarav", "last_name": "Mehta", "department": "Finance"},
    },
    {
        "id": 2,
        "contract_code": "CNT-002",
        "employee_id": 2,
        "contract_title": "HR Lead Employment Agreement",
        "contract_type": "Permanent",
        "start_date": "2023-06-01",
        "wage": 90000,
        "working_hours_per_week": 40,
        "salary_structure_id": 1,
        "salary_structure_name": "Standard Professional Structure",
        "status": "Running",
        "employee": {"first_name": "Sara", "last_name": "Khan", "department": "HR"},
    },
    {
        "id": 3,
        "contract_code": "CNT-003",
        "employee_id": 3,
        "contract_title": "Full Stack Engineer Contract",
        "contract_type": "Permanent",
        "start_date": "2024-03-01",
        "wage": 90000,
        "working_hours_per_week": 40,
        "salary_structure_id": 1,
        "salary_structure_name": "Standard Professional Structure",
        "status": "Running",
        "employee": {"first_name": "Anil", "last_name": "Patel", "department": "Engineering"},
    },
]

@contracts_bp.get("/contracts")
def list_contracts():
    try:
        from app.models.contract import Contract
        db_contracts = Contract.query.all()
        if db_contracts:
            result = []
            for idx, c in enumerate(db_contracts, start=1):
                emp = c.employee
                result.append({
                    "id": idx,
                    "uuid": str(c.id),
                    "contract_code": f"CNT-{idx:03d}",
                    "employee_id": idx,
                    "contract_title": f"{emp.job_title or 'Employee'} Contract" if emp else "Employment Agreement",
                    "contract_type": c.contract_type or "Permanent",
                    "start_date": c.start_date.isoformat() if c.start_date else "2024-01-15",
                    "wage": float(c.salary),
                    "working_hours_per_week": float(c.working_hours_per_week or 40.0),
                    "salary_structure_id": 1,
                    "salary_structure_name": c.salary_structure.name if c.salary_structure else "Standard Professional Structure",
                    "status": "Running" if (c.status or "").lower() == "active" else c.status,
                    "employee": {
                        "first_name": emp.first_name if emp else "Employee",
                        "last_name": emp.last_name if emp else "",
                        "department": emp.department.name if (emp and emp.department) else "Operations",
                    },
                })
            return jsonify(result), 200
    except Exception:
        pass
    return jsonify(CONTRACTS), 200

@contracts_bp.get("/contracts/<int:contract_id>")
def get_contract(contract_id):
    try:
        from app.models.contract import Contract
        db_contracts = Contract.query.all()
        if 1 <= contract_id <= len(db_contracts):
            c = db_contracts[contract_id - 1]
            emp = c.employee
            return jsonify({
                "id": contract_id,
                "uuid": str(c.id),
                "contract_code": f"CNT-{contract_id:03d}",
                "employee_id": contract_id,
                "contract_title": f"{emp.job_title or 'Employee'} Contract" if emp else "Employment Agreement",
                "contract_type": c.contract_type or "Permanent",
                "start_date": c.start_date.isoformat() if c.start_date else "2024-01-15",
                "wage": float(c.salary),
                "working_hours_per_week": float(c.working_hours_per_week or 40.0),
                "salary_structure_id": 1,
                "salary_structure_name": c.salary_structure.name if c.salary_structure else "Standard Professional Structure",
                "status": "Running" if (c.status or "").lower() == "active" else c.status,
                "employee": {
                    "first_name": emp.first_name if emp else "Employee",
                    "last_name": emp.last_name if emp else "",
                    "department": emp.department.name if (emp and emp.department) else "Operations",
                },
            }), 200
    except Exception:
        pass
    for c in CONTRACTS:
        if c["id"] == contract_id:
            return jsonify(c), 200
    return jsonify({"detail": "Contract not found"}), 404

@contracts_bp.post("/contracts")
def create_contract():
    data = request.get_json() or {}
    new_id = len(CONTRACTS) + 1
    new_c = {
        "id": new_id,
        "contract_code": f"CNT-{new_id:03d}",
        "employee_id": data.get("employee_id", 1),
        "contract_title": data.get("contract_title", "Employment Contract"),
        "contract_type": data.get("contract_type", "Permanent"),
        "start_date": data.get("start_date", "2026-09-01"),
        "wage": data.get("wage", 75000),
        "working_hours_per_week": data.get("working_hours_per_week", 40),
        "status": "Running",
    }
    CONTRACTS.append(new_c)
    return jsonify(new_c), 201

# ─── ATTENDANCES ─────────────────────────────────────────────────────────────
ATTENDANCES = [
    {
        "id": 1,
        "employee_id": 1,
        "attendance_date": "2026-09-02",
        "check_in": "09:00:00",
        "check_out": "18:00:00",
        "worked_hours": 9.0,
        "overtime_hours": 1.0,
        "status": "PRESENT",
        "employee": {"first_name": "Aarav", "last_name": "Mehta", "department": "Finance"},
    },
    {
        "id": 2,
        "employee_id": 2,
        "attendance_date": "2026-09-02",
        "check_in": "09:15:00",
        "check_out": "17:45:00",
        "worked_hours": 8.5,
        "overtime_hours": 0.5,
        "status": "PRESENT",
        "employee": {"first_name": "Sara", "last_name": "Khan", "department": "HR"},
    },
]

@attendance_bp.get("/attendances")
def list_attendances():
    return jsonify(ATTENDANCES), 200

@attendance_bp.post("/attendances/check-in")
def check_in():
    return jsonify({"status": "checked_in", "time": "09:00 AM"}), 200

@attendance_bp.post("/attendances/check-out")
def check_out():
    return jsonify({"status": "checked_out", "time": "06:00 PM"}), 200

# ─── SALARY STRUCTURES ───────────────────────────────────────────────────────
STRUCTURES = [
    {
        "id": 1,
        "code": "STD_PROF",
        "name": "Standard Professional Structure",
        "description": "50% Basic, 25% HRA, PF 12%, TDS Progressive",
        "is_active": True,
        "rules": [
            {"code": "BASIC", "name": "Basic Salary", "category": "BASIC", "rule_type": "PERCENTAGE", "amount_or_percentage": 50, "sequence": 1, "is_active": True},
            {"code": "HRA", "name": "House Rent Allowance", "category": "ALLOWANCE", "rule_type": "PERCENTAGE", "amount_or_percentage": 25, "sequence": 2, "is_active": True},
            {"code": "PF", "name": "Provident Fund", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 12, "sequence": 3, "is_active": True},
            {"code": "TDS", "name": "Income Tax TDS", "category": "DEDUCTION", "rule_type": "PERCENTAGE", "amount_or_percentage": 6.5, "sequence": 4, "is_active": True},
        ]
    }
]

@salary_bp.get("/salary/structures")
@salary_bp.get("/salary-structures")
def list_salary_structures():
    return jsonify(STRUCTURES), 200

@salary_bp.get("/salary/structures/<int:sid>")
@salary_bp.get("/salary-structures/<int:sid>")
def get_salary_structure(sid):
    for s in STRUCTURES:
        if s["id"] == sid:
            return jsonify(s), 200
    return jsonify({"detail": "Salary structure not found"}), 404

@salary_bp.post("/salary/structures")
@salary_bp.post("/salary-structures")
def create_salary_structure():
    data = request.get_json() or {}
    new_id = len(STRUCTURES) + 1
    new_s = {
        "id": new_id,
        "code": data.get("code", f"STR_{new_id}"),
        "name": data.get("name", "Custom Salary Structure"),
        "description": data.get("description", ""),
        "is_active": True,
        "rules": data.get("rules", []),
    }
    STRUCTURES.append(new_s)
    return jsonify(new_s), 201

@salary_bp.post("/salary/rules")
def create_salary_rule():
    data = request.get_json() or {}
    new_r = {
        "id": 100,
        "code": data.get("code", "CUSTOM"),
        "name": data.get("name", "Custom Rule"),
        "category": data.get("category", "ALLOWANCE"),
        "rule_type": data.get("rule_type", "PERCENTAGE"),
        "amount_or_percentage": data.get("amount_or_percentage", 10),
        "sequence": data.get("sequence", 1),
        "is_active": True,
    }
    return jsonify(new_r), 201

