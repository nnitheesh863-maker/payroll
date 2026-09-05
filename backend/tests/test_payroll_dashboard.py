"""
Phase 7.4 dashboard tests — real aggregations over persisted rows.

SQLite-backed (in-memory). Verifies KPIs, department breakdown, monthly
trend, attendance/leave overviews, alerts, filtering and API structure.
"""

from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import (
    Attendance,
    Contract,
    Department,
    Employee,
    SalaryRule,
    SalaryStructure,
    TimeOffRequest,
    TimeOffType,
)
from app.services import compute_payrun, create_payrun, mark_payrun_paid
from app.services.payroll_dashboard_service import get_payroll_dashboard


@pytest.fixture()
def session():
    """Provide a clean database session backed by in-memory SQLite."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        try:
            yield db.session
        finally:
            db.session.remove()
            db.drop_all()


@pytest.fixture()
def api_client():
    """Flask test client bound to a seeded in-memory database."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        _seed_month(db.session, date(2026, 1, 1), date(2026, 1, 31), "PR-JAN")
        db.session.commit()
        with app.test_client() as testing_client:
            yield testing_client
        db.session.remove()
        db.drop_all()


def _structure(session, code="STD"):
    struct = SalaryStructure(name=f"Standard {code}", code=code, is_active=True)
    struct.rules.append(
        SalaryRule(
            name="Basic Salary",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=Decimal("5000.00"),
        )
    )
    session.add(struct)
    return struct


def _seed_month(session, start, end, ref, codes=("ENG", "HR")):
    struct = _structure(session, code=f"STD-{ref}")
    departments = {}
    employees = []
    for dept_code in codes:
        dept = Department(name=f"Dept {ref} {dept_code}", code=f"D-{ref}-{dept_code}")
        session.add(dept)
        session.flush()
        departments[dept_code] = dept
    for idx, dept_code in enumerate(codes):
        emp = Employee(
            employee_code=f"{ref}-{dept_code}",
            first_name="Test",
            last_name="User",
            email=f"{ref.lower()}-{dept_code.lower()}@example.com",
            joining_date=date(2024, 1, 1),
            department_id=departments[dept_code].id,
            bank_name="HDFC",
            bank_account_number="123",
            bank_ifsc_code="HDFC0001",
            phone="+91111",
        )
        session.add(emp)
        session.flush()
        session.add(
            Contract(
                employee=emp,
                contract_reference=f"CTR-{ref}-{dept_code}",
                contract_type="full_time",
                start_date=date(2026, 1, 1),
                status="active",
                salary=Decimal("5000.00"),
                currency="USD",
                salary_structure=struct,
            )
        )
        employees.append(emp)
    session.commit()
    payrun = create_payrun(
        session,
        name=f"Payrun {ref}",
        reference=ref,
        period_start=start,
        period_end=end,
        salary_structure_id=struct.id,
        employee_ids=[e.id for e in employees],
    )
    session.commit()
    compute_payrun(session, payrun.id)
    session.commit()
    return {"payrun": payrun, "employees": employees, "structure": struct}


def _attendance(session, employee, day, status, check_in=True):
    record = Attendance(
        employee=employee,
        attendance_date=day,
        check_in=datetime(2026, 1, day.day, 9, 0, tzinfo=timezone.utc)
        if check_in
        else None,
        check_out=datetime(2026, 1, day.day, 17, 0, tzinfo=timezone.utc)
        if check_in and status != "incomplete"
        else None,
        worked_hours=8.0 if check_in and status != "incomplete" else None,
        status=status,
    )
    session.add(record)
    return record


def _leave(session, employee, leave_type, start, end, status, days):
    request = TimeOffRequest(
        employee=employee,
        time_off_type=leave_type,
        start_date=start,
        end_date=end,
        requested_days=float(days),
        status=status,
    )
    session.add(request)
    return request


# ── Empty database ───────────────────────────────────────────────
def test_dashboard_empty_database(session):
    dashboard = get_payroll_dashboard(session)
    assert dashboard["kpis"] == {
        "total_net_paid": 0.0,
        "payslips_generated": 0,
        "average_net_salary": 0.0,
        "approved_time_off_requests": 0,
        "attendance_present": 0,
        "attendance_absent": 0,
        "attendance_incomplete": 0,
    }
    assert dashboard["department_breakdown"] == []
    assert dashboard["monthly_trend"] == []
    assert dashboard["alerts"] == []


