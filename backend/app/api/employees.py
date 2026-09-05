"""
Employees & Directory API Blueprint
Flow 1: Employee Directory & Details with smart button metrics
"""

from flask import Blueprint, request, jsonify

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

@employees_bp.get("/employees")
def list_employees():
    dept = request.args.get("department")
    status = request.args.get("status")
    search = request.args.get("search")
    res = EMPLOYEES
    if dept:
        res = [e for e in res if e["department"].lower() == dept.lower()]
    if status:
        res = [e for e in res if e["status"].lower() == status.lower()]
    if search:
        s = search.lower()
        res = [e for e in res if s in e["first_name"].lower() or s in e["last_name"].lower() or s in e["emp_code"].lower()]
    return jsonify(res), 200

@employees_bp.get("/employees/<int:emp_id>")
def get_employee(emp_id):
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
