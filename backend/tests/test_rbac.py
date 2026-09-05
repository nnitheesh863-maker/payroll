"""
Phase 8.3 RBAC tests — role matrix over representative endpoints.

SQLite-backed (in-memory). Covers all five challenge roles plus
anonymous callers: 401 vs 403 distinction, payroll restrictions and
admin-only user management.
"""

from datetime import date
from decimal import Decimal
from unittest import mock

import pytest

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure
from app.services import (
    PERMISSION_PAYROLL_COMPUTE,
    PERMISSION_PAYROLL_DASHBOARD,
    PERMISSION_PAYROLL_PAY,
    PERMISSION_PAYROLL_READ,
    PERMISSION_PAYROLL_SEND,
    PERMISSION_PAYROLL_VALIDATE,
    PERMISSION_USERS_MANAGE,
    compute_payrun,
    create_payrun,
    create_user,
    has_permission,
)


@pytest.fixture()
def rbac_client():
    """Test client with payroll data and one user per role."""
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
        for code, email in (
            ("EMP-001", "a@example.com"),
            ("EMP-002", "b@example.com"),
        ):
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
        db.session.commit()
        payrun = create_payrun(
            db.session,
            name="January",
            reference="PR-001",
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            salary_structure_id=struct.id,
            employee_ids=[e.id for e in employees],
        )
        db.session.commit()
        compute_payrun(db.session, payrun.id)
        db.session.commit()

        users = {}
        specs = [
            ("admin", "ADMIN", None),
            ("hrmanager", "HR_MANAGER", None),
            ("payuser", "HR_PAYROLL_USER", None),
            ("paymanager", "HR_PAYROLL_MANAGER", None),
            ("empA", "EMPLOYEE", employees[0].id),
            ("empB", "EMPLOYEE", employees[1].id),
        ]
        for key, role, emp_id in specs:
            user = create_user(
                db.session,
                email=f"{key}@example.com",
                password="S3cure!",
                full_name=key,
                role=role,
                employee_id=emp_id,
            )
            users[key] = user
        db.session.commit()
        ids = {
            "payrun_id": str(payrun.id),
            "empA_id": str(employees[0].id),
            "empB_id": str(employees[1].id),
        }
        with app.test_client() as testing_client:
            yield testing_client, users, ids
        db.session.remove()
        db.drop_all()


def _token(client, email):
    body = client.post(
        "/api/auth/login", json={"email": email, "password": "S3cure!"}
    ).get_json()
    return {"Authorization": f"Bearer {body['access_token']}"}


def _tokens(client):
    return {
        key: _token(client, f"{key}@example.com")
        for key in (
            "admin",
            "hrmanager",
            "payuser",
            "paymanager",
            "empA",
            "empB",
        )
    }


# ── Permission map units ─────────────────────────────────────────
def test_permission_map():
    assert has_permission("ADMIN", PERMISSION_USERS_MANAGE)
    assert has_permission("ADMIN", PERMISSION_PAYROLL_PAY)
    assert has_permission("HR_MANAGER", PERMISSION_PAYROLL_READ)
    assert has_permission("HR_MANAGER", PERMISSION_PAYROLL_DASHBOARD)
    assert not has_permission("HR_MANAGER", PERMISSION_PAYROLL_COMPUTE)
    assert not has_permission("HR_MANAGER", PERMISSION_USERS_MANAGE)
    assert has_permission("HR_PAYROLL_USER", PERMISSION_PAYROLL_COMPUTE)
    assert not has_permission("HR_PAYROLL_USER", PERMISSION_PAYROLL_VALIDATE)
    assert not has_permission("HR_PAYROLL_USER", PERMISSION_PAYROLL_PAY)
    assert not has_permission("HR_PAYROLL_USER", PERMISSION_PAYROLL_SEND)
    assert has_permission("HR_PAYROLL_MANAGER", PERMISSION_PAYROLL_VALIDATE)
    assert has_permission("HR_PAYROLL_MANAGER", PERMISSION_PAYROLL_PAY)
    assert has_permission("HR_PAYROLL_MANAGER", PERMISSION_PAYROLL_SEND)
    assert not has_permission("HR_PAYROLL_MANAGER", PERMISSION_USERS_MANAGE)
    assert not has_permission("EMPLOYEE", PERMISSION_PAYROLL_READ)
    assert not has_permission("EMPLOYEE", PERMISSION_PAYROLL_DASHBOARD)
    assert not has_permission("GHOST", PERMISSION_PAYROLL_READ)
    assert not has_permission(None, PERMISSION_PAYROLL_READ)


# ── Anonymous → 401 ──────────────────────────────────────────────
def test_anonymous_rejected(rbac_client):
    client, _, ids = rbac_client
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/payruns").status_code == 401
    assert (
        client.post(f"/api/payruns/{ids['payrun_id']}/compute").status_code
        == 401
    )
    assert client.get("/api/payroll/dashboard").status_code == 401
    assert client.get("/api/users").status_code == 401
    assert client.get("/api/payslips").status_code == 401


