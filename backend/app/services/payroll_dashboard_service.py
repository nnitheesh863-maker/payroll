"""
Payroll dashboard service — real database aggregations.

Phase 7.4 (Dashboard). Builds KPIs, department breakdowns, monthly
trends, attendance/leave overviews and alerts strictly from persisted
rows. Reuses Phase 3 attendance logic and the Phase 7.1 validation
engine instead of duplicating them. Money is aggregated with Decimal;
JSON serialization converts to float per the existing API convention.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from app.services.attendance_service import is_attendance_incomplete

MONEY_ROUNDING = ROUND_HALF_UP
TWO_PLACES = Decimal("0.01")

GENERATED_PAYSLIP_STATUSES = ("computed", "validated", "paid")


def _quantize_money(amount) -> Decimal:
    if amount is None:
        return Decimal("0.00")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(TWO_PLACES, rounding=MONEY_ROUNDING)


def _in_period(start: date, end: date, window_start, window_end) -> bool:
    if window_start is not None and end < window_start:
        return False
    if window_end is not None and start > window_end:
        return False
    return True


def _get_payruns(session):
    from app.models.payrun import Payrun

    return session.query(Payrun).all()


def _get_payslips(session):
    from app.models.payslip import Payslip

    return session.query(Payslip).all()


def get_payroll_dashboard(
    session, *, start_date: date | None = None, end_date: date | None = None
) -> dict:
    """Aggregate real payroll/HR data for dashboard consumption."""
    from app.models.attendance import Attendance
    from app.models.time_off_request import TimeOffRequest

    if start_date is not None and end_date is not None and end_date < start_date:
        raise ValueError("end_date cannot precede start_date.")

    payslips = [
        s
        for s in _get_payslips(session)
        if _in_period(s.period_start, s.period_end, start_date, end_date)
    ]
    generated = [s for s in payslips if s.status in GENERATED_PAYSLIP_STATUSES]
    paid = [s for s in payslips if s.status == "paid"]

    total_net_paid = sum((_quantize_money(s.net_salary) for s in paid), Decimal("0.00"))
    generated_net = [_quantize_money(s.net_salary) for s in generated]
    average_net = (
        (sum(generated_net, Decimal("0.00")) / len(generated_net)).quantize(
            TWO_PLACES, rounding=MONEY_ROUNDING
        )
        if generated_net
        else Decimal("0.00")
    )

    attendances = session.query(Attendance).all()
    if start_date is not None or end_date is not None:
        attendances = [
            a
            for a in attendances
            if _in_period(a.attendance_date, a.attendance_date, start_date, end_date)
        ]
    present = sum(1 for a in attendances if a.status in ("present", "corrected"))
    absent = sum(1 for a in attendances if a.status == "absent")
    incomplete = sum(1 for a in attendances if is_attendance_incomplete(a))

    leave_requests = session.query(TimeOffRequest).all()
    if start_date is not None or end_date is not None:
        leave_requests = [
            r
            for r in leave_requests
            if _in_period(r.start_date, r.end_date, start_date, end_date)
        ]
    approved = [r for r in leave_requests if r.status == "approved"]
    pending = [r for r in leave_requests if r.status in ("draft", "submitted")]

    departments: dict[str, dict] = {}
    for slip in generated:
        employee = slip.employee
        dept = getattr(employee, "department", None)
        name = dept.name if dept else "Unassigned"
        bucket = departments.setdefault(
            name, {"department": name, "employee_ids": set(), "net": Decimal("0.00")}
        )
        bucket["employee_ids"].add(str(slip.employee_id))
        bucket["net"] += _quantize_money(slip.net_salary)
    department_breakdown = [
        {
            "department": name,
            "employee_count": len(bucket["employee_ids"]),
            "net_salary": float(bucket["net"]),
        }
        for name, bucket in sorted(departments.items())
    ]

    months: dict[str, dict] = {}
    for slip in generated:
        key = slip.period_start.strftime("%Y-%m")
        bucket = months.setdefault(
            key,
            {
                "month": key,
                "gross": Decimal("0.00"),
                "deductions": Decimal("0.00"),
                "net": Decimal("0.00"),
                "payslip_count": 0,
            },
        )
        bucket["gross"] += _quantize_money(slip.gross_salary)
        bucket["deductions"] += _quantize_money(slip.total_deductions)
        bucket["net"] += _quantize_money(slip.net_salary)
        bucket["payslip_count"] += 1
    monthly_trend = [
        {
            "month": key,
            "gross": float(bucket["gross"]),
            "deductions": float(bucket["deductions"]),
            "net": float(bucket["net"]),
            "payslip_count": bucket["payslip_count"],
        }
        for key, bucket in sorted(months.items())
    ]

    alerts = _build_alerts(session)

    return {
        "kpis": {
            "total_net_paid": float(total_net_paid),
            "payslips_generated": len(generated),
            "average_net_salary": float(average_net),
            "approved_time_off_requests": len(approved),
            "attendance_present": present,
            "attendance_absent": absent,
            "attendance_incomplete": incomplete,
        },
        "department_breakdown": department_breakdown,
        "monthly_trend": monthly_trend,
        "attendance_overview": {
            "present": present,
            "absent": absent,
            "incomplete": incomplete,
        },
        "leave_overview": {
            "approved_requests": len(approved),
            "approved_days": float(
                sum((Decimal(str(r.requested_days or 0)) for r in approved), Decimal("0.00"))
            ),
            "pending_requests": len(pending),
            "pending_days": float(
                sum((Decimal(str(r.requested_days or 0)) for r in pending), Decimal("0.00"))
            ),
        },
        "alerts": alerts,
    }


def _build_alerts(session) -> list[dict]:
    """Derive alerts by reusing the Phase 7.1 validation engine."""
    from app.services.payroll_validation_service import validate_payrun_result

    alerts: list[dict] = []
    for payrun in sorted(_get_payruns(session), key=lambda p: str(p.id)):
        if payrun.status not in ("draft", "computed"):
            continue
        result = validate_payrun_result(session, payrun.id)
        for issue in (*result.errors, *result.warnings):
            alerts.append(
                {
                    "code": issue.code,
                    "severity": issue.severity,
                    "message": issue.message,
                    "payrun_id": str(payrun.id),
                    "employee_id": str(issue.employee_id)
                    if issue.employee_id
                    else None,
                }
            )
    alerts.sort(
        key=lambda a: (
            0 if a["severity"] == "error" else 1,
            a["code"],
            a["payrun_id"] or "",
            a["employee_id"] or "",
        )
    )
    return alerts
