"""
Payrun & Payslip API Blueprint — DB-backed Phase 6/7/8 routes.

Guards apply: payroll operations require payroll permissions;
employees may read only their own payslips (ownership via the JWT-linked
employee). All business logic handles serialization, state-transitions,
computations and PDF generation cleanly.
"""

from datetime import date
import uuid

from flask import Blueprint, Response, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.api.auth_helpers import (
    get_current_user,
    jwt_required,
    require_permissions,
)
from app.extensions import db
from app.models import Payslip, Payrun
from app.services import (
    PERMISSION_PAYROLL_COMPUTE,
    PERMISSION_PAYROLL_DASHBOARD,
    PERMISSION_PAYROLL_PAY,
    PERMISSION_PAYROLL_READ,
    PERMISSION_PAYROLL_SEND,
    PERMISSION_PAYROLL_VALIDATE,
    PayrunComputationError,
    PayrunStateError,
    PayrunValidationError,
    PayslipPdfError,
    add_employee_to_payrun,
    compute_payrun,
    create_payrun,
    generate_payslip_pdf,
    get_payroll_dashboard,
    has_permission,
    mark_payrun_paid,
    payslip_filename,
    remove_employee_from_payrun,
    send_payslips_for_payrun,
    validate_payrun,
    validate_payrun_result,
)

payroll_bp = Blueprint("payroll", __name__, url_prefix="/api")


def _not_found(detail="Resource not found"):
    return jsonify({"detail": detail}), 404


def _bad_request(detail="Invalid request"):
    return jsonify({"detail": detail}), 400


def _conflict(detail="Resource conflict"):
    return jsonify({"detail": detail}), 409


def _forbidden(detail="Insufficient permissions."):
    return jsonify({"detail": detail}), 403


# ── Payruns ──────────────────────────────────────────────────────


@payroll_bp.get("/payruns")
@require_permissions(PERMISSION_PAYROLL_READ)
def list_payruns():
    status = request.args.get("status")
    query = Payrun.query.order_by(Payrun.period_start.desc())
    if status:
        query = query.filter(Payrun.status == status.strip().upper())
    payruns = query.all()
    return jsonify([p.to_dict() for p in payruns]), 200


