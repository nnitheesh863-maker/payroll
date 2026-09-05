"""
Payroll & Payruns API Blueprint (Flow 4 - Payruns & Payslips Engine)
Supports:
- Payrun Batch Lifecycle: Draft -> Computed -> Validated -> Paid -> Sent
- Dynamic Payslip Generation & Line-Item Statutory Breakdown (PF, ESI, TDS, Basic, HRA)
"""

from flask import Blueprint, request, jsonify
from datetime import datetime

payroll_bp = Blueprint("payroll", __name__, url_prefix="/api")

# Pre-seeded Payruns
PAYRUNS = [
    {
        "id": 1,
        "batch_number": "PR-2026-09",
        "name": "September 2026 Regular Payrun",
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
        "pay_date": "2026-09-30",
        "status": "VALIDATED",
        "employee_count": 3,
        "total_gross": 285000,
        "total_deductions": 39900,
        "total_net": 245100,
        "notes": "Standard monthly cycle processed for all active employees.",
        "created_at": "2026-09-01T08:00:00Z",
    },
    {
        "id": 2,
        "batch_number": "PR-2026-08",
        "name": "August 2026 Regular Payrun",
        "period_start": "2026-08-01",
        "period_end": "2026-08-31",
        "pay_date": "2026-08-31",
        "status": "PAID",
        "employee_count": 3,
        "total_gross": 285000,
        "total_deductions": 39900,
        "total_net": 245100,
        "notes": "August pay cycle successfully disbursed via bank transfer.",
        "created_at": "2026-08-01T08:00:00Z",
    },
]

# Pre-seeded Payslips
PAYSLIPS = [
    {
        "id": 101,
        "payrun_id": 1,
        "employee_id": 1,
        "employee_name": "Aarav Mehta",
        "employee_code": "EMP-001",
        "department": "Finance",
        "designation": "Senior Financial Analyst",
        "basic_salary": 65000,
        "hra": 26000,
        "special_allowance": 14000,
        "gross_salary": 105000,
        "pf_deduction": 7800,
        "esi_deduction": 0,
        "tds_deduction": 6900,
        "total_deductions": 14700,
        "net_salary": 90300,
        "status": "VALIDATED",
        "worked_days": 30,
        "leave_days": 3,
    },
    {
        "id": 102,
        "payrun_id": 1,
        "employee_id": 2,
        "employee_name": "Sara Khan",
        "employee_code": "EMP-002",
        "department": "HR",
        "designation": "HR Operations Lead",
        "basic_salary": 55000,
        "hra": 22000,
        "special_allowance": 13000,
        "gross_salary": 90000,
        "pf_deduction": 6600,
        "esi_deduction": 0,
        "tds_deduction": 6000,
        "total_deductions": 12600,
        "net_salary": 77400,
        "status": "VALIDATED",
        "worked_days": 30,
        "leave_days": 2,
    },
    {
        "id": 103,
        "payrun_id": 1,
        "employee_id": 3,
        "employee_name": "Anil Patel",
        "employee_code": "EMP-003",
        "department": "Engineering",
        "designation": "Full Stack Engineer",
        "basic_salary": 55000,
        "hra": 22000,
        "special_allowance": 13000,
        "gross_salary": 90000,
        "pf_deduction": 6600,
        "esi_deduction": 0,
        "tds_deduction": 6000,
        "total_deductions": 12600,
        "net_salary": 77400,
        "status": "VALIDATED",
        "worked_days": 30,
        "leave_days": 1,
    },
]


@payroll_bp.get("/payruns")
def list_payruns():
    status = request.args.get("status")
    if status:
        filtered = [p for p in PAYRUNS if p["status"] == status]
        return jsonify(filtered), 200
    return jsonify(PAYRUNS), 200


@payroll_bp.get("/payruns/<int:payrun_id>")
def get_payrun(payrun_id):
    for pr in PAYRUNS:
        if pr["id"] == payrun_id:
            return jsonify(pr), 200
    return jsonify({"detail": "Payrun not found"}), 404


