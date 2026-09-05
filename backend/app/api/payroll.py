"""
Payrun & Payslip API Blueprint — database-backed Phase 6 routes.

Phase 8 guards apply: payroll operations require payroll permissions;
employees may read only their own payslips (ownership via the JWT-linked
employee). All business logic lives in ``app.services.payrun_service``;
routes only serialize, commit, and map domain errors to HTTP codes.

Notes:
- ``status`` is serialized UPPERCASE to preserve the established API
  contract; the database/service truth remains lowercase (CHECK).
- Monetary values are serialized as JSON numbers (floats); the database
  stores exact Numeric(12, 2) and Phase 5 computes with Decimal.
- ``POST /payruns/<id>/send-payslips`` delivers persisted payslip PDFs
  by email (Phase 7.3).
"""

from datetime import date
import uuid

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.api.auth_helpers import (
    get_current_user,
    jwt_required,
    require_permissions,
)
from app.extensions import db
from app.services.auth_service import (
    PERMISSION_PAYROLL_COMPUTE,
    PERMISSION_PAYROLL_DASHBOARD,
    PERMISSION_PAYROLL_PAY,
    PERMISSION_PAYROLL_READ,
    PERMISSION_PAYROLL_SEND,
    PERMISSION_PAYROLL_VALIDATE,
    has_permission,
)
from app.services.payrun_service import (
    PayrunComputationError,
    PayrunStateError,
    PayrunValidationError,
    add_employee_to_payrun,
    compute_payrun,
    create_payrun,
    get_payrun_totals,
    mark_payrun_paid,
    remove_employee_from_payrun,
    validate_payrun,
)

payroll_bp = Blueprint("payroll", __name__, url_prefix="/api")


def _forbidden(detail="Insufficient permissions."):
    return jsonify({"detail": detail}), 403


def _own_employee_only(user, employee_id):
    """True when a non-payroll-reader may access this employee's data."""
    return (
        user.employee_id is not None
        and str(employee_id) == str(user.employee_id)
    )


# ── Serialization ────────────────────────────────────────────────

def _payrun_to_dict(payrun, *, include_totals=True):
    payload = {
        "id": str(payrun.id),
        "name": payrun.name,
        "batch_number": payrun.reference,
        "reference": payrun.reference,
        "period_start": payrun.period_start.isoformat(),
        "period_end": payrun.period_end.isoformat(),
        "salary_structure_id": str(payrun.salary_structure_id),
        "status": (payrun.status or "").upper(),
        "employee_count": len(payrun.payrun_employees or []),
        "employee_ids": [str(pe.employee_id) for pe in payrun.payrun_employees or []],
        "computed_at": payrun.computed_at.isoformat() if payrun.computed_at else None,
        "validated_at": payrun.validated_at.isoformat() if payrun.validated_at else None,
        "paid_at": payrun.paid_at.isoformat() if payrun.paid_at else None,
        "created_at": payrun.created_at.isoformat() if payrun.created_at else None,
    }
    if include_totals:
        totals = get_payrun_totals(payrun)
        payload.update(
            {
                "total_basic": float(totals["total_basic_salary"]),
                "total_earnings": float(totals["total_earnings"]),
                "total_allowances": float(totals["total_allowances"]),
                "total_gross": float(totals["total_gross_salary"]),
                "total_deductions": float(totals["total_deductions"]),
                "total_contributions": float(totals["total_contributions"]),
                "total_employer_contributions": float(
                    totals["total_contributions"]
                ),
                "total_net": float(totals["total_net_salary"]),
                "payslip_count": totals["payslip_count"],
            }
        )
    return payload


