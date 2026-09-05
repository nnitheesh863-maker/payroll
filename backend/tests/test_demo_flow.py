"""
Phase 8 end-to-end demo verification — the section-14 scenario as one
automated flow: employee self-service, cross-user denial, then the full
payroll-manager lifecycle through compute → validate → paid → send → PDF.

SQLite-backed (in-memory). SMTP is mocked; no real email is sent.
"""

from datetime import date
from decimal import Decimal
from unittest import mock

import pytest

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure
from app.services import create_user


@pytest.fixture()
def demo_client():
    """Test client with two employees and manager/employee accounts."""
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    with app.app_context():
        db.create_all()
        struct = SalaryStructure(name="Standard", code="STD", is_active=True)
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
        employees = []
        for code, email in (("EMP-001", "a@example.com"), ("EMP-002", "b@example.com")):
            emp = Employee(
                employee_code=code,
                first_name="Test",
                last_name="User",
                email=email,
                joining_date=date(2024, 1, 1),
            )
            db.session.add(emp)
            db.session.flush()
            db.session.add(
                Contract(
                    employee=emp,
                    contract_reference=f"CTR-{code}",
                    contract_type="full_time",
                    start_date=date(2026, 1, 1),
                    status="active",
                    salary=Decimal("5000.00"),
                    currency="USD",
                    salary_structure=struct,
                )
            )
            employees.append(emp)
        for key, role, emp in (
            ("manager", "HR_PAYROLL_MANAGER", None),
            ("empA", "EMPLOYEE", employees[0]),
            ("empB", "EMPLOYEE", employees[1]),
        ):
            create_user(
                db.session,
                email=f"{key}@example.com",
                password="S3cure!",
                full_name=key,
                role=role,
                employee_id=emp.id if emp else None,
            )
        db.session.commit()
        ids = {
            "structure_id": str(struct.id),
            "empA_id": str(employees[0].id),
            "empB_id": str(employees[1].id),
        }
        with app.test_client() as testing_client:
            yield testing_client, ids
        db.session.remove()
        db.drop_all()


def _login(client, email):
    body = client.post(
        "/api/auth/login", json={"email": email, "password": "S3cure!"}
    ).get_json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def test_end_to_end_demo_flow(demo_client):
    client, ids = demo_client

    # 1-2. Employee logs in and receives a JWT.
    emp_a = _login(client, "empA@example.com")

    # 3. Employee accesses their own profile.
    me = client.get("/api/auth/me", headers=emp_a)
    assert me.status_code == 200
    assert me.get_json()["email"] == "empa@example.com"

    # 6. Own payslips are visible (none yet — no payrun exists).
    assert client.get("/api/payslips", headers=emp_a).get_json() == []

    # 9. Payroll manager logs in.
    mgr = _login(client, "manager@example.com")

    # 10-11. Dashboard and payroll data are reachable.
    dashboard = client.get("/api/payroll/dashboard", headers=mgr)
    assert dashboard.status_code == 200
    assert dashboard.get_json()["kpis"]["payslips_generated"] == 0
    assert client.get("/api/payruns", headers=mgr).status_code == 200

    # 12-13. Compute then validate the payrun.
    created = client.post(
        "/api/payruns",
        json={
            "name": "January",
            "reference": "PR-001",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "salary_structure_id": ids["structure_id"],
            "employee_ids": [ids["empA_id"], ids["empB_id"]],
        },
        headers=mgr,
    )
    assert created.status_code == 201
    payrun_id = created.get_json()["id"]
    assert (
        client.post(f"/api/payruns/{payrun_id}/compute", headers=mgr).status_code
        == 200
    )

    # 6 (again). Employee now sees exactly their own payslip.
    rows = client.get("/api/payslips", headers=emp_a).get_json()
    assert len(rows) == 1
    assert rows[0]["employee_id"] == ids["empA_id"]
    slip_id = rows[0]["id"]

    # 7-8. Another employee's data is denied.
    other = client.get("/api/payslips", headers=_login(client, "empB@example.com"))
    assert all(r["employee_id"] == ids["empB_id"] for r in other.get_json())
    others_slip = [
        r for r in client.get("/api/payslips", headers=mgr).get_json()
        if r["employee_id"] == ids["empB_id"]
    ][0]
    assert (
        client.get(f"/api/payslips/{others_slip['id']}", headers=emp_a).status_code
        == 403
    )

    # 13-14. Validate then mark paid.
    assert (
        client.post(f"/api/payruns/{payrun_id}/validate", headers=mgr).status_code
        == 200
    )
    assert (
        client.post(f"/api/payruns/{payrun_id}/mark-paid", headers=mgr).status_code
        == 200
    )

    # 15. Send payslips (mocked transport).
    with mock.patch("smtplib.SMTP"):
        sent = client.post(f"/api/payruns/{payrun_id}/send-payslips", headers=mgr)
    assert sent.status_code == 200
    assert sent.get_json()["sent"] == 2

    # 16. Generated payslip PDF is downloadable by the owner.
    pdf = client.get(f"/api/payslips/{slip_id}/pdf", headers=emp_a)
    assert pdf.status_code == 200
    assert pdf.content_type == "application/pdf"
    assert pdf.data.startswith(b"%PDF")
