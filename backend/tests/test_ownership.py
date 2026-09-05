"""
Phase 8.4 ownership tests — IDOR and privilege-escalation coverage.

SQLite-backed (in-memory). Proves JWT identity (never client-supplied
IDs) gates private data: employees reach only their own payslips and can
never promote themselves or manage users.
"""

from datetime import date
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure
from app.services import compute_payrun, create_payrun, create_user


@pytest.fixture()
def owned_client():
    """Test client with two employees, payslips and linked users."""
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

        for key, role, emp in (
            ("empA", "EMPLOYEE", employees[0]),
            ("empB", "EMPLOYEE", employees[1]),
            ("admin", "ADMIN", None),
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
        slips = {str(s.employee_id): str(s.id) for s in payrun.payslips}
        ids = {
            "empA_id": str(employees[0].id),
            "empB_id": str(employees[1].id),
            "slipA_id": slips[str(employees[0].id)],
            "slipB_id": slips[str(employees[1].id)],
        }
        with app.test_client() as testing_client:
            yield testing_client, ids
        db.session.remove()
        db.drop_all()


def _token(client, email):
    body = client.post(
        "/api/auth/login", json={"email": email, "password": "S3cure!"}
    ).get_json()
    return {"Authorization": f"Bearer {body['access_token']}"}


# ── Payslip ownership ────────────────────────────────────────────
def test_employee_lists_only_own_payslips(owned_client):
    client, ids = owned_client
    emp_a = _token(client, "empA@example.com")

    rows = client.get("/api/payslips", headers=emp_a).get_json()
    assert len(rows) == 1
    assert rows[0]["employee_id"] == ids["empA_id"]


def test_employee_cannot_query_other_payslips(owned_client):
    client, ids = owned_client
    emp_a = _token(client, "empA@example.com")

    response = client.get(
        "/api/payslips",
        query_string={"employee_id": ids["empB_id"]},
        headers=emp_a,
    )
    assert response.status_code == 403


def test_employee_cannot_read_other_payslip(owned_client):
    client, ids = owned_client
    emp_a = _token(client, "empA@example.com")

    assert (
        client.get(f"/api/payslips/{ids['slipB_id']}", headers=emp_a).status_code
        == 403
    )
    own = client.get(f"/api/payslips/{ids['slipA_id']}", headers=emp_a)
    assert own.status_code == 200
    assert own.get_json()["employee_id"] == ids["empA_id"]


def test_employee_cannot_download_other_pdf(owned_client):
    client, ids = owned_client
    emp_a = _token(client, "empA@example.com")

    assert (
        client.get(f"/api/payslips/{ids['slipB_id']}/pdf", headers=emp_a).status_code
        == 403
    )
    own = client.get(f"/api/payslips/{ids['slipA_id']}/pdf", headers=emp_a)
    assert own.status_code == 200
    assert own.content_type == "application/pdf"


def test_unlinked_user_cannot_list_payslips(owned_client):
    client, _ = owned_client
    from app.services import create_user as _create

    with client.application.app_context():
        _create(
            db.session,
            email="lonely@example.com",
            password="S3cure!",
            full_name="Lonely",
            role="EMPLOYEE",
        )
        db.session.commit()
    lonely = _token(client, "lonely@example.com")
    assert client.get("/api/payslips", headers=lonely).status_code == 403


# ── Identity comes from JWT ──────────────────────────────────────
def test_me_reflects_caller_not_parameter(owned_client):
    client, _ = owned_client
    me_a = client.get(
        "/api/auth/me", headers=_token(client, "empA@example.com")
    ).get_json()
    me_b = client.get(
        "/api/auth/me", headers=_token(client, "empB@example.com")
    ).get_json()
    assert me_a["email"] == "empa@example.com"
    assert me_b["email"] == "empb@example.com"
    assert me_a["id"] != me_b["id"]


# ── Privilege escalation ─────────────────────────────────────────
def test_employee_cannot_manage_users(owned_client):
    client, ids = owned_client
    emp_a = _token(client, "empA@example.com")

    assert client.get("/api/users", headers=emp_a).status_code == 403
    assert (
        client.post(
            "/api/users",
            json={
                "email": "x@example.com",
                "password": "S3cure!",
                "full_name": "X",
                "role": "EMPLOYEE",
            },
            headers=emp_a,
        ).status_code
        == 403
    )


def test_employee_cannot_promote_self_via_update(owned_client):
    client, ids = owned_client
    from app.models import User

    with client.application.app_context():
        own_id = str(
            User.query.filter_by(email="empa@example.com").first().id
        )
    emp_a = _token(client, "empA@example.com")
    response = client.put(
        f"/api/users/{own_id}", json={"role": "ADMIN"}, headers=emp_a
    )
    # Not an admin at all — the whole user API is off-limits.
    assert response.status_code == 403

    with client.application.app_context():
        assert (
            User.query.filter_by(email="empa@example.com").first().role
            == "EMPLOYEE"
        )


def test_register_ignores_client_supplied_role(owned_client):
    client, _ = owned_client
    response = client.post(
        "/api/auth/register",
        json={
            "email": "sneaky@example.com",
            "password": "S3cure!",
            "full_name": "Sneaky",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 201
    assert response.get_json()["user"]["role"] == "EMPLOYEE"

    # The new account cannot reach admin APIs.
    token = _token(client, "sneaky@example.com")
    assert client.get("/api/users", headers=token).status_code == 403


def test_hr_user_cannot_do_admin_actions(owned_client):
    client, _ = owned_client
    from app.services import create_user as _create

    with client.application.app_context():
        _create(
            db.session,
            email="payuser@example.com",
            password="S3cure!",
            full_name="Pay User",
            role="HR_PAYROLL_USER",
        )
        db.session.commit()
    pay_user = _token(client, "payuser@example.com")
    assert (
        client.delete(
            f"/api/users/00000000-0000-0000-0000-000000000000",
            headers=pay_user,
        ).status_code
        == 403
    )
