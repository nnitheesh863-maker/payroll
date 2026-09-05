"""
Payslip PDF service — presentation of persisted payroll results.

Phase 7.2 (PDF). Renders a professional payslip PDF strictly from stored
Payslip / PayslipLine / Employee / Contract / SalaryStructure rows. Never
calls the payroll engine and never mutates payroll data: the PDF is a
read-only view, not a source of truth.
"""

from __future__ import annotations

from decimal import Decimal
from io import BytesIO
import re
import uuid

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class PayslipPdfError(ValueError):
    """Raised when a payslip PDF cannot be produced."""


def _money(amount) -> str:
    if amount is None:
        amount = Decimal("0.00")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return f"{amount:,.2f}"


def _sanitize_code(value: str | None, fallback: str = "EMP") -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", str(value or fallback)).strip("_")
    return cleaned or fallback


def payslip_filename(payslip) -> str:
    """Build a download filename without exposing filesystem paths."""
    employee = payslip.employee
    code = _sanitize_code(
        getattr(employee, "employee_code", None) if employee else None
    )
    period = payslip.period_start.strftime("%Y-%m")
    return f"payslip_{code}_{period}.pdf"


def _lookup_payslip(session, payslip_id):
    from app.models.payslip import Payslip

    try:
        uid = uuid.UUID(str(payslip_id))
    except (ValueError, AttributeError, TypeError):
        uid = None
    payslip = session.get(Payslip, uid) if uid else None
    if payslip is None:
        raise PayslipPdfError(f"Payslip '{payslip_id}' does not exist.")
    return payslip


