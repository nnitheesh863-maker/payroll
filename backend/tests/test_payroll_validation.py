"""
Phase 7.1 payroll validation tests — service checks, severity behavior,
lifecycle gating and API integration.

SQLite-backed (in-memory); no PostgreSQL required.
"""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import (
    Contract,
    Department,
    Employee,
    Payslip,
    SalaryRule,
    SalaryStructure,
)
from app.services import (
    PayrunValidationError,
    compute_payrun,
    create_payrun,
)
from app.services.payroll_validation_service import validate_payrun_result
from tests.helpers import AuthedClient, login_token, seed_admin


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
        seed = _seed_basic(db.session, full_employee=False)
        db.session.commit()
        seed_admin(db.session)
        ids = {k: str(v) for k, v in seed["ids"].items()}
        with app.test_client() as raw:
            yield AuthedClient(raw, login_token(raw)), ids
        db.session.remove()
        db.drop_all()


def _structure(session, name="Standard", code="STD"):
    struct = SalaryStructure(name=name, code=code, is_active=True)
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
    session.add(struct)
    return struct


def _employee(session, code="EMP-001", email="alice@example.com", full=False):
    params = {
        "employee_code": code,
        "first_name": "Alice",
        "last_name": "Smith",
        "email": email,
        "joining_date": date(2024, 1, 1),
    }
    if full:
        dept = Department(name="Engineering", code="ENG")
        session.add(dept)
        session.flush()
        params.update(
            {
                "phone": "+911234567890",
                "department_id": dept.id,
                "job_title": "Engineer",
                "bank_name": "HDFC",
                "bank_account_number": "1234567890",
                "bank_ifsc_code": "HDFC0001234",
            }
        )
    emp = Employee(**params)
    session.add(emp)
    return emp


def _contract(session, employee, structure, salary=5000.0, ref="CTR-001"):
    contract = Contract(
        employee=employee,
        contract_reference=ref,
        contract_type="full_time",
        start_date=date(2026, 1, 1),
        status="active",
        salary=Decimal(str(salary)),
        currency="USD",
        salary_structure=structure,
    )
    session.add(contract)
    return contract


def _seed_basic(session, full_employee=False):
    struct = _structure(session)
    emp = _employee(session, full=full_employee)
    contract = _contract(session, emp, struct)
    session.flush()
    return {
        "structure": struct,
        "employee": emp,
        "contract": contract,
        "ids": {"structure_id": struct.id, "employee_id": emp.id},
    }


def _computed_payrun(session, seed, reference="PR-001"):
    payrun = create_payrun(
        session,
        name="January",
        reference=reference,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=seed["structure"].id,
        employee_ids=[seed["employee"].id],
    )
    session.commit()
    compute_payrun(session, payrun.id)
    session.commit()
    return payrun


def _codes(result):
    return [e.code for e in result.errors]


# ── 1. Valid payrun ──────────────────────────────────────────────
def test_valid_payrun(session):
    seed = _seed_basic(session, full_employee=True)
    session.commit()
    payrun = _computed_payrun(session, seed)

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is True
    assert result.errors == []
    assert result.summary == {"error_count": 0, "warning_count": 0}
    assert result.to_dict()["valid"] is True


# ── 2. Payrun not found ──────────────────────────────────────────
def test_payrun_not_found(session):
    with pytest.raises(PayrunValidationError):
        validate_payrun_result(
            session, "00000000-0000-0000-0000-000000000000"
        )


