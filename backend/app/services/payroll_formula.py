"""
Safe AST-based Payroll Formula Evaluator.

Phase 5 (Payroll Calculation Engine). Evaluates formula expressions stored on
SalaryRule without using dangerous eval() / exec() or allowing arbitrary Python
code execution. Uses Python's built-in `ast` module to walk the parsed AST tree
and enforce strict node whitelisting.
"""

from __future__ import annotations

import ast
from decimal import Decimal, DivisionByZero, InvalidOperation
from typing import Mapping


class PayrollFormulaError(ValueError):
    """Base exception for formula parsing or evaluation errors."""


class UnsafeFormulaError(PayrollFormulaError):
    """Raised when a formula attempts illegal/unsafe syntax (calls, attribute access, imports)."""


class UnknownFormulaVariableError(PayrollFormulaError):
    """Raised when a formula references a variable not present in the calculation context."""


class PayrollDivisionByZeroError(PayrollFormulaError):
    """Raised when formula evaluation encounters division by zero."""


def evaluate_formula(
    formula_str: str,
    context: Mapping[str, Decimal | float | int],
) -> Decimal:
    """Safely evaluate a mathematical salary formula against a context dict.

    :param formula_str: Math expression string (e.g. "BASIC + HOUSING * 0.1").
    :param context: Mapping of approved variable names to numeric/Decimal values.
    :return: Calculated Decimal result.
    :raises UnsafeFormulaError: On prohibited AST node types (calls, attributes, etc.).
    :raises UnknownFormulaVariableError: On undefined variable references.
    :raises PayrollDivisionByZeroError: On division by zero.
    :raises PayrollFormulaError: On invalid math syntax or arithmetic failure.
    """
    if not formula_str or not formula_str.strip():
        raise PayrollFormulaError("Formula expression cannot be empty.")

    clean_formula = formula_str.strip()

    try:
        parsed_ast = ast.parse(clean_formula, mode="eval")
    except SyntaxError as err:
        raise PayrollFormulaError(f"Syntax error in formula '{clean_formula}': {err}") from err

    # Case-insensitive context dictionary lookup helper
    normalized_context: dict[str, Decimal] = {}
    for key, val in context.items():
        dec_val = Decimal(str(val)) if not isinstance(val, Decimal) else val
        normalized_context[key.upper()] = dec_val
        normalized_context[key.lower()] = dec_val
        normalized_context[key] = dec_val

    def _eval_node(node: ast.AST) -> Decimal:
        if isinstance(node, ast.Expression):
            return _eval_node(node.body)

        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return Decimal(str(node.value))
            raise UnsafeFormulaError(
                f"Non-numeric constant '{node.value}' is not permitted in formulas."
            )

        elif isinstance(node, ast.Name):
            var_name = node.id
            if var_name in normalized_context:
                return normalized_context[var_name]
            raise UnknownFormulaVariableError(
                f"Unknown variable '{var_name}' in formula context."
            )

        elif isinstance(node, ast.UnaryOp):
            operand = _eval_node(node.operand)
            if isinstance(node.op, ast.UAdd):
                return +operand
            elif isinstance(node.op, ast.USub):
                return -operand
            else:
                raise UnsafeFormulaError(
                    f"Unsupported unary operator '{type(node.op).__name__}'."
                )

        elif isinstance(node, ast.BinOp):
            left = _eval_node(node.left)
            right = _eval_node(node.right)

            if isinstance(node.op, ast.Add):
                return left + right
            elif isinstance(node.op, ast.Sub):
                return left - right
            elif isinstance(node.op, ast.Mult):
                return left * right
            elif isinstance(node.op, ast.Div):
                if right == Decimal("0"):
                    raise PayrollDivisionByZeroError("Division by zero in formula.")
                try:
                    return left / right
                except DivisionByZero as err:
                    raise PayrollDivisionByZeroError("Division by zero in formula.") from err
            elif isinstance(node.op, ast.FloorDiv):
                if right == Decimal("0"):
                    raise PayrollDivisionByZeroError("Division by zero in formula.")
                return left // right
            elif isinstance(node.op, ast.Mod):
                if right == Decimal("0"):
                    raise PayrollDivisionByZeroError("Modulo by zero in formula.")
                return left % right
            elif isinstance(node.op, ast.Pow):
                try:
                    return left ** right
                except InvalidOperation as err:
                    raise PayrollFormulaError(
                        f"Invalid exponentiation operation: {left} ** {right}"
                    ) from err
            else:
                raise UnsafeFormulaError(
                    f"Unsupported binary operator '{type(node.op).__name__}'."
                )

        elif isinstance(node, ast.Call):
            raise UnsafeFormulaError(
                "Function calls are strictly forbidden in salary formulas."
            )

        elif isinstance(node, ast.Attribute):
            raise UnsafeFormulaError(
                "Attribute access ('.') is strictly forbidden in salary formulas."
            )

        elif isinstance(node, ast.Subscript):
            raise UnsafeFormulaError(
                "Subscripting ('[]') is strictly forbidden in salary formulas."
            )

        else:
            raise UnsafeFormulaError(
                f"Prohibited syntax element '{type(node).__name__}' in salary formula."
            )

    return _eval_node(parsed_ast)
