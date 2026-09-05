"""
Phase 7.2 payslip PDF tests — presentation of persisted payroll data.

SQLite-backed (in-memory); asserts download behavior, PDF validity,
content provenance and that generation never mutates payroll data.
"""

from datetime import date
from decimal import Decimal

import pytest

from app import create_app
from app.extensions import db
from app.models import Contract, Employee, SalaryRule, SalaryStructure
from app.services import compute_payrun, create_payrun
from app.services.payslip_pdf_service import (
    PayslipPdfError,
    generate_payslip_pdf,
    payslip_filename,
)
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
        seed = _seed(db.session)
        db.session.commit()
        seed_admin(db.session)
        ids = {
            "payslip_id": str(seed["payslip"].id),
            "employee_code": seed["employee"].employee_code,
        }
        with app.test_client() as raw:
            yield AuthedClient(raw, login_token(raw)), ids
        db.session.remove()
        db.drop_all()


def _seed(session, code="EMP-001", email="alice@example.com", struct_code="STD"):
    struct = SalaryStructure(
        name=f"Standard {struct_code}", code=struct_code, is_active=True
    )
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
        employee_code=code,
        first_name="Alice",
        last_name="Smith",
        email=email,
        joining_date=date(2024, 1, 1),
    )
    session.add_all([struct, emp])
    session.flush()
    contract = Contract(
        employee=emp,
        contract_reference=f"CTR-{code}",
        contract_type="full_time",
        start_date=date(2026, 1, 1),
        status="active",
        salary=Decimal("5000.00"),
        currency="USD",
        salary_structure=struct,
    )
    session.add(contract)
    session.commit()
    payrun = create_payrun(
        session,
        name="January",
        reference=f"PR-{code}",
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        salary_structure_id=struct.id,
        employee_ids=[emp.id],
    )
    session.commit()
    compute_payrun(session, payrun.id)
    session.commit()
    return {"payslip": payrun.payslips[0], "employee": emp}


# ── Service: valid PDF from persisted data ───────────────────────
def test_generate_pdf_from_persisted_payslip(session):
    seed = _seed(session)
    pdf = generate_payslip_pdf(session, seed["payslip"].id)

    assert isinstance(pdf, bytes)
    assert len(pdf) > 1000
    assert pdf.startswith(b"%PDF")


def test_pdf_embeds_persisted_content(session):
    """Capture the platypus story to prove content comes from stored rows."""
    import re

    import app.services.payslip_pdf_service as pdf_service
    from reportlab.platypus import Paragraph, Table

    seed = _seed(session)
    captured = []
    RealDoc = pdf_service.SimpleDocTemplate

    def _texts(flowable):
        if isinstance(flowable, Paragraph):
            return [flowable.text]
        if isinstance(flowable, Table):
            out = []
            for row in flowable._cellvalues:
                for cell in row:
                    out.extend(_texts(cell))
            return out
        return []

    class RecordingDoc(RealDoc):
        def build(self, story, *args, **kwargs):
            for item in story:
                captured.extend(_texts(item))
            return super().build(story, *args, **kwargs)

    pdf_service.SimpleDocTemplate = RecordingDoc
    try:
        pdf = generate_payslip_pdf(session, seed["payslip"].id)
    finally:
        pdf_service.SimpleDocTemplate = RealDoc

    assert pdf.startswith(b"%PDF")
    rendered = re.sub(r"<[^>]+>", "", " | ".join(captured))
    assert "Alice Smith" in rendered
    assert "EMP-001" in rendered
    assert "BASIC" in rendered
    assert "4,500.00" in rendered
    assert "2026-01-01 to 2026-01-31" in rendered


def test_pdf_differs_per_employee(session):
    first = _seed(session)
    second = _seed(
        session, code="EMP-002", email="bob@example.com", struct_code="STD2"
    )
    pdf_a = generate_payslip_pdf(session, first["payslip"].id)
    pdf_b = generate_payslip_pdf(session, second["payslip"].id)
    assert pdf_a != pdf_b
    assert len(pdf_b) > 1000


def test_generate_pdf_missing_payslip(session):
    with pytest.raises(PayslipPdfError):
        generate_payslip_pdf(
            session, "00000000-0000-0000-0000-000000000000"
        )


def test_pdf_generation_does_not_mutate_payslip(session):
    seed = _seed(session)
    slip = seed["payslip"]
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
    generate_payslip_pdf(session, slip.id)
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


def test_payslip_filename(session):
    seed = _seed(session)
    assert payslip_filename(seed["payslip"]) == "payslip_EMP-001_2026-01.pdf"


# ── API: download behavior ───────────────────────────────────────
def test_api_pdf_download(api_client):
    testing_client, ids = api_client
    response = testing_client.get(f"/api/payslips/{ids['payslip_id']}/pdf")

    assert response.status_code == 200
    assert response.content_type == "application/pdf"
    assert response.data.startswith(b"%PDF")
    assert len(response.data) > 1000
    disposition = response.headers.get("Content-Disposition", "")
    assert "attachment" in disposition
    assert "payslip_EMP-001_2026-01.pdf" in disposition
    assert "/" not in disposition.split("filename=")[-1]


def test_api_pdf_missing_payslip(api_client):
    testing_client, _ = api_client
    response = testing_client.get(
        "/api/payslips/00000000-0000-0000-0000-000000000000/pdf"
    )
    assert response.status_code == 404