# ── 3. Empty payrun ──────────────────────────────────────────────
def test_empty_payrun_rejected(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = create_payrun(
        session,
        name="Empty",
        reference="PR-EMPTY",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=seed["structure"].id,
        employee_ids=[],
    )
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "EMPTY_PAYRUN" in _codes(result)


# ── 4. Missing applicable contract ───────────────────────────────
def test_missing_contract_detected(session):
    seed = _seed_basic(session)
    session.commit()
    # Draft scope + hand-built slip: compute would (correctly) refuse,
    # but validation must still identify the missing contract.
    payrun = create_payrun(
        session,
        name="NoContract",
        reference="PR-NOCONTRACT",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=seed["structure"].id,
        employee_ids=[],
    )
    session.commit()
    session.delete(seed["contract"])
    session.commit()

    from app.models.payrun_employee import PayrunEmployee

    session.add(PayrunEmployee(payrun=payrun, employee=seed["employee"]))
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "MISSING_CONTRACT" in _codes(result)


# ── 5. Overlapping contracts ─────────────────────────────────────
def test_overlapping_contracts_detected(session):
    seed = _seed_basic(session)
    overlap = _contract(
        session, seed["employee"], seed["structure"], ref="CTR-OVERLAP"
    )
    session.commit()

    payrun = create_payrun(
        session,
        name="Overlap",
        reference="PR-OVERLAP",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=seed["structure"].id,
        employee_ids=[seed["employee"].id],
    )
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "OVERLAPPING_CONTRACTS" in _codes(result)


# ── 6/7. Incomplete employee data + bank warning ─────────────────
def test_incomplete_employee_and_bank_warning(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is True  # warnings do not block
    warning_codes = [w.code for w in result.warnings]
    assert "MISSING_BANK_DETAILS" in warning_codes
    assert "MISSING_OPTIONAL_INFO" in warning_codes
    assert all(w.severity == "warning" for w in result.warnings)
    assert all(w.employee_id == seed["employee"].id for w in result.warnings)


# ── 8. Missing payslip after computation ─────────────────────────
def test_missing_payslip_detected(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)

    slip = payrun.payslips[0]
    for line in list(slip.lines):
        session.delete(line)
    session.delete(slip)
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "MISSING_PAYSLIP" in _codes(result)


# ── 9. Duplicate payslip condition ───────────────────────────────
def test_duplicate_payslip_prevented(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)
    existing = payrun.payslips[0]

    duplicate = Payslip(
        payrun=payrun,
        employee=seed["employee"],
        contract=seed["contract"],
        salary_structure=seed["structure"],
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
    )
    session.add(duplicate)
    with pytest.raises(IntegrityError):
        session.flush()
    session.rollback()
    assert existing.id is not None


# ── 10a. Missing payslip lines ───────────────────────────────────
def test_missing_payslip_lines(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)

    for line in list(payrun.payslips[0].lines):
        session.delete(line)
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "MISSING_PAYSLIP_LINES" in _codes(result)


# ── 10b. Inconsistent totals ─────────────────────────────────────
def test_inconsistent_totals_detected(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)

    slip = payrun.payslips[0]
    before = (slip.gross_salary, slip.net_salary)
    slip.net_salary = Decimal(str(slip.net_salary)) + Decimal("1.00")
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    assert "TOTALS_MISMATCH" in _codes(result)
    assert (slip.gross_salary, slip.net_salary) != before


# ── 10c. Period / structure mismatch ─────────────────────────────
def test_period_and_structure_mismatch(session):
    seed = _seed_basic(session)
    other = SalaryStructure(name="Other", code="OTHER", is_active=True)
    session.add(other)
    session.commit()
    payrun = _computed_payrun(session, seed)

    slip = payrun.payslips[0]
    slip.period_end = date(2026, 2, 28)
    slip.salary_structure_id = other.id
    session.commit()

    result = validate_payrun_result(session, payrun.id)
    assert result.valid is False
    codes = _codes(result)
    assert "PERIOD_MISMATCH" in codes
    assert "STRUCTURE_MISMATCH" in codes


# ── 11/12. Severity: errors block, warnings don't ───────────────
def test_blocking_errors_prevent_api_validation(api_client):
    testing_client, ids = api_client
    created = testing_client.post(
        "/api/payruns",
        json={
            "name": "Broken",
            "reference": "PR-BROKEN",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "salary_structure_id": ids["structure_id"],
            "employee_ids": [ids["employee_id"]],
        },
    ).get_json()
    payrun_id = created["id"]
    testing_client.post(f"/api/payruns/{payrun_id}/compute")

    # Corrupt a persisted total directly in the database.
    from app.models.payslip import Payslip

    with testing_client.application.app_context():
        slip = Payslip.query.first()
        slip.net_salary = Decimal(str(slip.net_salary)) + Decimal("5.00")
        db.session.commit()

    response = testing_client.post(f"/api/payruns/{payrun_id}/validate")
    assert response.status_code == 422
    body = response.get_json()
    assert body["validation"]["valid"] is False
    assert body["validation"]["summary"]["error_count"] >= 1
    assert any(
        e["code"] == "TOTALS_MISMATCH" for e in body["validation"]["errors"]
    )

    current = testing_client.get(f"/api/payruns/{payrun_id}").get_json()
    assert current["status"] == "COMPUTED"


def test_warnings_do_not_block_api_validation(api_client):
    testing_client, ids = api_client
    created = testing_client.post(
        "/api/payruns",
        json={
            "name": "Warned",
            "reference": "PR-WARNED",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "salary_structure_id": ids["structure_id"],
            "employee_ids": [ids["employee_id"]],
        },
    ).get_json()
    testing_client.post(f"/api/payruns/{created['id']}/compute")

    response = testing_client.post(f"/api/payruns/{created['id']}/validate")
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "VALIDATED"
    assert body["validation"]["valid"] is True
    assert body["validation"]["summary"]["warning_count"] >= 1
    assert all(
        w["severity"] == "warning" for w in body["validation"]["warnings"]
    )


# ── 15. Validation does not alter amounts ────────────────────────
def test_validation_does_not_alter_amounts(session):
    seed = _seed_basic(session)
    session.commit()
    payrun = _computed_payrun(session, seed)
    slip = payrun.payslips[0]
    snapshot = (
        slip.basic_salary,
        slip.total_earnings,
        slip.total_allowances,
        slip.gross_salary,
        slip.total_deductions,
        slip.total_contributions,
        slip.net_salary,
        len(slip.lines),
    )

    validate_payrun_result(session, payrun.id)

    assert (
        slip.basic_salary,
        slip.total_earnings,
        slip.total_allowances,
        slip.gross_salary,
        slip.total_deductions,
        slip.total_contributions,
        slip.net_salary,
        len(slip.lines),
    ) == snapshot


# ── 16/17. API 404 + invalid lifecycle ───────────────────────────
def test_api_validate_unknown_payrun(api_client):
    testing_client, _ = api_client
    response = testing_client.post(
        "/api/payruns/00000000-0000-0000-0000-000000000000/validate"
    )
    assert response.status_code == 404


def test_api_validate_invalid_lifecycle(api_client):
    testing_client, ids = api_client
    created = testing_client.post(
        "/api/payruns",
        json={
            "name": "Draft",
            "reference": "PR-DRAFTLC",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "salary_structure_id": ids["structure_id"],
            "employee_ids": [ids["employee_id"]],
        },
    ).get_json()
    response = testing_client.post(f"/api/payruns/{created['id']}/validate")
    assert response.status_code == 409
