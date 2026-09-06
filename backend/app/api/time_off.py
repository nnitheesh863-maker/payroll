"""
Time Off & Leave Management API Blueprint
Implements Flow 3 of the Odoo Hackathon Wireframe:
- Time Off Types (List & Form View with Allocation, Unit, Approval rules)
- Allocations (List & Form View with Allocated, Taken, Remaining days & Approval flow)
- Time Off Requests (List & Form View with Approve, Refuse, and automatic balance deduction)
"""

from flask import Blueprint, request, jsonify

time_off_bp = Blueprint("time_off", __name__, url_prefix="/api/time-off")

# In-memory mock database pre-seeded with Wireframe & Enterprise data
TIME_OFF_TYPES = [
    {
        "id": 1,
        "name": "Casual Leave",
        "code": "CASUAL",
        "unit": "Days",
        "requires_allocation": "Yes",
        "approval": "Manager",
        "payroll_work_entry": "Paid Leave (100% Salary)",
        "display_color": "Amber",
        "active": True,
        "config_notes": "Standard annual casual leaves. Full salary paid; consumes leave allocation.",
    },
    {
        "id": 2,
        "name": "Paid Time Off",
        "code": "PTO",
        "unit": "Days",
        "requires_allocation": "Yes",
        "approval": "Manager",
        "payroll_work_entry": "Paid Leave",
        "display_color": "Blue",
        "active": True,
        "config_notes": "Standard annual leave. Balance comes from approved allocations.",
    },
    {
        "id": 3,
        "name": "Sick Leave",
        "code": "SICK",
        "unit": "Days",
        "requires_allocation": "Yes",
        "approval": "Manager",
        "payroll_work_entry": "Paid Sick Leave",
        "display_color": "Rose",
        "active": True,
        "config_notes": "Statutory health leave with full compensation.",
    },
    {
        "id": 4,
        "name": "Unpaid Leave (LOP)",
        "code": "UNPAID",
        "unit": "Days",
        "requires_allocation": "No",
        "approval": "Manager",
        "payroll_work_entry": "Loss of Pay (LOP) Deduction",
        "display_color": "Red",
        "active": True,
        "config_notes": "Unpaid leave that results in direct per-day salary deduction during payrun.",
    },
    {
        "id": 5,
        "name": "Comp Off",
        "code": "COMP",
        "unit": "Hours",
        "requires_allocation": "No",
        "approval": "Officer",
        "payroll_work_entry": "Compensatory Entry",
        "display_color": "Emerald",
        "active": True,
        "config_notes": "Granted for weekend or overtime shifts.",
    },
]

ALLOCATIONS = [
    {
        "id": 1,
        "employee_id": 101,
        "employee_name": "Nitheesh",
        "time_off_type_id": 1,
        "time_off_type_name": "Casual Leave",
        "allocated_days": 12,
        "taken_days": 0,
        "remaining_days": 12,
        "status": "Approved",
        "approver": "Team Manager - Arun",
        "validity": "2026 Annual Quota",
        "description": "Annual Casual Leave allocation for Nitheesh (12 days/year).",
    },
    {
        "id": 2,
        "employee_id": 1,
        "employee_name": "Aarav Mehta",
        "time_off_type_id": 2,
        "time_off_type_name": "Paid Time Off",
        "allocated_days": 20,
        "taken_days": 8,
        "remaining_days": 12,
        "status": "Approved",
        "approver": "Sara Khan",
        "validity": "2026 Annual Balance",
        "description": "Annual leave balance granted at start of policy year.",
    },
    {
        "id": 3,
        "employee_id": 2,
        "employee_name": "Sara Khan",
        "time_off_type_id": 2,
        "time_off_type_name": "Paid Time Off",
        "allocated_days": 20,
        "taken_days": 6,
        "remaining_days": 14,
        "status": "Approved",
        "approver": "System Admin",
        "validity": "2026 Annual Balance",
        "description": "HR Manager annual leave quota.",
    },
    {
        "id": 4,
        "employee_id": 3,
        "employee_name": "Anil Patel",
        "time_off_type_id": 5,
        "time_off_type_name": "Comp Off",
        "allocated_days": 2,
        "taken_days": 1,
        "remaining_days": 1,
        "status": "To Approve",
        "approver": "HR Manager - Sara Khan",
        "validity": "Q3 2026 Overtime",
        "description": "Compensation for deployment weekend.",
    },
    {
        "id": 5,
        "employee_id": 101,
        "employee_name": "Nitheesh",
        "time_off_type_id": 3,
        "time_off_type_name": "Sick Leave",
        "allocated_days": 10,
        "taken_days": 2,
        "remaining_days": 8,
        "status": "Approved",
        "approver": "HR Manager - Sara Khan",
        "validity": "2026 Statutory Health Leave",
        "description": "Annual statutory sick leave quota (10 days).",
    },
]

