"""
Phase 4 SalaryRule tests — categories, calculation methods, validation,
ordering, activation and structure scoping.

SQLite-backed (in-memory); PostgreSQL schema is covered by the migration.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.extensions import db
from app.models import SalaryRule, SalaryStructure
from app.services.salary_rule_service import (
    SalaryRuleValidationError,
    activate_rule,
    create_rule,
    deactivate_rule,
    get_ordered_active_rules,
    get_rule,
    update_rule_config,
    validate_rule,
    validate_rule_config,
)
from app.services.salary_structure_service import (
    add_rule_to_structure,
    create_structure,
    get_structure_rules,
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
def structure(session):
    struct = create_structure(
        session, name="Standard Monthly", code="STD-MONTHLY"
    )
    session.commit()
    return struct


def _rule_kwargs(code, category, method, sequence, **extra):
    params = {
        "name": code.title(),
        "code": code,
        "category": category,
        "calculation_method": method,
        "sequence": sequence,
    }
    params.update(extra)
    return params


# ── earning / allowance / deduction / contribution ───────────────
def test_create_earning_rule(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=50000.0),
    )
    session.commit()

    fetched = session.get(SalaryRule, rule.id)
    assert fetched.category == "earning"
    assert float(fetched.fixed_amount) == 50000.0
    assert fetched.is_active is True
    assert fetched.salary_structure == structure


def test_create_allowance_rule(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("HRA", "allowance", "percentage", 20, percentage=40.0),
    )
    session.commit()
    assert rule.category == "allowance"
    assert rule.percentage == 40.0


def test_create_deduction_rule(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("TAX", "deduction", "percentage", 50, percentage=10.0),
    )
    session.commit()
    assert rule.category == "deduction"


def test_create_contribution_rule(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("PF-ER", "contribution", "percentage", 60, percentage=12.0),
    )
    session.commit()

    # Contributions stay separately classified — never a deduction.
    assert rule.category == "contribution"
    assert rule.category != "deduction"


# ── calculation configurations ───────────────────────────────────
def test_fixed_percentage_formula_configs(session, structure):
    fixed = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=50000.0),
    )
    percent = create_rule(
        session, structure,
        **_rule_kwargs("HRA", "allowance", "percentage", 20, percentage=40.0),
    )
    formula = create_rule(
        session, structure,
        **_rule_kwargs(
            "GROSS", "earning", "formula", 40,
            formula="BASIC + HRA",
        ),
    )
    session.commit()

    assert float(fixed.fixed_amount) == 50000.0
    assert percent.percentage == 40.0
    assert formula.formula == "BASIC + HRA"
    for rule in (fixed, percent, formula):
        validate_rule(rule)


# ── invalid category / method ────────────────────────────────────
def test_invalid_category_rejected(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("X", "bonus", "fixed", 10, fixed_amount=1.0),
        )
    session.rollback()


def test_invalid_calculation_method_rejected(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("X", "earning", "magic", 10, fixed_amount=1.0),
        )
    session.rollback()


def test_invalid_category_at_db_level(session, structure):
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Bad",
            code="BAD",
            category="bonus",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=1.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── missing payloads ─────────────────────────────────────────────
def test_missing_fixed_amount(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("BASIC", "earning", "fixed", 10),
        )
    session.rollback()


def test_missing_percentage(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("HRA", "allowance", "percentage", 20),
        )
    session.rollback()


def test_missing_formula(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("GROSS", "earning", "formula", 40),
        )
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("GROSS", "earning", "formula", 40, formula="  "),
        )
    session.rollback()


def test_missing_payload_at_db_level(session, structure):
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Basic",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=None,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


# ── negative amounts ─────────────────────────────────────────────
def test_negative_fixed_amount(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        validate_rule_config(
            category="earning", calculation_method="fixed",
            sequence=10, fixed_amount=-100.0,
        )
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Basic",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=-100.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_negative_percentage(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        validate_rule_config(
            category="deduction", calculation_method="percentage",
            sequence=50, percentage=-5.0,
        )
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Tax",
            code="TAX",
            category="deduction",
            calculation_method="percentage",
            sequence=50,
            percentage=-5.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_invalid_sequence(session, structure):
    with pytest.raises(SalaryRuleValidationError):
        validate_rule_config(
            category="earning", calculation_method="fixed",
            sequence=-1, fixed_amount=1.0,
        )


# ── code scoping per structure ───────────────────────────────────
def test_duplicate_rule_code_same_structure(session, structure):
    create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    session.commit()
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("BASIC", "allowance", "fixed", 20, fixed_amount=2.0),
        )
    session.rollback()


def test_duplicate_sequence_same_structure(session, structure):
    create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    session.commit()
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session, structure,
            **_rule_kwargs("HRA", "allowance", "fixed", 10, fixed_amount=2.0),
        )
    session.rollback()


def test_same_code_different_structures(session, structure):
    other = create_structure(session, name="Executive", code="EXEC")
    session.commit()
    create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    rule = create_rule(
        session, other,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=9.0),
    )
    session.commit()
    assert rule.salary_structure == other


def test_duplicate_code_at_db_level(session, structure):
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Basic",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=10,
            fixed_amount=1.0,
        )
    )
    session.commit()
    session.add(
        SalaryRule(
            salary_structure=structure,
            name="Basic Again",
            code="BASIC",
            category="earning",
            calculation_method="fixed",
            sequence=20,
            fixed_amount=2.0,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()


def test_rule_requires_structure(session):
    with pytest.raises(SalaryRuleValidationError):
        create_rule(
            session,
            "00000000-0000-0000-0000-000000000000",
            **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
        )
    session.rollback()


# ── sequence ordering ────────────────────────────────────────────
def test_sequence_ordering(session, structure):
    codes = [
        ("NET", "deduction", "formula", 70, {"formula": "GROSS - TAX"}),
        ("BASIC", "earning", "fixed", 10, {"fixed_amount": 50000.0}),
        ("TAX", "deduction", "percentage", 50, {"percentage": 10.0}),
        ("HRA", "allowance", "percentage", 20, {"percentage": 40.0}),
    ]
    for code, cat, method, seq, extra in codes:
        create_rule(
            session, structure,
            **_rule_kwargs(code, cat, method, seq, **extra),
        )
    session.commit()

    ordered = get_ordered_active_rules(structure.rules)
    assert [r.code for r in ordered] == ["BASIC", "HRA", "TAX", "NET"]
    assert [r.code for r in get_structure_rules(structure)] == [
        "BASIC", "HRA", "TAX", "NET",
    ]


# ── activation ───────────────────────────────────────────────────
def test_inactive_rules_excluded(session, structure):
    active = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    dormant = create_rule(
        session, structure,
        **_rule_kwargs("BONUS", "allowance", "fixed", 20, fixed_amount=2.0),
    )
    session.commit()

    deactivate_rule(dormant)
    session.commit()
    assert [r.code for r in get_ordered_active_rules(structure.rules)] == [
        "BASIC"
    ]

    activate_rule(dormant)
    session.commit()
    assert [r.code for r in get_ordered_active_rules(structure.rules)] == [
        "BASIC", "BONUS",
    ]
    assert active.is_active is True


# ── retrieve / update ────────────────────────────────────────────
def test_retrieve_rule(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    session.commit()
    assert get_rule(session, rule.id) == rule
    assert get_rule(session, "00000000-0000-0000-0000-000000000000") is None


def test_update_rule_config(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    session.commit()

    update_rule_config(rule, fixed_amount=60000.0, sequence=15)
    session.commit()
    assert float(rule.fixed_amount) == 60000.0
    assert rule.sequence == 15

    with pytest.raises(SalaryRuleValidationError):
        update_rule_config(rule, category="bonus")
    session.rollback()
    with pytest.raises(SalaryRuleValidationError):
        update_rule_config(rule, nonsense=1)
    session.rollback()


def test_rule_structure_relationship(session, structure):
    rule = create_rule(
        session, structure,
        **_rule_kwargs("BASIC", "earning", "fixed", 10, fixed_amount=1.0),
    )
    session.commit()

    assert rule.salary_structure_id == structure.id
    assert rule in structure.rules
    assert isinstance(rule.salary_structure, SalaryStructure)
