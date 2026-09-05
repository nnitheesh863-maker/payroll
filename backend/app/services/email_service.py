"""
Payslip email service — bulk PDF delivery per payrun.

Phase 7.3 (Email). Sends each employee their own persisted payslip PDF
using only the standard library (smtplib). Never recalculates payroll:
PDFs are rendered from stored rows and totals are never touched. SMTP
transport is injected through ``get_smtp_connection`` so tests patch it
and no real email is ever sent by the test-suite.

Configuration comes from app settings (environment variables); no
credentials are hard-coded or committed.
"""

from __future__ import annotations

from email.message import EmailMessage
import smtplib
import uuid

from app.config import settings
from app.services.payrun_service import PayrunValidationError


class EmailDomainError(ValueError):
    """Base exception for payslip email errors."""


class EmailSendError(EmailDomainError):
    """Raised when a single payslip email cannot be delivered."""


# Payslips in these lifecycle states are considered generated and emailable.
ELIGIBLE_PAYSLIP_STATUSES = ("computed", "validated", "paid")


def get_smtp_connection() -> smtplib.SMTP:
    """Open a configured SMTP connection (patchable seam for tests)."""
    connection = smtplib.SMTP(
        settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10
    )
    if settings.MAIL_USE_TLS:
        connection.starttls()
    if settings.MAIL_USERNAME:
        connection.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
    return connection


def build_payslip_message(
    *,
    recipient: str,
    employee_name: str,
    payrun_reference: str,
    period_label: str,
    pdf_bytes: bytes,
    filename: str,
    sender: str | None = None,
) -> EmailMessage:
    """Compose one payslip email with its PDF attached."""
    message = EmailMessage()
    message["From"] = sender or settings.MAIL_DEFAULT_SENDER
    message["To"] = recipient
    message["Subject"] = f"Your payslip for {period_label} ({payrun_reference})"
    message.set_content(
        f"Dear {employee_name},\n\n"
        f"Please find attached your payslip for {period_label} "
        f"(payrun {payrun_reference}).\n\n"
        "This is a system-generated email. Please contact HR for queries.\n"
    )
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )
    return message


def send_payslip_email(
    *,
    recipient: str,
    employee_name: str,
    payrun_reference: str,
    period_label: str,
    pdf_bytes: bytes,
    filename: str,
) -> None:
    """Deliver one payslip email; raises EmailSendError on failure."""
    message = build_payslip_message(
        recipient=recipient,
        employee_name=employee_name,
        payrun_reference=payrun_reference,
        period_label=period_label,
        pdf_bytes=pdf_bytes,
        filename=filename,
    )
    try:
        with get_smtp_connection() as connection:
            connection.send_message(message)
    except Exception as err:
        raise EmailSendError(f"Failed to send email to {recipient}: {err}") from err


def _lookup_payrun(session, payrun_id):
    from app.models.payrun import Payrun

    try:
        uid = uuid.UUID(str(payrun_id))
    except (ValueError, AttributeError, TypeError):
        uid = None
    payrun = session.get(Payrun, uid) if uid else None
    if payrun is None:
        raise PayrunValidationError(f"Payrun '{payrun_id}' does not exist.")
    return payrun


def send_payslips_for_payrun(
    session, payrun_id: uuid.UUID | str, *, pdf_generator=None
) -> dict:
    """Email persisted payslip PDFs for one payrun; per-employee results.

    One employee's failure never hides other results. Read-only with
    respect to payroll data: slips are read and rendered, never modified
    or recalculated.
    """
    from app.services.payslip_pdf_service import (
        generate_payslip_pdf,
        payslip_filename,
    )

    payrun = _lookup_payrun(session, payrun_id)
    render = pdf_generator or (lambda slip_id: generate_payslip_pdf(session, slip_id))

    results: list[dict] = []
    sent = failed = skipped = 0
    for slip in sorted(
        payrun.payslips or [], key=lambda s: str(s.employee_id)
    ):
        if slip.status not in ELIGIBLE_PAYSLIP_STATUSES:
            continue
        employee = slip.employee
        entry = {
            "employee_id": str(slip.employee_id),
            "employee_code": employee.employee_code if employee else None,
            "email": employee.email if employee else None,
            "status": "failed",
            "error": None,
        }
        address = (employee.email if employee else None or "").strip()
        if not address:
            entry["status"] = "skipped"
            entry["error"] = "Employee has no email address."
            skipped += 1
            results.append(entry)
            continue
        try:
            pdf_bytes = render(slip.id)
            filename = payslip_filename(slip)
            period_label = (
                f"{slip.period_start.isoformat()} to {slip.period_end.isoformat()}"
            )
            send_payslip_email(
                recipient=address,
                employee_name=f"{employee.first_name} {employee.last_name}",
                payrun_reference=payrun.reference,
                period_label=period_label,
                pdf_bytes=pdf_bytes,
                filename=filename,
            )
        except Exception as err:
            entry["status"] = "failed"
            entry["error"] = str(err)
            failed += 1
        else:
            entry["status"] = "sent"
            entry["error"] = None
            sent += 1
        results.append(entry)

    return {
        "payrun_id": str(payrun.id),
        "payrun_reference": payrun.reference,
        "total": sent + failed + skipped,
        "sent": sent,
        "failed": failed,
        "skipped": skipped,
        "results": results,
    }