REQUESTS = [
    {
        "id": 1,
        "employee_id": 101,
        "employee_name": "Nitheesh",
        "time_off_type_id": 1,
        "time_off_type_name": "Casual Leave",
        "start_date": "10-Sep-2026",
        "end_date": "12-Sep-2026",
        "duration": "3 Days",
        "days_count": 3,
        "status": "To Approve",
        "approver": "Team Manager - Arun",
        "allocation_used": "Casual Leave 2026",
        "reason": "Personal work",
    },
    {
        "id": 2,
        "employee_id": 1,
        "employee_name": "Aarav Mehta",
        "time_off_type_id": 2,
        "time_off_type_name": "Paid Time Off",
        "start_date": "12-Sep-2026",
        "end_date": "14-Sep-2026",
        "duration": "3 Days",
        "days_count": 3,
        "status": "Approved",
        "approver": "Sara Khan",
        "allocation_used": "Paid Time Off 2026",
        "reason": "Family vacation",
    },
    {
        "id": 3,
        "employee_id": 2,
        "employee_name": "Sara Khan",
        "time_off_type_id": 3,
        "time_off_type_name": "Sick Leave",
        "start_date": "10-Sep-2026",
        "end_date": "11-Sep-2026",
        "duration": "2 Days",
        "days_count": 2,
        "status": "Approved",
        "approver": "System Admin",
        "allocation_used": "Not Required",
        "reason": "Doctor appointment",
    },
    {
        "id": 4,
        "employee_id": 3,
        "employee_name": "Anil Patel",
        "time_off_type_id": 5,
        "time_off_type_name": "Comp Off",
        "start_date": "07-Sep-2026",
        "end_date": "07-Sep-2026",
        "duration": "1 Day",
        "days_count": 1,
        "status": "To Approve",
        "approver": "Sara Khan",
        "allocation_used": "Comp Off 2026",
        "reason": "Deployment duty comp off",
    },
]


# ─── TIME OFF TYPES ENDPOINTS ────────────────────────────────────────────────

@time_off_bp.get("/types")
def get_types():
    return jsonify(TIME_OFF_TYPES), 200


@time_off_bp.post("/types")
def create_type():
    data = request.get_json() or {}
    new_type = {
        "id": len(TIME_OFF_TYPES) + 1,
        "name": data.get("name", "New Leave Type"),
        "code": data.get("code", "NEW"),
        "unit": data.get("unit", "Days"),
        "requires_allocation": data.get("requires_allocation", "Yes"),
        "approval": data.get("approval", "Manager"),
        "payroll_work_entry": data.get("payroll_work_entry", "Leave Work Entry"),
        "display_color": data.get("display_color", "Blue"),
        "active": data.get("active", True),
        "config_notes": data.get("config_notes", ""),
    }
    TIME_OFF_TYPES.append(new_type)
    return jsonify(new_type), 201


@time_off_bp.put("/types/<int:type_id>")
def update_type(type_id):
    data = request.get_json() or {}
    for t in TIME_OFF_TYPES:
        if t["id"] == type_id:
            t.update(data)
            return jsonify(t), 200
    return jsonify({"detail": "Time off type not found"}), 404


