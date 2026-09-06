"""
Employees & Directory API Blueprint
Flow 1: Employee Directory & Details with smart button metrics
"""

from flask import Blueprint, request, jsonify
from app.extensions import db

employees_bp = Blueprint("employees", __name__, url_prefix="/api")

EMPLOYEES = [
    {
        "id": 1,
        "emp_code": "EMP-001",
        "first_name": "Aarav",
        "last_name": "Mehta",
        "email": "aarav.mehta@peoplepay360.com",
        "phone": "+91 98765 43210",
        "department": "Finance",
        "position": "Senior Financial Analyst",
        "joining_date": "2024-01-15",
        "status": "ACTIVE",
        "manager": "Sara Khan",
        "work_location": "Bangalore HQ",
        "company": "PeoplePay360 Global",
        "working_hours": "Standard 40h / week",
        "bank_account_number": "XXXX-XXXX-8921",
        "bank_name": "HDFC Bank",
        "bank_ifsc": "HDFC0001234",
        "pan_number": "ABCDE1234F",
        "pf_number": "PF/BLR/00912/001",
        "uan_number": "100982348123",
        "address": "Indiranagar, Bangalore, Karnataka",
        "emergency_contact": "+91 98765 00000",
    },
    {
        "id": 2,
        "emp_code": "EMP-002",
        "first_name": "Sara",
        "last_name": "Khan",
        "email": "sara.khan@peoplepay360.com",
        "phone": "+91 98765 43211",
        "department": "HR",
        "position": "HR Operations Lead",
        "joining_date": "2023-06-01",
        "status": "ACTIVE",
        "manager": "System Admin",
        "work_location": "Bangalore HQ",
        "company": "PeoplePay360 Global",
        "working_hours": "Standard 40h / week",
        "bank_account_number": "XXXX-XXXX-4432",
        "bank_name": "ICICI Bank",
        "bank_ifsc": "ICIC0004321",
        "pan_number": "FGHIJ5678K",
        "pf_number": "PF/BLR/00912/002",
        "uan_number": "100982348124",
        "address": "Koramangala, Bangalore, Karnataka",
        "emergency_contact": "+91 98765 11111",
    },
    {
        "id": 3,
        "emp_code": "EMP-003",
        "first_name": "Anil",
        "last_name": "Patel",
        "email": "anil.patel@peoplepay360.com",
        "phone": "+91 98765 43212",
        "department": "Engineering",
        "position": "Full Stack Engineer",
        "joining_date": "2024-03-01",
        "status": "ACTIVE",
        "manager": "Sara Khan",
        "work_location": "Bangalore HQ",
        "company": "PeoplePay360 Global",
        "working_hours": "Standard 40h / week",
        "bank_account_number": "XXXX-XXXX-1122",
        "bank_name": "State Bank of India",
        "bank_ifsc": "SBIN0001122",
        "pan_number": "KLMNO9012P",
        "pf_number": "PF/BLR/00912/003",
        "uan_number": "100982348125",
        "address": "Whitefield, Bangalore, Karnataka",
        "emergency_contact": "+91 98765 22222",
    },
]

def _serialize_db_employee(emp, idx):
    dept_name = emp.department.name if emp.department else "Engineering"
    return {
        "id": idx,
        "uuid": str(emp.id),
        "emp_code": emp.employee_code or f"EMP-{idx:03d}",
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": emp.email,
        "phone": emp.phone or "+91 98765 43210",
        "department": dept_name,
        "position": emp.job_title or "Specialist",
        "joining_date": emp.joining_date.isoformat() if emp.joining_date else "2024-01-15",
        "status": emp.employment_status.upper() if emp.employment_status else "ACTIVE",
        "manager": "Sara Khan",
        "work_location": "Bangalore HQ",
        "company": "PeoplePay360 Global",
        "working_hours": "Standard 40h / week",
        "bank_account_number": emp.bank_account_number or f"XXXX-XXXX-{1000 + idx}",
        "bank_name": emp.bank_name or "HDFC Bank",
        "bank_ifsc": emp.bank_ifsc_code or "HDFC0001234",
        "pan_number": "ABCDE1234F",
        "pf_number": f"PF/BLR/00912/{idx:03d}",
        "uan_number": f"1009823481{idx:02d}",
        "address": f"{emp.city or 'Bangalore'}, {emp.state or 'Karnataka'}",
        "emergency_contact": "+91 98765 00000",
    }