# ── Normal dashboard ─────────────────────────────────────────────
def test_dashboard_kpis_and_breakdown(session):
    seed = _seed_month(session, date(2026, 1, 1), date(2026, 1, 31), "PR-JAN")
    # Move to paid through the lifecycle.
    from app.services import mark_payrun_paid, validate_payrun

    validate_payrun(session, seed["payrun"].id)
    mark_payrun_paid(session, seed["payrun"].id)
    session.commit()

    employees = seed["employees"]
    _attendance(session, employees[0], date(2026, 1, 5), "present")
    _attendance(session, employees[1], date(2026, 1, 5), "absent", check_in=False)
    _attendance(session, employees[0], date(2026, 1, 6), "incomplete")
    leave_type = TimeOffType(name="Annual", code="ANNUAL")
    session.add(leave_type)
    session.commit()
    _leave(session, employees[0], leave_type, date(2026, 2, 1), date(2026, 2, 2), "approved", 2)
    _leave(session, employees[1], leave_type, date(2026, 2, 3), date(2026, 2, 3), "submitted", 1)
    session.commit()

    dashboard = get_payroll_dashboard(session)

    assert dashboard["kpis"]["total_net_paid"] == 10000.0
    assert dashboard["kpis"]["payslips_generated"] == 2
    assert dashboard["kpis"]["average_net_salary"] == 5000.0
    assert dashboard["kpis"]["approved_time_off_requests"] == 1
    assert dashboard["kpis"]["attendance_present"] == 1
    assert dashboard["kpis"]["attendance_absent"] == 1
    assert dashboard["kpis"]["attendance_incomplete"] == 1

    breakdown = {
        row["department"]: row for row in dashboard["department_breakdown"]
    }
    assert set(breakdown) == {"Dept PR-JAN ENG", "Dept PR-JAN HR"}
    assert breakdown["Dept PR-JAN ENG"]["employee_count"] == 1
    assert breakdown["Dept PR-JAN ENG"]["net_salary"] == 5000.0

    assert dashboard["monthly_trend"] == [
        {
            "month": "2026-01",
            "gross": 10000.0,
            "deductions": 0.0,
            "net": 10000.0,
            "payslip_count": 2,
        }
    ]
    assert dashboard["attendance_overview"] == {
        "present": 1,
        "absent": 1,
        "incomplete": 1,
    }
    assert dashboard["leave_overview"] == {
        "approved_requests": 1,
        "approved_days": 2.0,
        "pending_requests": 1,
        "pending_days": 1.0,
    }
    # Paid payrun produces no alerts.
    assert dashboard["alerts"] == []


# ── Multiple months ──────────────────────────────────────────────
def test_dashboard_monthly_trend_multiple_months(session):
    _seed_month(session, date(2026, 1, 1), date(2026, 1, 31), "PR-JAN")
    _seed_month(session, date(2026, 2, 1), date(2026, 2, 28), "PR-FEB")

    dashboard = get_payroll_dashboard(session)
    assert [row["month"] for row in dashboard["monthly_trend"]] == [
        "2026-01",
        "2026-02",
    ]
    assert dashboard["monthly_trend"][1]["payslip_count"] == 2

    january = get_payroll_dashboard(
        session, start_date=date(2026, 1, 1), end_date=date(2026, 1, 31)
    )
    assert [row["month"] for row in january["monthly_trend"]] == ["2026-01"]

    with pytest.raises(ValueError):
        get_payroll_dashboard(
            session, start_date=date(2026, 2, 1), end_date=date(2026, 1, 1)
        )


# ── Alerts reuse validation ──────────────────────────────────────
def test_dashboard_alerts_surface_validation_issues(session):
    seed = _seed_month(session, date(2026, 1, 1), date(2026, 1, 31), "PR-JAN")
    # Corrupt a persisted total so the computed payrun fails validation.
    slip = seed["payrun"].payslips[0]
    slip.net_salary = Decimal(str(slip.net_salary)) + Decimal("7.00")
    # Strip bank details from the other employee for a warning alert.
    other = seed["employees"][1]
    other.bank_name = None
    other.bank_account_number = None
    other.bank_ifsc_code = None
    session.commit()

    dashboard = get_payroll_dashboard(session)
    codes = [a["code"] for a in dashboard["alerts"]]
    assert "TOTALS_MISMATCH" in codes
    assert "MISSING_BANK_DETAILS" in codes
    assert all(a["severity"] in ("error", "warning") for a in dashboard["alerts"])
    assert all("payrun_id" in a for a in dashboard["alerts"])


# ── API ──────────────────────────────────────────────────────────
def test_api_dashboard_structure(api_client):
    testing_client = api_client
    response = testing_client.get("/api/payroll/dashboard")
    assert response.status_code == 200
    body = response.get_json()
    assert set(body) == {
        "kpis",
        "department_breakdown",
        "monthly_trend",
        "attendance_overview",
        "leave_overview",
        "alerts",
    }
    assert body["kpis"]["payslips_generated"] == 2
    assert body["monthly_trend"][0]["month"] == "2026-01"


def test_api_dashboard_filtering(api_client):
    testing_client = api_client
    response = testing_client.get(
        "/api/payroll/dashboard",
        query_string={"start_date": "2026-02-01", "end_date": "2026-02-28"},
    )
    assert response.status_code == 200
    assert response.get_json()["monthly_trend"] == []

    bad = testing_client.get(
        "/api/payroll/dashboard", query_string={"start_date": "not-a-date"}
    )
    assert bad.status_code == 400
