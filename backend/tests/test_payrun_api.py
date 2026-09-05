"""
Phase 6 Payrun/Payslip API tests — DB-backed routes in app/api/payroll.py.

Uses the Flask test client with in-memory SQLite. Verifies route paths,
methods, status codes, response shapes and domain-error mapping.
"""

from datetime import date
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure


@pytest.fixture()
def client():
    """Flask test client with seeded structure, employee and contract."""
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
        struct.rules.append(
            SalaryRule(
                name="Income Tax",
                code="TAX",
                category="deduction",
                calculation_method="percentage",
                sequence=20,
                percentage=10.0,
                formula="BASIC",
            )
        )
        emp = Employee(
            employee_code="EMP-001",
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            joining_date=date(2024, 1, 1),
        )
        db.session.add_all([struct, emp])
        db.session.flush()
        contract = Contract(
            employee=emp,
            contract_reference="CTR-EMP-001",
            contract_type="full_time",
            start_date=date(2026, 1, 1),
            status="active",
            salary=Decimal("5000.00"),
            currency="USD",
            salary_structure=struct,
        )
        db.session.add(contract)
        db.session.commit()
        ids = {
            "structure_id": str(struct.id),
            "employee_id": str(emp.id),
        }
        with app.test_client() as testing_client:
            yield testing_client, ids
        db.session.remove()
        db.drop_all()


def _create_payload(ids, **overrides):
    payload = {
        "name": "January 2026",
        "reference": "PR-2026-01",
        "period_start": "2026-01-01",
        "period_end": "2026-01-31",
        "salary_structure_id": ids["structure_id"],
        "employee_ids": [ids["employee_id"]],
    }
    payload.update(overrides)
    return payload


def _create_payrun(client, ids, **overrides):
    return client.post("/api/payruns", json=_create_payload(ids, **overrides))


# ── CREATE ───────────────────────────────────────────────────────
def test_api_create_payrun(client):
    testing_client, ids = client
    response = _create_payrun(testing_client, ids)

    assert response.status_code == 201
    body = response.get_json()
    assert body["reference"] == "PR-2026-01"
    assert body["batch_number"] == "PR-2026-01"
    assert body["status"] == "DRAFT"
    assert body["employee_count"] == 1
    assert body["employee_ids"] == [ids["employee_id"]]


def test_api_create_payrun_invalid_period(client):
    testing_client, ids = client
    response = _create_payrun(
        testing_client,
        ids,
        period_start="2026-01-31",
        period_end="2026-01-01",
    )
    assert response.status_code == 400
    assert "detail" in response.get_json()