def _payslip_to_dict(payslip, *, include_lines=False):
    employee = payslip.employee
    department = getattr(employee, "department", None)
    payload = {
        "id": str(payslip.id),
        "payrun_id": str(payslip.payrun_id),
        "employee_id": str(payslip.employee_id),
        "employee_name": f"{employee.first_name} {employee.last_name}"
        if employee
        else None,
        "employee_code": employee.employee_code if employee else None,
        "department": department.name if department else None,
        "designation": employee.job_title if employee else None,
        "contract_id": str(payslip.contract_id),
        "salary_structure_id": str(payslip.salary_structure_id),
        "period_start": payslip.period_start.isoformat(),
        "period_end": payslip.period_end.isoformat(),
        "basic_salary": float(payslip.basic_salary or 0),
        "total_earnings": float(payslip.total_earnings or 0),
        "total_allowances": float(payslip.total_allowances or 0),
        "gross_salary": float(payslip.gross_salary or 0),
        "total_deductions": float(payslip.total_deductions or 0),
        "total_contributions": float(payslip.total_contributions or 0),
        "employer_contributions": float(payslip.total_contributions or 0),
        "net_salary": float(payslip.net_salary or 0),
        "status": (payslip.status or "").upper(),
        "computed_at": payslip.computed_at.isoformat()
        if payslip.computed_at
        else None,
        "validated_at": payslip.validated_at.isoformat()
        if payslip.validated_at
        else None,
        "paid_at": payslip.paid_at.isoformat() if payslip.paid_at else None,
    }
    if include_lines:
        payload["lines"] = [
            {
                "id": str(line.id),
                "salary_rule_id": str(line.salary_rule_id)
                if line.salary_rule_id
                else None,
                "code": line.rule_code,
                "rule_code": line.rule_code,
                "name": line.rule_name,
                "rule_name": line.rule_name,
                "category": line.category,
                "calculation_method": line.calculation_method,
                "rate_or_percentage": float(line.base_amount)
                if line.base_amount is not None
                else None,
                "base_amount": float(line.base_amount)
                if line.base_amount is not None
                else None,
                "sequence": line.sequence,
                "amount": float(line.amount or 0),
            }
            for line in payslip.lines or []
        ]
    return payload


# ── Helpers ──────────────────────────────────────────────────────

def _not_found(detail):
    return jsonify({"detail": detail}), 404


def _parse_date(value, field_name):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise PayrunValidationError(
            f"Field '{field_name}' must be a YYYY-MM-DD date."
        )


def _lookup_payrun(payrun_id):
    from app.models.payrun import Payrun

    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return None
    return db.session.get(Payrun, uid)


# ── Payruns ──────────────────────────────────────────────────────

@payroll_bp.get("/payruns")
@require_permissions(PERMISSION_PAYROLL_READ)
def list_payruns():
    from app.models.payrun import Payrun

    status = request.args.get("status")
    query = Payrun.query.order_by(Payrun.period_start.desc())
    if status:
        query = query.filter(Payrun.status == status.strip().lower())
    return jsonify([_payrun_to_dict(pr) for pr in query.all()]), 200


@payroll_bp.get("/payruns/<payrun_id>")
@require_permissions(PERMISSION_PAYROLL_READ)
def get_payrun(payrun_id):
    payrun = _lookup_payrun(payrun_id)
    if payrun is None:
        return _not_found("Payrun not found")
    return jsonify(_payrun_to_dict(payrun)), 200


@payroll_bp.post("/payruns")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def create_payrun_route():
    data = request.get_json(silent=True) or {}
    try:
        reference = (
            data.get("reference")
            or data.get("batch_number")
            or f"PR-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        )
        payrun = create_payrun(
            db.session,
            name=data.get("name", "New Payroll Batch"),
            reference=reference,
            period_start=_parse_date(data.get("period_start"), "period_start"),
            period_end=_parse_date(data.get("period_end"), "period_end"),
            salary_structure_id=data.get("salary_structure_id")
            or data.get("pay_structure"),
            employee_ids=data.get("employee_ids")
            if data.get("employee_ids") is not None
            else data.get("selected_employee_ids"),
        )
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"detail": "Payrun could not be created."}), 400
    return jsonify(_payrun_to_dict(payrun)), 201


@payroll_bp.get("/payruns/<payrun_id>/payslips")
@require_permissions(PERMISSION_PAYROLL_READ)
def get_payrun_payslips(payrun_id):
    payrun = _lookup_payrun(payrun_id)
    if payrun is None:
        return _not_found("Payrun not found")
    ordered = sorted(
        payrun.payslips or [],
        key=lambda s: (
            getattr(s.employee, "employee_code", "") if s.employee else "",
            str(s.id),
        ),
    )
    return jsonify([_payslip_to_dict(s) for s in ordered]), 200