@payroll_bp.post("/payruns")
def create_payrun():
    data = request.get_json() or {}
    name = data.get("name", "New Payroll Batch")
    period_start = data.get("period_start", datetime.utcnow().strftime("%Y-%m-01"))
    period_end = data.get("period_end", datetime.utcnow().strftime("%Y-%m-28"))
    pay_date = data.get("pay_date", period_end)
    notes = data.get("notes", "")

    new_id = max([p["id"] for p in PAYRUNS], default=0) + 1
    batch_code = f"PR-{datetime.utcnow().strftime('%Y-%m')}-{new_id:02d}"

    new_payrun = {
        "id": new_id,
        "batch_number": batch_code,
        "name": name,
        "period_start": period_start,
        "period_end": period_end,
        "pay_date": pay_date,
        "status": "DRAFT",
        "employee_count": 3,
        "total_gross": 285000,
        "total_deductions": 39900,
        "total_net": 245100,
        "notes": notes,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    PAYRUNS.insert(0, new_payrun)

    # Generate initial draft payslips for active employees
    for emp_idx, (emp_name, emp_code, dept, desig, gross) in enumerate([
        ("Aarav Mehta", "EMP-001", "Finance", "Senior Analyst", 105000),
        ("Sara Khan", "EMP-002", "HR", "HR Manager", 90000),
        ("Anil Patel", "EMP-003", "Engineering", "Software Engineer", 90000),
    ], start=1):
        basic = int(gross * 0.5)
        hra = int(gross * 0.25)
        special = gross - basic - hra
        pf = int(basic * 0.12)
        tds = int(gross * 0.065)
        deductions = pf + tds
        net = gross - deductions

        new_slip = {
            "id": len(PAYSLIPS) + 100 + emp_idx,
            "payrun_id": new_id,
            "employee_id": emp_idx,
            "employee_name": emp_name,
            "employee_code": emp_code,
            "department": dept,
            "designation": desig,
            "basic_salary": basic,
            "hra": hra,
            "special_allowance": special,
            "gross_salary": gross,
            "pf_deduction": pf,
            "esi_deduction": 0,
            "tds_deduction": tds,
            "total_deductions": deductions,
            "net_salary": net,
            "status": "DRAFT",
            "worked_days": 30,
            "leave_days": 0,
        }
        PAYSLIPS.append(new_slip)

    return jsonify(new_payrun), 201


@payroll_bp.get("/payruns/<int:payrun_id>/payslips")
def get_payrun_payslips(payrun_id):
    matching = [ps for ps in PAYSLIPS if ps["payrun_id"] == payrun_id]
    return jsonify(matching), 200


@payroll_bp.post("/payruns/<int:payrun_id>/compute")
def compute_payrun(payrun_id):
    for pr in PAYRUNS:
        if pr["id"] == payrun_id:
            pr["status"] = "COMPUTED"
            for ps in PAYSLIPS:
                if ps["payrun_id"] == payrun_id:
                    ps["status"] = "COMPUTED"
            return jsonify(pr), 200
    return jsonify({"detail": "Payrun not found"}), 404


@payroll_bp.post("/payruns/<int:payrun_id>/validate")
def validate_payrun(payrun_id):
    for pr in PAYRUNS:
        if pr["id"] == payrun_id:
            pr["status"] = "VALIDATED"
            for ps in PAYSLIPS:
                if ps["payrun_id"] == payrun_id:
                    ps["status"] = "VALIDATED"
            return jsonify(pr), 200
    return jsonify({"detail": "Payrun not found"}), 404


@payroll_bp.post("/payruns/<int:payrun_id>/mark-paid")
def mark_paid(payrun_id):
    for pr in PAYRUNS:
        if pr["id"] == payrun_id:
            pr["status"] = "PAID"
            for ps in PAYSLIPS:
                if ps["payrun_id"] == payrun_id:
                    ps["status"] = "PAID"
            return jsonify(pr), 200
    return jsonify({"detail": "Payrun not found"}), 404


@payroll_bp.post("/payruns/<int:payrun_id>/send-payslips")
def send_payslips(payrun_id):
    for pr in PAYRUNS:
        if pr["id"] == payrun_id:
            pr["status"] = "SENT"
            for ps in PAYSLIPS:
                if ps["payrun_id"] == payrun_id:
                    ps["status"] = "SENT"
            return jsonify(pr), 200
    return jsonify({"detail": "Payrun not found"}), 404


@payroll_bp.get("/payslips")
def list_payslips():
    return jsonify(PAYSLIPS), 200


@payroll_bp.get("/payslips/<int:payslip_id>")
def get_payslip(payslip_id):
    for ps in PAYSLIPS:
        if ps["id"] == payslip_id:
            return jsonify(ps), 200
    return jsonify({"detail": "Payslip not found"}), 404