@payroll_bp.get("/payruns/<payrun_id>")
@require_permissions(PERMISSION_PAYROLL_READ)
def get_payrun(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")
    return jsonify(payrun.to_dict()), 200


@payroll_bp.post("/payruns")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def create_payrun_route():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    reference = data.get("reference") or data.get("batch_number")
    period_start = data.get("period_start")
    period_end = data.get("period_end")
    salary_structure_id = data.get("salary_structure_id")
    employee_ids = data.get("employee_ids") or data.get("selected_employee_ids")

    if not name or not reference or not period_start or not period_end:
        return _bad_request("name, reference, period_start, and period_end are required.")

    try:
        p_start = date.fromisoformat(str(period_start))
        p_end = date.fromisoformat(str(period_end))
    except ValueError as err:
        return _bad_request(f"Invalid date format: {err}")

    try:
        payrun = create_payrun(
            db.session,
            name=name,
            reference=reference,
            period_start=p_start,
            period_end=p_end,
            salary_structure_id=salary_structure_id,
            employee_ids=employee_ids,
        )
        db.session.commit()
        return jsonify(payrun.to_dict()), 201
    except PayrunValidationError as err:
        db.session.rollback()
        return _bad_request(str(err))
    except IntegrityError:
        db.session.rollback()
        return _bad_request("Payrun reference already exists.")
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.get("/payruns/<payrun_id>/payslips")
@require_permissions(PERMISSION_PAYROLL_READ)
def get_payrun_payslips(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")
    return jsonify([s.to_dict() for s in payrun.payslips]), 200


@payroll_bp.post("/payruns/<payrun_id>/compute")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def compute_payrun_route(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    try:
        payrun = compute_payrun(db.session, uid)
        db.session.commit()
        return jsonify(payrun.to_dict()), 200
    except PayrunStateError as err:
        db.session.rollback()
        return _conflict(str(err))
    except PayrunValidationError as err:
        db.session.rollback()
        return _bad_request(str(err))
    except PayrunComputationError as err:
        db.session.rollback()
        return jsonify({"detail": str(err)}), 422
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.post("/payruns/<payrun_id>/validate")
@require_permissions(PERMISSION_PAYROLL_VALIDATE)
def validate_payrun_route(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    if payrun.status != "COMPUTED":
        return _conflict(f"Payrun in status '{payrun.status}' cannot be validated.")

    try:
        val_result = validate_payrun_result(db.session, uid)
        if not val_result.valid:
            return jsonify({
                "detail": "Validation failed with blocking errors.",
                "validation": val_result.to_dict()
            }), 422

        payrun = validate_payrun(db.session, uid)
        db.session.commit()
        return jsonify({
            **payrun.to_dict(),
            "validation": val_result.to_dict()
        }), 200
    except PayrunStateError as err:
        db.session.rollback()
        return _conflict(str(err))
    except PayrunValidationError as err:
        db.session.rollback()
        return _bad_request(str(err))
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.post("/payruns/<payrun_id>/mark-paid")
@payroll_bp.post("/payruns/<payrun_id>/pay")
@require_permissions(PERMISSION_PAYROLL_PAY)
def mark_paid_route(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    try:
        payrun = mark_payrun_paid(db.session, uid)
        db.session.commit()
        return jsonify(payrun.to_dict()), 200
    except PayrunStateError as err:
        db.session.rollback()
        return _conflict(str(err))
    except PayrunValidationError as err:
        db.session.rollback()
        return _bad_request(str(err))
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.post("/payruns/<payrun_id>/send-payslips")
@payroll_bp.post("/payruns/<payrun_id>/send")
@require_permissions(PERMISSION_PAYROLL_SEND)
def send_payslips_route(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    try:
        result = send_payslips_for_payrun(db.session, uid)
        db.session.commit()
        return jsonify(result), 200
    except PayrunValidationError as err:
        db.session.rollback()
        return _not_found(str(err))
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.post("/payruns/<payrun_id>/employees")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def add_employee_to_payrun_route(payrun_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    data = request.get_json(silent=True) or {}
    emp_id = data.get("employee_id")
    try:
        emp_uuid = uuid.UUID(str(emp_id))
    except (ValueError, AttributeError, TypeError):
        return _bad_request("Invalid employee_id")

    try:
        payrun = add_employee_to_payrun(db.session, uid, emp_uuid)
        db.session.commit()
        return jsonify(payrun.to_dict()), 201
    except PayrunValidationError as err:
        db.session.rollback()
        return _bad_request(str(err))
    except (PayrunStateError, IntegrityError, ValueError) as err:
        db.session.rollback()
        return _bad_request(str(err))


@payroll_bp.delete("/payruns/<payrun_id>/employees/<employee_id>")
@require_permissions(PERMISSION_PAYROLL_COMPUTE)
def remove_employee_from_payrun_route(payrun_id, employee_id):
    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payrun not found")

    payrun = db.session.get(Payrun, uid)
    if payrun is None:
        return _not_found("Payrun not found")

    try:
        emp_uuid = uuid.UUID(str(employee_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Invalid employee_id")

    try:
        payrun = remove_employee_from_payrun(db.session, uid, emp_uuid)
        db.session.commit()
        return jsonify(payrun.to_dict()), 200
    except PayrunValidationError as err:
        db.session.rollback()
        return _not_found(str(err))
    except Exception as err:
        db.session.rollback()
        return _bad_request(str(err))


# ── Dashboard ───────────────────────────────────────────────────


@payroll_bp.get("/payroll/dashboard")
@require_permissions(PERMISSION_PAYROLL_DASHBOARD)
def payroll_dashboard():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    start_d = None
    end_d = None
    if start_date_str:
        try:
            start_d = date.fromisoformat(start_date_str)
        except ValueError:
            return _bad_request("Invalid start_date format (YYYY-MM-DD expected)")
    if end_date_str:
        try:
            end_d = date.fromisoformat(end_date_str)
        except ValueError:
            return _bad_request("Invalid end_date format (YYYY-MM-DD expected)")

    try:
        dashboard = get_payroll_dashboard(db.session, start_date=start_d, end_date=end_d)
        return jsonify(dashboard), 200
    except ValueError as err:
        return _bad_request(str(err))


# ── Payslips ────────────────────────────────────────────────────


@payroll_bp.get("/payslips")
@jwt_required
def list_payslips():
    user = get_current_user()
    employee_id_arg = request.args.get("employee_id")
    payrun_id_arg = request.args.get("payrun_id")

    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return _forbidden("User is not linked to an employee profile.")
        if employee_id_arg and str(employee_id_arg) != str(user.employee_id):
            return _forbidden("Cannot view other employees' payslips.")
        query = Payslip.query.filter(Payslip.employee_id == user.employee_id)
    else:
        if not has_permission(user.role, PERMISSION_PAYROLL_READ):
            return _forbidden()
        query = Payslip.query
        if employee_id_arg:
            try:
                emp_uuid = uuid.UUID(str(employee_id_arg))
                query = query.filter(Payslip.employee_id == emp_uuid)
            except Exception:
                return jsonify([]), 200

    if payrun_id_arg:
        try:
            pr_uuid = uuid.UUID(str(payrun_id_arg))
            query = query.filter(Payslip.payrun_id == pr_uuid)
        except Exception:
            return _bad_request("Invalid payrun_id")

    query = query.order_by(Payslip.created_at.desc())
    slips = query.all()
    return jsonify([s.to_dict() for s in slips]), 200


@payroll_bp.get("/payslips/<payslip_id>")
@jwt_required
def get_payslip(payslip_id):
    user = get_current_user()
    try:
        uid = uuid.UUID(str(payslip_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payslip not found")

    slip = db.session.get(Payslip, uid)
    if slip is None:
        return _not_found("Payslip not found")

    if user.role == "EMPLOYEE":
        if not user.employee_id or str(user.employee_id) != str(slip.employee_id):
            return _forbidden("Cannot view other employees' payslips.")
    else:
        if not has_permission(user.role, PERMISSION_PAYROLL_READ):
            return _forbidden()

    return jsonify(slip.to_dict()), 200


@payroll_bp.get("/payslips/<payslip_id>/pdf")
@jwt_required
def get_payslip_pdf(payslip_id):
    user = get_current_user()
    try:
        uid = uuid.UUID(str(payslip_id))
    except (ValueError, AttributeError, TypeError):
        return _not_found("Payslip not found")

    slip = db.session.get(Payslip, uid)
    if slip is None:
        return _not_found("Payslip not found")

    if user.role == "EMPLOYEE":
        if not user.employee_id or str(user.employee_id) != str(slip.employee_id):
            return _forbidden("Cannot download other employees' payslip PDFs.")
    else:
        if not has_permission(user.role, PERMISSION_PAYROLL_READ):
            return _forbidden()

    try:
        pdf_bytes = generate_payslip_pdf(db.session, uid)
        filename = payslip_filename(slip)
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except PayslipPdfError as err:
        return _not_found(str(err))
    except Exception as err:
        return _bad_request(str(err))
