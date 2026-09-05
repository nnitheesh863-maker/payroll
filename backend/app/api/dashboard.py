"""
Dashboard Metrics API Blueprint
Provides aggregated enterprise HR & Payroll metrics for executive, manager, and employee views.
"""

from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")

@dashboard_bp.get("/dashboard")
def get_dashboard_metrics():
    metrics = {
        "kpis": {
            "total_employees": 48,
            "active_employees": 46,
            "total_payroll_last_month": 482950,
            "today_present": 44,
            "today_on_leave": 2,
            "today_late": 1,
            "pending_leave_requests": 2,
            "pending_payruns": 1,
        },
        "salary_trends": [
            {"month": "May 2026", "gross_payroll": 460000, "net_payroll": 395000, "employee_count": 42},
            {"month": "Jun 2026", "gross_payroll": 465000, "net_payroll": 399000, "employee_count": 43},
            {"month": "Jul 2026", "gross_payroll": 472000, "net_payroll": 405000, "employee_count": 45},
            {"month": "Aug 2026", "gross_payroll": 480000, "net_payroll": 412000, "employee_count": 46},
            {"month": "Sep 2026", "gross_payroll": 482950, "net_payroll": 414540, "employee_count": 48},
        ],
        "department_distribution": [
            {"department": "Engineering", "count": 22, "total_wage": 240000},
            {"department": "Finance", "count": 8, "total_wage": 92000},
            {"department": "HR & Admin", "count": 6, "total_wage": 64000},
            {"department": "Sales & Mktg", "count": 12, "total_wage": 86950},
        ],
        "recent_activities": [
            {"id": 1, "type": "PAYROLL", "title": "September 2026 Payrun calculated", "time": "10 mins ago", "user": "Sara Khan"},
            {"id": 2, "type": "LEAVE", "title": "Leave request approved for Aarav Mehta", "time": "45 mins ago", "user": "System Admin"},
            {"id": 3, "type": "EMPLOYEE", "title": "New contract onboarded: Anil Patel", "time": "2 hours ago", "user": "Sara Khan"},
        ],
        "quick_alerts": [
            {"type": "info", "message": "September cycle auto-deductions (PF, TDS) validated 100% compliant."},
            {"type": "warning", "message": "2 employee leave requests awaiting manager sign-off."},
        ],
    }
    return jsonify(metrics), 200
