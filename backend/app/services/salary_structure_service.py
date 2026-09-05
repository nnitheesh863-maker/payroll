"""
Salary-structure domain service — deterministic structure management.

Phase 4 (Salary Structure & Salary Rules). Configuration only: creates,
retrieves, lists and (de)activates structures, and delegates rule work to
the salary-rule service instead of duplicating it. Persistence helpers add
to the given session but never commit — the caller owns the transaction.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
import uuid

from app.services.salary_rule_service import (
    _coerce_uuid,
    create_rule,
    get_ordered_active_rules,
    get_ordered_rules,
)

if TYPE_CHECKING:  # pragma: no cover
    from app.models.salary_rule import SalaryRule
    from app.models.salary_structure import SalaryStructure


class SalaryStructureDomainError(ValueError):
    """Base exception for salary-structure domain validation errors."""


class SalaryStructureValidationError(SalaryStructureDomainError):
    """Raised when a salary structure configuration is invalid."""


def validate_structure_config(name: str, code: str) -> None:
    """Validate structure identity fields."""
    if not name or not str(name).strip():
        raise SalaryStructureValidationError(
            "Salary structure name is required."
        )
    if not code or not str(code).strip():
        raise SalaryStructureValidationError(
            "Salary structure code is required."
        )


def create_structure(
    session,
    *,
    name: str,
    code: str,
    description: str | None = None,
    is_active: bool = True,
) -> SalaryStructure:
    """Create and validate a salary structure.

    :raises SalaryStructureValidationError: On blank identity fields or
        duplicate name/code.
    """
    from app.models.salary_structure import SalaryStructure

    validate_structure_config(name, code)
    name = str(name).strip()
    code = str(code).strip()

    if session.query(SalaryStructure).filter_by(name=name).first() is not None:
        raise SalaryStructureValidationError(
            f"Salary structure name '{name}' already exists."
        )
    if session.query(SalaryStructure).filter_by(code=code).first() is not None:
        raise SalaryStructureValidationError(
            f"Salary structure code '{code}' already exists."
        )

    structure = SalaryStructure(
        name=name,
        code=code,
        description=description,
        is_active=is_active,
    )
    session.add(structure)
    return structure


def get_structure(
    session, structure_id: uuid.UUID | str
) -> SalaryStructure | None:
    """Retrieve a structure by id (None when missing or unresolvable)."""
    from app.models.salary_structure import SalaryStructure

    coerced = _coerce_uuid(structure_id)
    if coerced is None:
        return None
    return session.get(SalaryStructure, coerced)


def list_structures(session, *, active_only: bool = False) -> list:
    """List structures in deterministic code order."""
    from app.models.salary_structure import SalaryStructure

    query = session.query(SalaryStructure).order_by(SalaryStructure.code)
    if active_only:
        query = query.filter(SalaryStructure.is_active.is_(True))
    return query.all()


def activate_structure(structure: SalaryStructure) -> SalaryStructure:
    """Mark a structure as active."""
    structure.is_active = True
    return structure


def deactivate_structure(structure: SalaryStructure) -> SalaryStructure:
    """Mark a structure as inactive."""
    structure.is_active = False
    return structure


def add_rule_to_structure(
    session,
    structure: SalaryStructure | uuid.UUID | str,
    **rule_fields,
) -> SalaryRule:
    """Add a validated rule to a structure (delegates, never duplicates)."""
    return create_rule(session, structure, **rule_fields)


def get_structure_rules(
    structure: SalaryStructure, *, active_only: bool = True
) -> list:
    """Return a structure's rules in deterministic sequence order."""
    if active_only:
        return get_ordered_active_rules(structure.rules)
    return get_ordered_rules(structure.rules)


def validate_structure(structure: SalaryStructure) -> None:
    """Validate a structure and every rule it holds."""
    from app.services.salary_rule_service import validate_rule

    validate_structure_config(structure.name, structure.code)
    for rule in structure.rules:
        validate_rule(rule)