@employees_bp.get("/employees")
def list_employees():
    dept = request.args.get("department")
    status = request.args.get("status")
    search = request.args.get("search")

    try:
        from app.models.employee import Employee
        db_emps = Employee.query.order_by(Employee.employee_code.asc()).all()
        if db_emps:
            res = [_serialize_db_employee(e, i) for i, e in enumerate(db_emps, start=1)]
        else:
            res = EMPLOYEES
    except Exception:
        res = EMPLOYEES

    if dept and dept.upper() != "ALL":
        res = [e for e in res if e["department"].lower() == dept.lower()]
    if status and status.upper() != "ALL":
        res = [e for e in res if e["status"].lower() == status.lower()]
    if search:
        s = search.lower()
        res = [e for e in res if s in e["first_name"].lower() or s in e["last_name"].lower() or s in e["emp_code"].lower()]
    return jsonify(res), 200


@employees_bp.get("/employees/<int:emp_id>")
def get_employee(emp_id):
    try:
        from app.models.employee import Employee
        db_emps = Employee.query.order_by(Employee.employee_code.asc()).all()
        if 1 <= emp_id <= len(db_emps):
            return jsonify(_serialize_db_employee(db_emps[emp_id - 1], emp_id)), 200
    except Exception:
        pass

    for e in EMPLOYEES:
        if e["id"] == emp_id:
            return jsonify(e), 200
    return jsonify({"detail": "Employee not found"}), 404


@employees_bp.post("/employees")
def create_employee():
    data = request.get_json() or {}
    new_id = max([e["id"] for e in EMPLOYEES], default=0) + 1
    new_emp = {
        "id": new_id,
        "emp_code": f"EMP-{new_id:03d}",
        "first_name": data.get("first_name", "New"),
        "last_name": data.get("last_name", "Employee"),
        "email": data.get("email", f"emp{new_id}@peoplepay360.com"),
        "phone": data.get("phone", "+91 90000 00000"),
        "department": data.get("department", "Engineering"),
        "position": data.get("position", "Specialist"),
        "joining_date": data.get("joining_date", "2026-09-01"),
        "status": data.get("status", "ACTIVE"),
        "manager": data.get("manager", "Sara Khan"),
        "work_location": data.get("work_location", "Bangalore HQ"),
        "company": "PeoplePay360 Global",
        "working_hours": "Standard 40h / week",
    }
    EMPLOYEES.append(new_emp)
    return jsonify(new_emp), 201


@employees_bp.put("/employees/<int:emp_id>")
def update_employee(emp_id):
    data = request.get_json() or {}
    for e in EMPLOYEES:
        if e["id"] == emp_id:
            e.update(data)
            return jsonify(e), 200
    return jsonify({"detail": "Employee not found"}), 404

# ─── EMPLOYEE SUB-RESOURCES ──────────────────────────────────────────────────

@employees_bp.get("/employees/<int:emp_id>/contracts")
def get_employee_contracts(emp_id):
    """Returns contracts for a specific employee."""
    try:
        from app.api.core_hr import CONTRACTS
        matching = [c for c in CONTRACTS if c.get("employee_id") == emp_id]
        return jsonify(matching), 200
    except Exception:
        return jsonify([]), 200

@employees_bp.get("/employees/<int:emp_id>/attendances")
def get_employee_attendances(emp_id):
    """Returns attendance records for a specific employee."""
    try:
        from app.api.core_hr import ATTENDANCES
        matching = [a for a in ATTENDANCES if a.get("employee_id") == emp_id]
        return jsonify(matching), 200
    except Exception:
        return jsonify([]), 200

@employees_bp.get("/employees/<int:emp_id>/payslips")
def get_employee_payslips(emp_id):
    """Returns payslips for a specific employee."""
    matching = [
        {
            "id": 101,
            "payrun_id": 1,
            "employee_id": emp_id,
            "employee_name": "Aarav Mehta" if emp_id == 1 else "Sara Khan" if emp_id == 2 else "Anil Patel",
            "payslip_number": f"PS-2026-{100 + emp_id}",
            "period_start": "2026-09-01",
            "period_end": "2026-09-30",
            "basic_salary": 65000 if emp_id == 1 else 55000,
            "gross_salary": 105000 if emp_id == 1 else 90000,
            "total_deductions": 14700 if emp_id == 1 else 12600,
            "net_salary": 90300 if emp_id == 1 else 77400,
            "status": "VALIDATED",
            "worked_days": 30,
        }
    ]
    return jsonify(matching), 200

@employees_bp.get("/employees/<int:emp_id>/time-off")
def get_employee_time_off(emp_id):
    """Returns leave requests for a specific employee."""
    try:
        from app.api.time_off import TIME_OFF_REQUESTS
        matching = [t for t in TIME_OFF_REQUESTS if t.get("employee_id") == emp_id]
        return jsonify(matching), 200
    except Exception:
        return jsonify([]), 200