def test_api_create_payrun_missing_structure(client):
    testing_client, ids = client
    response = _create_payrun(
        testing_client, ids, salary_structure_id="00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 400


def test_api_create_payrun_invalid_employee(client):
    testing_client, ids = client
    response = _create_payrun(
        testing_client, ids, employee_ids=["not-a-uuid"]
    )
    assert response.status_code == 400


def test_api_create_payrun_duplicate_reference(client):
    testing_client, ids = client
    assert _create_payrun(testing_client, ids).status_code == 201
    response = _create_payrun(testing_client, ids)
    assert response.status_code == 400


# ── READ ─────────────────────────────────────────────────────────
def test_api_get_payrun_and_list(client):
    testing_client, ids = client
    created = _create_payrun(testing_client, ids).get_json()

    fetched = testing_client.get(f"/api/payruns/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.get_json()["id"] == created["id"]

    assert testing_client.get("/api/payruns/00000000-0000-0000-0000-000000000000").status_code == 404
    assert testing_client.get("/api/payruns/nope").status_code == 404

    listing = testing_client.get("/api/payruns")
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    filtered = testing_client.get("/api/payruns", query_string={"status": "DRAFT"})
    assert len(filtered.get_json()) == 1
    filtered_none = testing_client.get("/api/payruns", query_string={"status": "PAID"})
    assert filtered_none.get_json() == []


# ── COMPUTE → VALIDATE → PAID ────────────────────────────────────
def test_api_lifecycle_flow(client):
    testing_client, ids = client
    created = _create_payrun(testing_client, ids).get_json()
    payrun_id = created["id"]

    # Draft cannot be validated.
    invalid = testing_client.post(f"/api/payruns/{payrun_id}/validate")
    assert invalid.status_code == 409

    computed = testing_client.post(f"/api/payruns/{payrun_id}/compute")
    assert computed.status_code == 200
    body = computed.get_json()
    assert body["status"] == "COMPUTED"
    assert body["total_gross"] == 5000.0
    assert body["total_deductions"] == 500.0
    assert body["total_net"] == 4500.0

    slips = testing_client.get(f"/api/payruns/{payrun_id}/payslips")
    assert slips.status_code == 200
    rows = slips.get_json()
    assert len(rows) == 1
    assert rows[0]["employee_name"] == "Alice Smith"
    assert rows[0]["employee_code"] == "EMP-001"
    assert rows[0]["gross_salary"] == 5000.0
    assert rows[0]["net_salary"] == 4500.0
    assert rows[0]["status"] == "COMPUTED"

    validated = testing_client.post(f"/api/payruns/{payrun_id}/validate")
    assert validated.status_code == 200
    assert validated.get_json()["status"] == "VALIDATED"

    recompute = testing_client.post(f"/api/payruns/{payrun_id}/compute")
    assert recompute.status_code == 409

    paid = testing_client.post(f"/api/payruns/{payrun_id}/mark-paid")
    assert paid.status_code == 200
    assert paid.get_json()["status"] == "PAID"


def test_api_compute_unknown_payrun(client):
    testing_client, _ = client
    response = testing_client.post(
        "/api/payruns/00000000-0000-0000-0000-000000000000/compute"
    )
    assert response.status_code == 404
    assert response.get_json() == {"detail": "Payrun not found"}


def test_api_mark_paid_invalid_state(client):
    testing_client, ids = client
    created = _create_payrun(testing_client, ids).get_json()
    response = testing_client.post(f"/api/payruns/{created['id']}/mark-paid")
    assert response.status_code == 409


# ── SCOPE MANAGEMENT ─────────────────────────────────────────────
def test_api_add_remove_employee(client):
    testing_client, ids = client
    created = _create_payrun(
        testing_client, ids, reference="PR-SCOPE", employee_ids=[]
    ).get_json()
    payrun_id = created["id"]
    assert created["employee_count"] == 0

    # Empty scope cannot compute.
    assert testing_client.post(f"/api/payruns/{payrun_id}/compute").status_code == 400

    added = testing_client.post(
        f"/api/payruns/{payrun_id}/employees",
        json={"employee_id": ids["employee_id"]},
    )
    assert added.status_code == 201

    duplicate = testing_client.post(
        f"/api/payruns/{payrun_id}/employees",
        json={"employee_id": ids["employee_id"]},
    )
    assert duplicate.status_code == 400

    removed = testing_client.delete(
        f"/api/payruns/{payrun_id}/employees/{ids['employee_id']}"
    )
    assert removed.status_code == 200
    missing = testing_client.delete(
        f"/api/payruns/{payrun_id}/employees/{ids['employee_id']}"
    )
    assert missing.status_code == 404


# ── PAYSLIPS ─────────────────────────────────────────────────────
def test_api_payslip_list_and_detail(client):
    testing_client, ids = client
    created = _create_payrun(testing_client, ids).get_json()
    testing_client.post(f"/api/payruns/{created['id']}/compute")

    listing = testing_client.get("/api/payslips")
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    filtered = testing_client.get(
        "/api/payslips", query_string={"payrun_id": created["id"]}
    )
    assert len(filtered.get_json()) == 1
    filtered_none = testing_client.get(
        "/api/payslips", query_string={"employee_id": created["id"]}
    )
    assert filtered_none.get_json() == []
    assert (
        testing_client.get("/api/payslips", query_string={"payrun_id": "junk"}).status_code
        == 400
    )

    slip_id = listing.get_json()[0]["id"]
    detail = testing_client.get(f"/api/payslips/{slip_id}")
    assert detail.status_code == 200
    body = detail.get_json()
    assert body["net_salary"] == 4500.0
    assert [line["rule_code"] for line in body["lines"]] == ["BASIC", "TAX"]
    assert [line["sequence"] for line in body["lines"]] == [10, 20]

    assert testing_client.get("/api/payslips/00000000-0000-0000-0000-000000000000").status_code == 404


# ── SEND (Phase 7.3 — explicit 501) ──────────────────────────────
def test_api_send_payslips_not_implemented(client):
    testing_client, ids = client
    created = _create_payrun(testing_client, ids).get_json()
    response = testing_client.post(f"/api/payruns/{created['id']}/send-payslips")
    assert response.status_code == 501
    assert (
        testing_client.post(
            "/api/payruns/00000000-0000-0000-0000-000000000000/send-payslips"
        ).status_code
        == 404
    )
