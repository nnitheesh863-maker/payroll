"""
Phase 7.3 bulk email tests — service behavior with mocked SMTP transport.

SQLite-backed (in-memory). No real email is ever sent: every test patches
``smtplib.SMTP``.
"""

from datetime import date
from decimal import Decimal
from unittest import mock

import pytest

from app import create_app
from app.config import settings
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure
from app.services import PayrunValidationError, compute_payrun, create_payrun
from app.services.email_service import (
    build_payslip_message,
    send_payslips_for_payrun,
)


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
        seed = _seed(db.session)
        db.session.commit()
        with app.test_client() as testing_client:
            yield testing_client, str(seed["payrun"].id)
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
    session.add(struct)
    return struct


def _employee(session, code, email):
    emp = Employee(
        employee_code=code,
        first_name="Test",
        last_name="User",
        email=email,
        joining_date=date(2024, 1, 1),
    )
    session.add(emp)
    return emp


def _seed(session):
    struct = _structure(session)
    emp1 = _employee(session, "EMP-001", "one@example.com")
    emp2 = _employee(session, "EMP-002", "two@example.com")
    session.flush()
    for emp in (emp1, emp2):
        session.add(
            Contract(
                employee=emp,
                contract_reference=f"CTR-{emp.employee_code}",
                contract_type="full_time",
                start_date=date(2026, 1, 1),
                status="active",
                salary=Decimal("5000.00"),
                currency="USD",
                salary_structure=struct,
            )
        )
    session.commit()
    payrun = create_payrun(
        session,
        name="January",
        reference="PR-001",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp1.id, emp2.id],
    )
    session.commit()
    compute_payrun(session, payrun.id)
    session.commit()
    return {"payrun": payrun, "employees": [emp1, emp2]}


def _smtp_mock():
    smtp_cls = mock.patch("smtplib.SMTP").start()
    connection = smtp_cls.return_value.__enter__.return_value
    return smtp_cls, connection


# ── Message composition ──────────────────────────────────────────
def test_build_message_uses_config_sender_and_attachment():
    message = build_payslip_message(
        recipient="one@example.com",
        employee_name="Test User",
        payrun_reference="PR-001",
        period_label="2026-01-01 to 2026-01-31",
        pdf_bytes=b"%PDF-fake",
        filename="payslip_EMP-001_2026-01.pdf",
    )
    assert message["From"] == settings.MAIL_DEFAULT_SENDER
    assert message["To"] == "one@example.com"
    assert "PR-001" in message["Subject"]
    attachments = list(message.iter_attachments())
    assert len(attachments) == 1
    assert attachments[0].get_filename() == "payslip_EMP-001_2026-01.pdf"
    assert attachments[0].get_content_type() == "application/pdf"


def test_mail_credentials_not_committed():
    assert settings.MAIL_PASSWORD == ""
    assert settings.MAIL_USERNAME == ""


# ── Bulk sending ─────────────────────────────────────────────────
def test_bulk_send_success(session):
    seed = _seed(session)
    smtp_cls, connection = _smtp_mock()
    try:
        result = send_payslips_for_payrun(session, seed["payrun"].id)
    finally:
        mock.patch.stopall()

    assert result["total"] == 2
    assert result["sent"] == 2
    assert result["failed"] == 0
    assert result["skipped"] == 0
    assert smtp_cls.call_count == 2
    recipients = [
        call.args[0]["To"] for call in connection.send_message.call_args_list
    ]
    assert sorted(recipients) == ["one@example.com", "two@example.com"]
    for entry in result["results"]:
        assert entry["status"] == "sent"
        assert entry["error"] is None


def test_missing_email_skipped(session):
    seed = _seed(session)
    seed["employees"][0].email = ""
    session.commit()

    with mock.patch("smtplib.SMTP") as smtp_cls:
        result = send_payslips_for_payrun(session, seed["payrun"].id)

    assert result["sent"] == 1
    assert result["skipped"] == 1
    assert smtp_cls.call_count == 1
    skipped = [r for r in result["results"] if r["status"] == "skipped"]
    assert len(skipped) == 1
    assert skipped[0]["error"] is not None


def test_one_failure_does_not_stop_others(session):
    seed = _seed(session)
    smtp_cls, connection = _smtp_mock()
    connection.send_message.side_effect = [None, RuntimeError("boom")]
    try:
        result = send_payslips_for_payrun(session, seed["payrun"].id)
    finally:
        mock.patch.stopall()

    assert result["sent"] == 1
    assert result["failed"] == 1
    failed = [r for r in result["results"] if r["status"] == "failed"]
    assert len(failed) == 1
    assert "boom" in failed[0]["error"]
    assert len(result["results"]) == 2


def test_missing_payrun(session):
    with pytest.raises(PayrunValidationError):
        send_payslips_for_payrun(
            session, "00000000-0000-0000-0000-000000000000"
        )


def test_no_generated_payslips(session):
    struct = _structure(session)
    emp = _employee(session, "EMP-001", "one@example.com")
    session.commit()
    payrun = create_payrun(
        session,
        name="Draft",
        reference="PR-DRAFT",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()

    with mock.patch("smtplib.SMTP") as smtp_cls:
        result = send_payslips_for_payrun(session, payrun.id)

    assert result == {
        "payrun_id": str(payrun.id),
        "payrun_reference": "PR-DRAFT",
        "total": 0,
        "sent": 0,
        "failed": 0,
        "skipped": 0,
        "results": [],
    }
    smtp_cls.assert_not_called()


def test_bulk_send_does_not_alter_amounts(session):
    seed = _seed(session)
    before = [
        (s.gross_salary, s.net_salary, len(s.lines))
        for s in seed["payrun"].payslips
    ]
    with mock.patch("smtplib.SMTP"):
        send_payslips_for_payrun(session, seed["payrun"].id)
    after = [
        (s.gross_salary, s.net_salary, len(s.lines))
        for s in seed["payrun"].payslips
    ]
    assert before == after


# ── API ──────────────────────────────────────────────────────────
def test_api_send_payslips(api_client):
    testing_client, payrun_id = api_client
    with mock.patch("smtplib.SMTP"):
        response = testing_client.post(f"/api/payruns/{payrun_id}/send-payslips")

    assert response.status_code == 200
    body = response.get_json()
    assert body["total"] == 2
    assert body["sent"] == 2
    assert body["payrun_reference"] == "PR-001"
    assert len(body["results"]) == 2


def test_api_send_payslips_unknown_payrun(api_client):
    testing_client, _ = api_client
    response = testing_client.post(
        "/api/payruns/00000000-0000-0000-0000-000000000000/send-payslips"
    )
    assert response.status_code == 404
