"""
SalaryRule model — one deterministic computation step in a structure.

Phase 4 (Salary Structure & Salary Rules). Each rule carries a category
(earning / allowance / deduction / contribution), a calculation method
(fixed / percentage / formula) with its configuration, and a sequence
driving execution order in Phase 5.

Calculation semantics (evaluated by Phase 5, never here):
- fixed:      result = fixed_amount
- percentage: result = base_amount × percentage / 100
- formula:    Phase 5 evaluates the stored expression with a controlled
              payroll context. No unrestricted eval() — ever.

Category semantics for Phase 5: earnings and allowances add to
compensation; deductions subtract; contributions stay separately
identifiable and are NOT employee deductions.
"""

import uuid

from sqlalchemy import CheckConstraint, Numeric, UniqueConstraint, Uuid

from app.database.session import Base
from app.extensions import db
from app.models.base import TimestampMixin

RULE_CATEGORIES = ("earning", "allowance", "deduction", "contribution")
CALCULATION_METHODS = ("fixed", "percentage", "formula")


class SalaryRule(Base, TimestampMixin):
    """A single ordered rule inside a salary structure."""

    __tablename__ = "salary_rules"
    __table_args__ = (
        UniqueConstraint(
            "salary_structure_id",
            "code",
            name="uq_salary_rule_structure_code",
        ),
        UniqueConstraint(
            "salary_structure_id",
            "sequence",
            name="uq_salary_rule_structure_sequence",
        ),
        CheckConstraint(
            "category IN ('earning', 'allowance', 'deduction', 'contribution')",
            name="ck_salary_rule_category",
        ),
        CheckConstraint(
            "calculation_method IN ('fixed', 'percentage', 'formula')",
            name="ck_salary_rule_calculation_method",
        ),
        CheckConstraint(
            "sequence >= 0",
            name="ck_salary_rule_sequence_non_negative",
        ),
        CheckConstraint(
            "fixed_amount IS NULL OR fixed_amount >= 0",
            name="ck_salary_rule_fixed_amount_non_negative",
        ),
        CheckConstraint(
            "percentage IS NULL OR percentage >= 0",
            name="ck_salary_rule_percentage_non_negative",
        ),
        CheckConstraint(
            "calculation_method != 'fixed' OR fixed_amount IS NOT NULL",
            name="ck_salary_rule_fixed_amount_present",
        ),
        CheckConstraint(
            "calculation_method != 'percentage' OR percentage IS NOT NULL",
            name="ck_salary_rule_percentage_present",
        ),
        CheckConstraint(
            "calculation_method != 'formula' OR formula IS NOT NULL",
            name="ck_salary_rule_formula_present",
        ),
    )

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    salary_structure_id = db.Column(
        db.ForeignKey("salary_structures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(30), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(30), nullable=False)
    calculation_method = db.Column(db.String(30), nullable=False)
    sequence = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    fixed_amount = db.Column(Numeric(12, 2), nullable=True)
    percentage = db.Column(db.Float, nullable=True)
    formula = db.Column(db.Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────
    salary_structure = db.relationship(
        "SalaryStructure", back_populates="rules"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<SalaryRule {self.code} {self.category}/{self.calculation_method} "
            f"seq={self.sequence}>"
        )