# ─── ALLOCATIONS ENDPOINTS ──────────────────────────────────────────────────

@time_off_bp.get("/allocations")
def get_allocations():
    return jsonify(ALLOCATIONS), 200


@time_off_bp.post("/allocations")
def create_allocation():
    data = request.get_json() or {}
    allocated = int(data.get("allocated_days", 10))
    new_alloc = {
        "id": len(ALLOCATIONS) + 1,
        "employee_id": data.get("employee_id", 1),
        "employee_name": data.get("employee_name", "Nitheesh"),
        "time_off_type_id": data.get("time_off_type_id", 1),
        "time_off_type_name": data.get("time_off_type_name", "Casual Leave"),
        "allocated_days": allocated,
        "taken_days": 0,
        "remaining_days": allocated,
        "status": "To Approve",
        "approver": data.get("approver", "Team Manager - Arun"),
        "validity": data.get("validity", "2026 Annual Quota"),
        "description": data.get("description", "Annual leave quota allocation"),
    }
    ALLOCATIONS.append(new_alloc)
    return jsonify(new_alloc), 201


@time_off_bp.post("/allocations/<int:alloc_id>/approve")
def approve_allocation(alloc_id):
    for a in ALLOCATIONS:
        if a["id"] == alloc_id:
            a["status"] = "Approved"
            return jsonify(a), 200
    return jsonify({"detail": "Allocation not found"}), 404


@time_off_bp.post("/allocations/<int:alloc_id>/refuse")
def refuse_allocation(alloc_id):
    for a in ALLOCATIONS:
        if a["id"] == alloc_id:
            a["status"] = "Refused"
            return jsonify(a), 200
    return jsonify({"detail": "Allocation not found"}), 404


# ─── TIME OFF REQUESTS ENDPOINTS ─────────────────────────────────────────────

@time_off_bp.get("/requests")
def get_requests():
    return jsonify(REQUESTS), 200


@time_off_bp.post("/requests")
def create_request():
    data = request.get_json() or {}
    days = int(data.get("days_count", 1))
    type_name = data.get("time_off_type_name", "Casual Leave")
    new_req = {
        "id": len(REQUESTS) + 1,
        "employee_id": data.get("employee_id", 101),
        "employee_name": data.get("employee_name", "Nitheesh"),
        "time_off_type_id": data.get("time_off_type_id", 1),
        "time_off_type_name": type_name,
        "start_date": data.get("start_date", "10-Sep-2026"),
        "end_date": data.get("end_date", "12-Sep-2026"),
        "duration": f"{days} Day" if days == 1 else f"{days} Days",
        "days_count": days,
        "status": "To Approve",
        "approver": data.get("approver", "Team Manager - Arun"),
        "allocation_used": f"{type_name} 2026" if "Unpaid" not in type_name else "Not Required",
        "reason": data.get("reason", "Personal work"),
    }
    REQUESTS.append(new_req)
    return jsonify(new_req), 201