# ── Employee: payroll ops forbidden, own data allowed ────────────
def test_employee_payroll_restrictions(rbac_client):
    client, _, ids = rbac_client
    emp = _tokens(client)["empA"]
    payrun_id = ids["payrun_id"]

    for method, path in [
        ("get", "/api/payruns"),
        ("get", f"/api/payruns/{payrun_id}"),
        ("get", f"/api/payruns/{payrun_id}/payslips"),
        ("post", f"/api/payruns/{payrun_id}/compute"),
        ("post", f"/api/payruns/{payrun_id}/validate"),
        ("post", f"/api/payruns/{payrun_id}/mark-paid"),
        ("post", f"/api/payruns/{payrun_id}/send-payslips"),
        ("get", "/api/payroll/dashboard"),
        ("get", "/api/users"),
        ("post", "/api/payruns"),
    ]:
        response = getattr(client, method)(path, headers=emp)
        assert response.status_code == 403, (method, path)


def test_employee_own_payslips_allowed(rbac_client):
    client, _, ids = rbac_client
    emp = _tokens(client)["empA"]

    listing = client.get("/api/payslips", headers=emp)
    assert listing.status_code == 200
    rows = listing.get_json()
    assert len(rows) == 1
    assert rows[0]["employee_id"] == ids["empA_id"]

    detail = client.get(f"/api/payslips/{rows[0]['id']}", headers=emp)
    assert detail.status_code == 200


# ── HR Manager: read-only payroll ────────────────────────────────
def test_hr_manager_read_only(rbac_client):
    client, _, ids = rbac_client
    mgr = _tokens(client)["hrmanager"]
    payrun_id = ids["payrun_id"]

    assert client.get("/api/payruns", headers=mgr).status_code == 200
    assert client.get(f"/api/payruns/{payrun_id}", headers=mgr).status_code == 200
    assert client.get("/api/payroll/dashboard", headers=mgr).status_code == 200
    assert (
        client.post(f"/api/payruns/{payrun_id}/compute", headers=mgr).status_code
        == 403
    )
    assert (
        client.post(f"/api/payruns/{payrun_id}/validate", headers=mgr).status_code
        == 403
    )
    assert client.get("/api/users", headers=mgr).status_code == 403
    assert (
        client.post(
            "/api/users",
            json={
                "email": "n@example.com",
                "password": "S3cure!",
                "full_name": "N",
                "role": "EMPLOYEE",
            },
            headers=mgr,
        ).status_code
        == 403
    )


# ── HR Payroll User: compute, nothing final ──────────────────────
def test_payroll_user_compute_only(rbac_client):
    client, users, ids = rbac_client
    user = _tokens(client)["payuser"]

    created = client.post(
        "/api/payruns",
        json={
            "name": "Second",
            "reference": "PR-002",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "salary_structure_id": None,
            "employee_ids": [ids["empA_id"]],
        },
        headers=user,
    )
    # Missing structure is a 400 (permission itself passed).
    assert created.status_code == 400

    assert (
        client.post(f"/api/payruns/{ids['payrun_id']}/validate", headers=user).status_code
        == 403
    )
    assert (
        client.post(f"/api/payruns/{ids['payrun_id']}/mark-paid", headers=user).status_code
        == 403
    )
    assert (
        client.post(
            f"/api/payruns/{ids['payrun_id']}/send-payslips", headers=user
        ).status_code
        == 403
    )
    assert client.get("/api/users", headers=user).status_code == 403


# ── HR Payroll Manager: full payroll, no user admin ──────────────
def test_payroll_manager_full_payroll(rbac_client):
    client, _, ids = rbac_client
    mgr = _tokens(client)["paymanager"]
    payrun_id = ids["payrun_id"]

    assert client.get("/api/payruns", headers=mgr).status_code == 200
    assert (
        client.post(f"/api/payruns/{payrun_id}/validate", headers=mgr).status_code
        == 200
    )
    assert (
        client.post(f"/api/payruns/{payrun_id}/mark-paid", headers=mgr).status_code
        == 200
    )
    with mock.patch("smtplib.SMTP"):
        send = client.post(
            f"/api/payruns/{payrun_id}/send-payslips", headers=mgr
        )
    assert send.status_code == 200
    assert client.get("/api/users", headers=mgr).status_code == 403
    assert (
        client.post(
            "/api/users",
            json={
                "email": "n@example.com",
                "password": "S3cure!",
                "full_name": "N",
                "role": "EMPLOYEE",
            },
            headers=mgr,
        ).status_code
        == 403
    )


# ── Admin: everything including user management ──────────────────
def test_admin_full_access(rbac_client):
    client, _, ids = rbac_client
    admin = _tokens(client)["admin"]

    assert client.get("/api/payruns", headers=admin).status_code == 200
    assert client.get("/api/payroll/dashboard", headers=admin).status_code == 200
    assert client.get("/api/users", headers=admin).status_code == 200

    created = client.post(
        "/api/users",
        json={
            "email": "new@example.com",
            "password": "S3cure!",
            "full_name": "New",
            "role": "EMPLOYEE",
        },
        headers=admin,
    )
    assert created.status_code == 201
    assert "password" not in created.get_json()
    new_id = created.get_json()["id"]

    assert client.get(f"/api/users/{new_id}", headers=admin).status_code == 200
    updated = client.put(
        f"/api/users/{new_id}", json={"full_name": "Renamed"}, headers=admin
    )
    assert updated.status_code == 200
    assert updated.get_json()["full_name"] == "Renamed"

    status = client.patch(
        f"/api/users/{new_id}/status", json={"is_active": False}, headers=admin
    )
    assert status.status_code == 200
    assert status.get_json()["is_active"] is False

    deleted = client.delete(f"/api/users/{new_id}", headers=admin)
    assert deleted.status_code == 200
    assert client.get(f"/api/users/{new_id}", headers=admin).status_code == 404