def generate_payslip_pdf(
    session, payslip_id: uuid.UUID | str, *, compress: bool = True
) -> bytes:
    """Render the persisted payslip as PDF bytes.

    :param compress: Keep content streams compressed (production default).
        Tests may disable it to assert on embedded text.
    """
    payslip = _lookup_payslip(session, payslip_id)
    employee = payslip.employee
    payrun = payslip.payrun
    contract = payslip.contract
    structure = payslip.salary_structure

    employee_name = (
        f"{employee.first_name} {employee.last_name}" if employee else "—"
    )
    department = getattr(employee, "department", None)

    buffer = BytesIO()
    if compress:
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=16 * mm,
            bottomMargin=16 * mm,
            title=f"Payslip {payslip_filename(payslip)}",
            author="PeoplePay360",
        )
    else:
        canvas_factory = lambda *args, **kwargs: Canvas(
            *args, pageCompression=0, **kwargs
        )
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=16 * mm,
            bottomMargin=16 * mm,
            title=f"Payslip {payslip_filename(payslip)}",
            author="PeoplePay360",
            canvasmaker=canvas_factory,
        )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "PayslipTitle", parent=styles["Title"], fontSize=20, spaceAfter=2 * mm
    )
    subtitle_style = ParagraphStyle(
        "PayslipSub",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#555555"),
        spaceAfter=6 * mm,
    )
    heading_style = ParagraphStyle(
        "SectionHead",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=5 * mm,
        spaceAfter=2 * mm,
    )
    cell_style = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=9)
    cell_bold = ParagraphStyle(
        "CellBold", parent=cell_style, fontName="Helvetica-Bold"
    )
    cell_right = ParagraphStyle(
        "CellRight", parent=cell_style, alignment=2  # TA_RIGHT
    )
    cell_right_bold = ParagraphStyle(
        "CellRightBold", parent=cell_bold, alignment=2
    )

    story = [
        Paragraph("PeoplePay360 — Payslip", title_style),
        Paragraph(
            "System-generated from persisted payroll data. "
            "Not a recalculation.",
            subtitle_style,
        ),
        Paragraph("Employee", heading_style),
        Table(
            [
                [Paragraph("<b>Name</b>", cell_bold), Paragraph(employee_name, cell_style)],
                [
                    Paragraph("<b>Employee code</b>", cell_bold),
                    Paragraph(
                        employee.employee_code if employee else "—", cell_style
                    ),
                ],
                [
                    Paragraph("<b>Email</b>", cell_bold),
                    Paragraph(employee.email if employee else "—", cell_style),
                ],
                [
                    Paragraph("<b>Department</b>", cell_bold),
                    Paragraph(department.name if department else "—", cell_style),
                ],
                [
                    Paragraph("<b>Designation</b>", cell_bold),
                    Paragraph(
                        employee.job_title if employee and employee.job_title else "—",
                        cell_style,
                    ),
                ],
            ],
            colWidths=[45 * mm, 120 * mm],
        ),
        Paragraph("Payrun & Contract", heading_style),
        Table(
            [
                [
                    Paragraph("<b>Payrun</b>", cell_bold),
                    Paragraph(
                        f"{payrun.name} ({payrun.reference})" if payrun else "—",
                        cell_style,
                    ),
                ],
                [
                    Paragraph("<b>Payroll period</b>", cell_bold),
                    Paragraph(
                        f"{payslip.period_start.isoformat()} to "
                        f"{payslip.period_end.isoformat()}",
                        cell_style,
                    ),
                ],
                [
                    Paragraph("<b>Contract</b>", cell_bold),
                    Paragraph(
                        contract.contract_reference if contract else "—",
                        cell_style,
                    ),
                ],
                [
                    Paragraph("<b>Salary structure</b>", cell_bold),
                    Paragraph(
                        f"{structure.name} ({structure.code})"
                        if structure
                        else "—",
                        cell_style,
                    ),
                ],
                [
                    Paragraph("<b>Status</b>", cell_bold),
                    Paragraph(str(payslip.status).upper(), cell_style),
                ],
            ],
            colWidths=[45 * mm, 120 * mm],
        ),
        Paragraph("Salary breakdown", heading_style),
    ]

    line_rows = [
        [
            Paragraph("<b>Code</b>", cell_bold),
            Paragraph("<b>Rule</b>", cell_bold),
            Paragraph("<b>Category</b>", cell_bold),
            Paragraph("<b>Method</b>", cell_bold),
            Paragraph("<b>Seq</b>", cell_right_bold),
            Paragraph("<b>Amount</b>", cell_right_bold),
        ]
    ]
    for line in sorted(payslip.lines or [], key=lambda l: (l.sequence, l.rule_code)):
        line_rows.append(
            [
                Paragraph(line.rule_code, cell_style),
                Paragraph(line.rule_name, cell_style),
                Paragraph(line.category, cell_style),
                Paragraph(line.calculation_method, cell_style),
                Paragraph(str(line.sequence), cell_right),
                Paragraph(_money(line.amount), cell_right),
            ]
        )
    story.append(
        Table(
            line_rows,
            colWidths=[22 * mm, 52 * mm, 28 * mm, 24 * mm, 14 * mm, 25 * mm],
            repeatRows=1,
        )
    )

    story.append(Paragraph("Totals", heading_style))
    totals = [
        ("Basic salary", payslip.basic_salary),
        ("Total earnings", payslip.total_earnings),
        ("Total allowances", payslip.total_allowances),
        ("Gross salary", payslip.gross_salary),
        ("Total deductions", payslip.total_deductions),
        ("Total contributions", payslip.total_contributions),
        ("Net salary", payslip.net_salary),
    ]
    story.append(
        Table(
            [
                [Paragraph(f"<b>{label}</b>", cell_bold), Paragraph(_money(value), cell_right_bold)]
                for label, value in totals
            ],
            colWidths=[120 * mm, 45 * mm],
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        Paragraph(
            "This document was generated from stored payroll records and "
            "does not recalculate salary.",
            subtitle_style,
        )
    )

    for table in [t for t in story if isinstance(t, Table)]:
        table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BBBBBB")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 3),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )

    doc.build(story)
    return buffer.getvalue()