@time_off_bp.post("/requests/<int:req_id>/approve")
def approve_request(req_id):
    for r in REQUESTS:
        if r["id"] == req_id:
            r["status"] = "Approved"
            allocated_before = 12
            taken_before = 0
            allocated_after = 12
            taken_after = 0
            
            # Deduct from corresponding allocation if required
            for a in ALLOCATIONS:
                if (
                    a["employee_name"].lower() == r["employee_name"].lower()
                    and a["time_off_type_name"].lower() == r["time_off_type_name"].lower()
                ):
                    allocated_before = a["allocated_days"]
                    taken_before = a["taken_days"]
                    a["taken_days"] += r["days_count"]
                    a["remaining_days"] = max(0, a["allocated_days"] - a["taken_days"])
                    allocated_after = a["allocated_days"]
                    taken_after = a["taken_days"]

            # Calculate live payroll impact
            is_unpaid = "unpaid" in r["time_off_type_name"].lower() or "lop" in r["time_off_type_name"].lower()
            monthly_salary = 30000.0
            daily_rate = round(monthly_salary / 30.0, 2)
            days = r["days_count"]
            lop_deduction = round(days * daily_rate, 2) if is_unpaid else 0.0
            net_salary = round(monthly_salary - lop_deduction, 2)

            payroll_impact = {
                "employee_name": r["employee_name"],
                "leave_type": r["time_off_type_name"],
                "duration_days": days,
                "is_paid_leave": not is_unpaid,
                "monthly_salary": monthly_salary,
                "daily_rate": daily_rate,
                "lop_deduction": lop_deduction,
                "net_salary": net_salary,
                "allocation_before": {"allocated": allocated_before, "used": taken_before, "remaining": max(0, allocated_before - taken_before)},
                "allocation_after": {"allocated": allocated_after, "used": taken_after, "remaining": max(0, allocated_after - taken_after)},
                "attendance_updated": f"Marked {days} day(s) as ON_LEAVE in attendance records.",
            }

            r["payroll_impact"] = payroll_impact
            return jsonify(r), 200

    return jsonify({"detail": "Request not found"}), 404


@time_off_bp.post("/requests/<int:req_id>/refuse")
def refuse_request(req_id):
    for r in REQUESTS:
        if r["id"] == req_id:
            r["status"] = "Refused"
            return jsonify(r), 200
    return jsonify({"detail": "Request not found"}), 404


# ─── PAYROLL LOP SIMULATOR ENDPOINT ──────────────────────────────────────────

@time_off_bp.post("/simulate-payroll-lop")
def simulate_payroll_lop():
    """Calculates live Leave -> Attendance -> Payroll LOP simulation."""
    data = request.get_json() or {}
    emp_name = str(data.get("employee_name", "Nitheesh")).strip()
    monthly_salary = float(data.get("monthly_salary", 30000))
    leave_type = str(data.get("leave_type", "Casual Leave")).strip()
    leave_days = float(data.get("leave_days", 3))
    allocated_days = float(data.get("allocated_days", 12))
    used_days = float(data.get("used_days", 0))

    is_unpaid = "unpaid" in leave_type.lower() or "lop" in leave_type.lower()
    daily_rate = round(monthly_salary / 30.0, 2)
    lop_deduction = round(leave_days * daily_rate, 2) if is_unpaid else 0.0
    net_salary = round(monthly_salary - lop_deduction, 2)

    new_used = used_days + (0 if is_unpaid else leave_days)
    new_remaining = max(0.0, allocated_days - new_used)

    return jsonify({
        "employee_name": emp_name,
        "leave_type": leave_type,
        "is_paid_leave": not is_unpaid,
        "monthly_salary": monthly_salary,
        "daily_rate": daily_rate,
        "leave_days": leave_days,
        "lop_deduction": lop_deduction,
        "net_salary": net_salary,
        "balance": {
            "allocated": allocated_days,
            "used_before": used_days,
            "remaining_before": max(0.0, allocated_days - used_days),
            "used_after": new_used,
            "remaining_after": new_remaining,
        },
        "attendance": {
            "status": "ON_LEAVE",
            "working_days_in_month": 30,
            "attended_days": 30 - int(leave_days),
            "paid_leave_days": 0 if is_unpaid else int(leave_days),
            "unpaid_leave_days": int(leave_days) if is_unpaid else 0,
        },
        "explanation": (
            f"Since '{leave_type}' is a PAID leave, {int(leave_days)} day(s) consume your allocated quota without salary deduction. Net Salary is ₹{net_salary:,.2f}."
            if not is_unpaid else
            f"Since '{leave_type}' is an UNPAID leave, LOP of {int(leave_days)} × ₹{daily_rate:,.2f}/day = ₹{lop_deduction:,.2f} is deducted from Gross Salary. Net Salary is ₹{net_salary:,.2f}."
        )
    }), 200