@payroll_bp.post("/payruns/<payrun_id>/compute")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def compute_payrun_route(payrun_id):
    try:
        payrun = compute_payrun(db.session, payrun_id)
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        if "does not exist" in str(err):
            return _not_found("Payrun not found")
        return jsonify({"detail": str(err)}), 400
    except PayrunStateError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 409
    except PayrunComputationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 422
    return jsonify(_payrun_to_dict(payrun)), 200


@payroll_bp.post("/payruns/<payrun_id>/validate")
@require_permissions(PERMISSION_PAYROLL_VALIDATE)
def validate_payrun_route(payrun_id):
    """Phase 7.1 gated lifecycle transition.

    A computed payrun is validated by the payroll validation service
    first: blocking errors reject the transition (422 + details), while
    warnings alone allow it. Non-computed payruns keep the Phase 6
    state-machine behavior (409).
    """
    from app.services.payroll_validation_service import validate_payrun_result

    payrun = _lookup_payrun(payrun_id)
    if payrun is None:
        return _not_found("Payrun not found")
    if payrun.status == "computed":
        result = validate_payrun_result(db.session, payrun.id)
        if not result.valid:
            return (
                jsonify(
                    {
                        "detail": (
                            "Payrun has blocking validation errors "
                            f"({result.summary['error_count']})."
                        ),
                        "validation": result.to_dict(),
                    }
                ),
                422,
            )
        try:
            payrun = validate_payrun(db.session, payrun.id)
            db.session.commit()
        except (PayrunValidationError, PayrunStateError) as err:
            db.session.rollback()
            return jsonify({"detail": str(err)}), 409
        payload = _payrun_to_dict(payrun)
        payload["validation"] = result.to_dict()
        return jsonify(payload), 200
    try:
        payrun = validate_payrun(db.session, payrun_id)
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        if "does not exist" in str(err):
            return _not_found("Payrun not found")
        return jsonify({"detail": str(err)}), 400
    except PayrunStateError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 409
    return jsonify(_payrun_to_dict(payrun)), 200


@payroll_bp.post("/payruns/<payrun_id>/mark-paid")
@require_permissions(PERMISSION_PAYROLL_PAY)
def mark_paid_route(payrun_id):
    try:
        payrun = mark_payrun_paid(db.session, payrun_id)
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        if "does not exist" in str(err):
            return _not_found("Payrun not found")
        return jsonify({"detail": str(err)}), 400
    except PayrunStateError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 409
    return jsonify(_payrun_to_dict(payrun)), 200


@payroll_bp.post("/payruns/<payrun_id>/employees")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def add_payrun_employee_route(payrun_id):
    data = request.get_json(silent=True) or {}
    try:
        entry = add_employee_to_payrun(
            db.session, payrun_id, data.get("employee_id")
        )
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        if "does not exist" in str(err):
            return _not_found(str(err))
        return jsonify({"detail": str(err)}), 400
    except PayrunStateError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 409
    return (
        jsonify(
            {
                "payrun_id": str(entry.payrun_id),
                "employee_id": str(entry.employee_id),
            }
        ),
        201,
    )


@payroll_bp.delete("/payruns/<payrun_id>/employees/<employee_id>")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def remove_payrun_employee_route(payrun_id, employee_id):
    try:
        removed = remove_employee_from_payrun(db.session, payrun_id, employee_id)
        db.session.commit()
    except PayrunValidationError as err:
        db.session.rollback()
        return _not_found(str(err))
    except PayrunStateError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 409
    if not removed:
        return _not_found("Payrun employee not found")
    return jsonify({"detail": "Employee removed from payrun."}), 200


