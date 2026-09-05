"""
Salary-rule domain service — validation and deterministic ordering.

Phase 4 (Salary Structure & Salary Rules). Configuration only: validates
rule category / method / payload combinations and exposes rules ordered
by sequence. No payroll calculation happens here (Phase 5 owns that).
Persistence helpers add to the given session but never commit — the
caller owns the transaction.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Sequence
import uuid

from app.models.salary_rule import CALCULATION_METHODS, RULE_CATEGORIES

if TYPE_CHECKING:  # pragma: no cover
    from app.models.salary_rule import SalaryRule
    from app.models.salary_structure import SalaryStructure


class SalaryRuleDomainError(ValueError):
    """Base exception for salary-rule domain validation errors."""


class SalaryRuleValidationError(SalaryRuleDomainError):
    """Raised when a salary rule configuration is invalid."""


def _coerce_uuid(value: uuid.UUID | str | None) -> uuid.UUID | None:
    """Coerce a string identifier to UUID (None when unresolvable)."""
    if value is None or isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def validate_rule_config(
    *,
    category: str,
    calculation_method: str,
    sequence: int,
    fixed_amount=None,
    percentage: float | None = None,
    formula: str | None = None,
) -> None:
    """Validate a rule configuration combination.

    :raises SalaryRuleValidationError: On unknown category/method, invalid
        sequence, missing method payload, or negative amounts.
    """
    if category not in RULE_CATEGORIES:
        raise SalaryRuleValidationError(
            f"Invalid rule category '{category}'. "
            f"Expected one of: {', '.join(RULE_CATEGORIES)}."
        )
    if calculation_method not in CALCULATION_METHODS:
        raise SalaryRuleValidationError(
            f"Invalid calculation method '{calculation_method}'. "
            f"Expected one of: {', '.join(CALCULATION_METHODS)}."
        )
    if sequence is None or not isinstance(sequence, int) or sequence < 0:
        raise SalaryRuleValidationError(
            "Rule sequence must be a non-negative integer."
        )
    if calculation_method == "fixed":
        if fixed_amount is None:
            raise SalaryRuleValidationError(
                "fixed_amount is required for 'fixed' rules."
            )
        if fixed_amount < 0:
            raise SalaryRuleValidationError(
                "fixed_amount must be non-negative."
            )
    elif calculation_method == "percentage":
        if percentage is None:
            raise SalaryRuleValidationError(
                "percentage is required for 'percentage' rules."
            )
        if percentage < 0:
            raise SalaryRuleValidationError(
                "percentage must be non-negative."
            )
    elif calculation_method == "formula":
        if formula is None or not str(formula).strip():
            raise SalaryRuleValidationError(
                "formula is required for 'formula' rules."
            )


def validate_rule(rule: "SalaryRule") -> None:
    """Validate a SalaryRule instance's configuration."""
    validate_rule_config(
        category=rule.category,
        calculation_method=rule.calculation_method,
        sequence=rule.sequence,
        fixed_amount=rule.fixed_amount,
        percentage=rule.percentage,
        formula=rule.formula,
    )


def get_ordered_active_rules(
    rules: Sequence["SalaryRule"],
) -> list["SalaryRule"]:
    """Return active rules in deterministic execution order.

    Primary key: ``sequence`` ascending. Stable secondary keys (code, id)
    break ties so ordering never depends on database row order.
    """
    active = [r for r in rules if r.is_active]
    return sorted(active, key=lambda r: (r.sequence, r.code, str(r.id)))


def get_ordered_rules(rules: Sequence["SalaryRule"]) -> list["SalaryRule"]:
    """Return all rules (active or not) in deterministic sequence order."""
    return sorted(rules, key=lambda r: (r.sequence, r.code, str(r.id)))


def create_rule(
    session,
    structure: "SalaryStructure | uuid.UUID | str",
    *,
    name: str,
    code: str,
    category: str,
    calculation_method: str,
    sequence: int,
    description: str | None = None,
    is_active: bool = True,
    fixed_amount=None,
    percentage: float | None = None,
    formula: str | None = None,
) -> "SalaryRule":
    """Create and validate a rule inside a salary structure.

    :raises SalaryRuleValidationError: If the structure does not exist, the
        configuration is invalid, or the code/sequence is already used in
        this structure.
    """
    from app.models.salary_rule import SalaryRule
    from app.models.salary_structure import SalaryStructure

    if isinstance(structure, (uuid.UUID, str)):
        coerced = _coerce_uuid(structure)
        structure = (
            session.get(SalaryStructure, coerced)
            if coerced is not None
            else None
        )
    if structure is None:
        raise SalaryRuleValidationError(
            "Referenced salary structure does not exist."
        )
    if not name or not str(name).strip():
        raise SalaryRuleValidationError("Rule name is required.")
    if not code or not str(code).strip():
        raise SalaryRuleValidationError("Rule code is required.")
    validate_rule_config(
        category=category,
        calculation_method=calculation_method,
        sequence=sequence,
        fixed_amount=fixed_amount,
        percentage=percentage,
        formula=formula,
    )

    existing = (
        session.query(SalaryRule)
        .filter(SalaryRule.salary_structure_id == structure.id)
        .all()
    )
    for other in existing:
        if other.code == code:
            raise SalaryRuleValidationError(
                f"Rule code '{code}' already exists in this salary structure."
            )
        if other.sequence == sequence:
            raise SalaryRuleValidationError(
                f"Sequence {sequence} is already used in this salary "
                "structure."
            )

    rule = SalaryRule(
        salary_structure=structure,
        name=str(name).strip(),
        code=str(code).strip(),
        description=description,
        category=category,
        calculation_method=calculation_method,
        sequence=sequence,
        is_active=is_active,
        fixed_amount=fixed_amount,
        percentage=percentage,
        formula=formula.strip() if isinstance(formula, str) else formula,
    )
    session.add(rule)
    return rule


def update_rule_config(rule: "SalaryRule", **fields) -> "SalaryRule":
    """Update a rule's configuration fields and re-validate.

    Only known configuration attributes may be updated.
    """
    allowed = {
        "name",
        "code",
        "description",
        "category",
        "calculation_method",
        "sequence",
        "is_active",
        "fixed_amount",
        "percentage",
        "formula",
    }
    unknown = set(fields) - allowed
    if unknown:
        raise SalaryRuleValidationError(
            f"Unknown rule fields: {', '.join(sorted(unknown))}."
        )
    for key, value in fields.items():
        setattr(rule, key, value)
    validate_rule(rule)
    return rule


def activate_rule(rule: "SalaryRule") -> "SalaryRule":
    """Mark a rule as active."""
    rule.is_active = True
    return rule


def deactivate_rule(rule: "SalaryRule") -> "SalaryRule":
    """Mark a rule as inactive (excluded from ordered active retrieval)."""
    rule.is_active = False
    return rule


def get_rule(session, rule_id: uuid.UUID | str) -> "SalaryRule | None":
    """Retrieve a rule by id (None when missing or unresolvable)."""
    from app.models.salary_rule import SalaryRule

    coerced = _coerce_uuid(rule_id)
    if coerced is None:
        return None
    return session.get(SalaryRule, coerced)
