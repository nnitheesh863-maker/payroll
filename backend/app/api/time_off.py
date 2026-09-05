"""
Time Off & Leave Management API Blueprint
Implements Flow 3 of the Odoo Hackathon Wireframe:
- Time Off Types (List & Form View with Allocation, Unit, Approval rules)
- Allocations (List & Form View with Allocated, Taken, Remaining days & Approval flow)
- Time Off Requests (List & Form View with Approve, Refuse, and automatic balance deduction)
"""

from flask import Blueprint, request, jsonify

time_off_bp = Blueprint("time_off", __name__, url_prefix="/api/time-off")

# In-memory mock database pre-seeded with Wireframe data
TIME_OFF_TYPES = [
    {
        "id": 1,
        "name": "Paid Time Off",
        "code": "PTO",
        "unit": "Days",
        "requires_allocation": "Yes",
        "approval": "Manager",
        "payroll_work_entry": "Leave Work Entry",
        "display_color": "Blue",
        "active": True,
        "config_notes": "Standard annual leave. Balance comes from approved allocations.",
    },
    {
        "id": 2,
        "name": "Sick Leave",
        "code": "SICK",
        "unit": "Days",
        "requires_allocation": "No",
        "approval": "Manager",
        "payroll_work_entry": "Sick Leave Entry",
        "display_color": "Red",
        "active": True,
        "config_notes": "Statutory health leave. No prior allocation required.",
    },
    {
        "id": 3,
        "name": "Comp Off",
        "code": "COMP",
        "unit": "Hours",
        "requires_allocation": "No",
        "approval": "Officer",
        "payroll_work_entry": "Compensatory Entry",
        "display_color": "Amber",
        "active": True,
        "config_notes": "Granted for weekend or overtime shifts.",
    },
]

ALLOCATIONS = [
    {
        "id": 1,
        "employee_id": 1,
        "employee_name": "Aarav Mehta",
        "time_off_type_id": 1,
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
        "id": 2,
        "employee_id": 2,
        "employee_name": "Sara Khan",
        "time_off_type_id": 1,
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
        "id": 3,
        "employee_id": 3,
        "employee_name": "Anil Patel",
        "time_off_type_id": 3,
        "time_off_type_name": "Comp Off",
        "allocated_days": 2,
        "taken_days": 1,
        "remaining_days": 1,
        "status": "To Approve",
        "approver": "Sara Khan",
        "validity": "Q3 2026 Overtime",
        "description": "Compensation for deployment weekend.",
    },
]

REQUESTS = [
    {
        "id": 1,
        "employee_id": 1,
        "employee_name": "Aarav Mehta",
        "time_off_type_id": 1,
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
        "id": 2,
        "employee_id": 2,
        "employee_name": "Sara Khan",
        "time_off_type_id": 2,
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
        "id": 3,
        "employee_id": 3,
        "employee_name": "Anil Patel",
        "time_off_type_id": 3,
        "time_off_type_name": "Comp Off",
        "start_date": "07-Sep-2026",
        "end_date": "07-Sep-2026",
        "duration": "1 Day",
        "days_count": 1,
        "status": "To Approve",
        "approver": "Sara Khan",
        "allocation_used": "Comp Off 2026",
        "reason": "Personal work",
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
        "employee_name": data.get("employee_name", "Aarav Mehta"),
        "time_off_type_id": data.get("time_off_type_id", 1),
        "time_off_type_name": data.get("time_off_type_name", "Paid Time Off"),
        "allocated_days": allocated,
        "taken_days": 0,
        "remaining_days": allocated,
        "status": "To Approve",
        "approver": data.get("approver", "Sara Khan"),
        "validity": data.get("validity", "2026 Annual Balance"),
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
    new_req = {
        "id": len(REQUESTS) + 1,
        "employee_id": data.get("employee_id", 1),
        "employee_name": data.get("employee_name", "Aarav Mehta"),
        "time_off_type_id": data.get("time_off_type_id", 1),
        "time_off_type_name": data.get("time_off_type_name", "Paid Time Off"),
        "start_date": data.get("start_date", "15-Sep-2026"),
        "end_date": data.get("end_date", "16-Sep-2026"),
        "duration": f"{days} Day" if days == 1 else f"{days} Days",
        "days_count": days,
        "status": "To Approve",
        "approver": data.get("approver", "Sara Khan"),
        "allocation_used": data.get("allocation_used", "Paid Time Off 2026"),
        "reason": data.get("reason", "Personal request"),
    }
    REQUESTS.append(new_req)
    return jsonify(new_req), 201


@time_off_bp.post("/requests/<int:req_id>/approve")
def approve_request(req_id):
    for r in REQUESTS:
        if r["id"] == req_id:
            r["status"] = "Approved"
            # Deduct from corresponding allocation if required
            for a in ALLOCATIONS:
                if (
                    a["employee_name"] == r["employee_name"]
                    and a["time_off_type_name"] == r["time_off_type_name"]
                ):
                    a["taken_days"] += r["days_count"]
                    a["remaining_days"] = max(0, a["allocated_days"] - a["taken_days"])
            return jsonify(r), 200
    return jsonify({"detail": "Request not found"}), 404


@time_off_bp.post("/requests/<int:req_id>/refuse")
def refuse_request(req_id):
    for r in REQUESTS:
        if r["id"] == req_id:
            r["status"] = "Refused"
            return jsonify(r), 200
    return jsonify({"detail": "Request not found"}), 404