@payroll_bp.post("/payruns/<payrun_id>/send-payslips")
@require_permissions(PERMISSION_PAYROLL_SEND)
def send_payslips(payrun_id):
    """Phase 7.3 bulk email delivery of persisted payslip PDFs."""
    from app.services.email_service import send_payslips_for_payrun
    from app.services.payrun_service import (
        PayrunValidationError as PayrunMissing,
    )

    try:
        result = send_payslips_for_payrun(db.session, payrun_id)
    except PayrunMissing:
        return _not_found("Payrun not found")
    return jsonify(result), 200


# ── Dashboard (Phase 7.4 — real aggregations) ────────────────────

@payroll_bp.get("/payroll/dashboard")
@require_permissions(PERMISSION_PAYROLL_DASHBOARD)
def payroll_dashboard():
    """Real payroll/HR dashboard aggregated from persisted rows."""
    from app.services.payroll_dashboard_service import get_payroll_dashboard

    try:
        start = _parse_date(request.args.get("start_date"), "start_date")
        end = _parse_date(request.args.get("end_date"), "end_date")
        if start is not None and end is not None and end < start:
            raise PayrunValidationError("end_date cannot precede start_date.")
        payload = get_payroll_dashboard(
            db.session, start_date=start, end_date=end
        )
    except PayrunValidationError as err:
        return jsonify({"detail": str(err)}), 400
    return jsonify(payload), 200


# ── Payslips (ownership: employees see only their own) ──────────

@payroll_bp.get("/payslips")
@jwt_required
def list_payslips():
    from app.models.payslip import Payslip

    user = get_current_user()
    query = Payslip.query
    employee_id = request.args.get("employee_id")
    if employee_id:
        try:
            employee_uuid = uuid.UUID(str(employee_id))
        except (ValueError, AttributeError, TypeError):
            return jsonify({"detail": "Invalid employee_id."}), 400
        if not has_permission(
            user.role, PERMISSION_PAYROLL_READ
        ) and not _own_employee_only(user, employee_uuid):
            return _forbidden()
        query = query.filter(Payslip.employee_id == employee_uuid)
    elif not has_permission(user.role, PERMISSION_PAYROLL_READ):
        if user.employee_id is None:
            return _forbidden()
        query = query.filter(Payslip.employee_id == user.employee_id)
    payrun_id = request.args.get("payrun_id")
    if payrun_id:
        try:
            query = query.filter(Payslip.payrun_id == uuid.UUID(str(payrun_id)))
        except (ValueError, AttributeError, TypeError):
            return jsonify({"detail": "Invalid payrun_id."}), 400
    return jsonify([_payslip_to_dict(s) for s in query.all()]), 200


def _payslip_visible_to(payslip, user) -> bool:
    """Payroll readers see all slips; others only their own."""
    if has_permission(user.role, PERMISSION_PAYROLL_READ):
        return True
    return _own_employee_only(user, payslip.employee_id)


@payroll_bp.get("/payslips/<payslip_id>")
@jwt_required
def get_payslip(payslip_id):
    from app.models.payslip import Payslip

    try:
        uid = uuid.UUID(str(payslip_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payslip not found")
    payslip = db.session.get(Payslip, uid)
    if payslip is None:
        return _not_found("Payslip not found")
    if not _payslip_visible_to(payslip, get_current_user()):
        return _forbidden()
    return jsonify(_payslip_to_dict(payslip, include_lines=True)), 200


@payroll_bp.get("/payslips/<payslip_id>/pdf")
@jwt_required
def get_payslip_pdf(payslip_id):
    """Download the persisted payslip as a PDF (presentation only)."""
    from flask import Response

    from app.models.payslip import Payslip
    from app.services.payslip_pdf_service import (
        PayslipPdfError,
        generate_payslip_pdf,
        payslip_filename,
    )

    try:
        uid = uuid.UUID(str(payslip_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payslip not found")
    payslip = db.session.get(Payslip, uid)
    if payslip is None:
        return _not_found("Payslip not found")
    if not _payslip_visible_to(payslip, get_current_user()):
        return _forbidden()
    try:
        pdf_bytes = generate_payslip_pdf(db.session, payslip.id)
    except PayslipPdfError:
        return _not_found("Payslip not found")
    filename = payslip_filename(payslip)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
