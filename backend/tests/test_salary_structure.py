"""
Phase 4 SalaryStructure tests — creation, uniqueness, activation,
retrieval, listing and rule ownership.

SQLite-backed (in-memory); PostgreSQL schema is covered by the migration.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import SalaryRule, SalaryStructure
from app.services.salary_structure_service import (
    SalaryStructureValidationError,
    activate_structure,
    add_rule_to_structure,
    create_structure,
    deactivate_structure,
    get_structure,
    get_structure_rules,
    list_structures,
    validate_structure,
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


def _structure(session, code="STD-MONTHLY", name="Standard Monthly"):
    struct = create_structure(
        session, name=name, code=code, description=f"{name} template"
    )
    session.commit()
    return struct


# ── create structure ─────────────────────────────────────────────
def test_create_structure(session):
    struct = _structure(session)

    fetched = session.get(SalaryStructure, struct.id)
    assert fetched is not None
    assert fetched.name == "Standard Monthly"
    assert fetched.code == "STD-MONTHLY"
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


# ── active default ───────────────────────────────────────────────
def test_active_default_true(session):
    struct = _structure(session)
    assert struct.is_active is True


# ── unique name / code ───────────────────────────────────────────
def test_unique_name(session):
    _structure(session, code="A", name="Standard Monthly")
    with pytest.raises(SalaryStructureValidationError):
        create_structure(session, name="Standard Monthly", code="B")
    session.rollback()


def test_unique_code(session):
    _structure(session, code="STD-MONTHLY", name="Standard Monthly")
    with pytest.raises(SalaryStructureValidationError):
        create_structure(session, name="Other", code="STD-MONTHLY")
    session.rollback()


def test_unique_constraints_at_db_level(session):
    session.add(SalaryStructure(name="Standard Monthly", code="STD-MONTHLY"))
    session.commit()
    session.add(SalaryStructure(name="Standard Monthly", code="OTHER"))
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_blank_name_code_rejected(session):
    with pytest.raises(SalaryStructureValidationError):
        create_structure(session, name="  ", code="X")
    with pytest.raises(SalaryStructureValidationError):
        create_structure(session, name="X", code="")
    session.rollback()


# ── inactive structure ───────────────────────────────────────────
def test_deactivate_and_activate(session):
    struct = _structure(session)
    deactivate_structure(struct)
    session.commit()
    assert struct.is_active is False
    assert list_structures(session, active_only=True) == []

    activate_structure(struct)
    session.commit()
    assert struct.is_active is True
    assert list_structures(session, active_only=True) == [struct]


# ── retrieve structure ───────────────────────────────────────────
def test_retrieve_structure(session):
    struct = _structure(session)
    assert get_structure(session, struct.id) == struct
    assert get_structure(session, "00000000-0000-0000-0000-000000000000") is None


# ── list structures ──────────────────────────────────────────────
def test_list_structures_deterministic_order(session):
    create_structure(session, name="Zebra", code="ZEBRA")
    create_structure(session, name="Alpha", code="ALPHA")
    session.commit()

    assert [s.code for s in list_structures(session)] == ["ALPHA", "ZEBRA"]
    assert len(list_structures(session, active_only=True)) == 2


# ── structure → rules ────────────────────────────────────────────
def test_structure_rules_relationship(session):
    struct = _structure(session)
    add_rule_to_structure(
        session,
        struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=50000.0,
    )
    session.commit()

    assert len(struct.rules) == 1
    assert struct.rules[0].code == "BASIC"
    assert struct.rules[0].salary_structure == struct
    validate_structure(struct)


# ── deleting structure removes its rules ─────────────────────────
def test_delete_structure_cascades_rules(session):
    struct = _structure(session)
    add_rule_to_structure(
        session,
        struct,
        name="Basic Salary",
        code="BASIC",
        category="earning",
        calculation_method="fixed",
        sequence=10,
        fixed_amount=50000.0,
    )
    session.commit()
    rule_id = struct.rules[0].id

    session.delete(struct)
    session.commit()

    assert session.get(SalaryStructure, struct.id) is None
    assert session.get(SalaryRule, rule_id) is None


# ── rules in sequence order ──────────────────────────────────────
def test_structure_rules_ordered(session):
    struct = _structure(session)
    add_rule_to_structure(
        session, struct, name="Tax", code="TAX",
        category="deduction", calculation_method="percentage",
        sequence=50, percentage=10.0,
    )
    add_rule_to_structure(
        session, struct, name="Basic", code="BASIC",
        category="earning", calculation_method="fixed",
        sequence=10, fixed_amount=50000.0,
    )
    session.commit()

    ordered = get_structure_rules(struct)
    assert [r.code for r in ordered] == ["BASIC", "TAX"]
