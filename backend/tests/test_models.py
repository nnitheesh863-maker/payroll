"""
Phase 1 model tests — Department, Employee, EmploymentHistory.

These tests run against a throwaway in-memory SQLite database via
``create_app`` config overrides, so they do NOT require PostgreSQL and
do NOT touch the real database. PostgreSQL schema is covered by the
Flask-Migrate migration instead.
"""

from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import Department, Employee, EmploymentHistory


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


def _department(code="ENG", name="Engineering"):
    return Department(code=code, name=name, description=f"{name} dept")


def _employee(code="EMP-001", email="ada@example.com", **kwargs):
    params = {
        "employee_code": code,
        "first_name": "Ada",
        "last_name": "Lovelace",
        "email": email,
        "joining_date": date(2024, 1, 15),
    }
    params.update(kwargs)
    return Employee(**params)


# ── Department ─────────────────────────────────────────────────────

def test_department_creation(session):
    dept = _department()
    session.add(dept)
    session.commit()

    fetched = session.get(Department, dept.id)
    assert fetched is not None
    assert fetched.code == "ENG"
    assert fetched.name == "Engineering"
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


def test_department_code_uniqueness(session):
    session.add(_department(code="ENG", name="Engineering"))
    session.commit()

    session.add(_department(code="ENG", name="Something Else"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_department_name_uniqueness(session):
    session.add(_department(code="ENG", name="Engineering"))
    session.commit()

    session.add(_department(code="QA", name="Engineering"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_department_required_fields(session):
    session.add(Department(code="NONAME"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── Employee ───────────────────────────────────────────────────────

def test_employee_creation(session):
    emp = _employee(
        phone="+911234567890",
        date_of_birth=date(1990, 12, 10),
        gender="female",
        city="Bengaluru",
        country="India",
        job_title="Software Engineer",
        bank_name="HDFC",
        bank_account_number="1234567890",
        bank_ifsc_code="HDFC0001234",
    )
    session.add(emp)
    session.commit()

    fetched = session.get(Employee, emp.id)
    assert fetched is not None
    assert fetched.employee_code == "EMP-001"
    assert fetched.email == "ada@example.com"
    assert fetched.employment_status == "active"
    assert fetched.created_at is not None


def test_employee_department_relationship(session):
    dept = _department()
    emp = _employee()
    emp.department = dept
    session.add_all([dept, emp])
    session.commit()

    assert emp.department_id == dept.id
    assert emp.department.name == "Engineering"
    assert dept.employees == [emp]


def test_employee_code_uniqueness(session):
    session.add(_employee(code="EMP-001", email="one@example.com"))
    session.commit()

    session.add(_employee(code="EMP-001", email="two@example.com"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_employee_email_uniqueness(session):
    session.add(_employee(code="EMP-001", email="ada@example.com"))
    session.commit()

    session.add(_employee(code="EMP-002", email="ada@example.com"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_employee_required_fields(session):
    session.add(Employee(first_name="NoCode"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── EmploymentHistory ──────────────────────────────────────────────

def test_employment_history_relationship(session):
    dept = _department()
    emp = _employee()
    record = EmploymentHistory(
        employee=emp,
        department=dept,
        job_title="Trainee",
        employment_status="active",
        effective_from=date(2024, 1, 15),
        effective_to=date(2024, 6, 30),
        notes="Probation period",
    )
    session.add_all([dept, emp, record])
    session.commit()

    assert record.employee_id == emp.id
    assert record.department_id == dept.id
    assert emp.employment_history == [record]
    assert record.employee.email == "ada@example.com"


def test_employee_multiple_history_records(session):
    emp = _employee()
    first = EmploymentHistory(
        employee=emp,
        job_title="Trainee",
        effective_from=date(2024, 1, 15),
        effective_to=date(2024, 6, 30),
    )
    second = EmploymentHistory(
        employee=emp,
        job_title="Software Engineer",
        effective_from=date(2024, 7, 1),
    )
    session.add_all([emp, first, second])
    session.commit()

    assert len(emp.employment_history) == 2
    titles = [r.job_title for r in emp.employment_history]
    assert titles == ["Trainee", "Software Engineer"]


def test_employment_history_requires_employee(session):
    session.add(EmploymentHistory(effective_from=date(2024, 1, 15)))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()
