import os
import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

def num_to_words(n: float) -> str:
    """Helper to convert number to currency words (Indian/Western format approximation)"""
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    num = int(n)
    if num == 0:
        return "Zero Rupees Only"
        
    def two_digit(val):
        if val < 10:
            return units[val]
        elif val < 20:
            return teens[val - 10]
        else:
            return tens[val // 10] + (" " + units[val % 10] if val % 10 != 0 else "")

    def three_digit(val):
        h = val // 100
        rem = val % 100
        res = ""
        if h > 0:
            res += units[h] + " Hundred"
            if rem > 0:
                res += " and "
        if rem > 0:
            res += two_digit(rem)
        return res

    words = []
    # Crores / Millions
    cr = num // 10000000
    num %= 10000000
    if cr > 0:
        words.append(three_digit(cr) + " Crore")
    
    # Lakhs
    lakh = num // 100000
    num %= 100000
    if lakh > 0:
        words.append(two_digit(lakh) + " Lakh")
        
    # Thousands
    th = num // 1000
    num %= 1000
    if th > 0:
        words.append(two_digit(th) + " Thousand")
        
    if num > 0:
        words.append(three_digit(num))
        
    return " ".join(words).strip() + " Rupees Only"


class ReportLabPayslipService:
    @staticmethod
    def generate_payslip_pdf(payslip, employee, payrun) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        primary_color = colors.HexColor("#2563EB")
        dark_slate = colors.HexColor("#0F172A")
        muted_gray = colors.HexColor("#64748B")
        light_bg = colors.HexColor("#F8FAFC")
        border_color = colors.HexColor("#E2E8F0")

        title_style = ParagraphStyle(
            'CompanyTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=primary_color,
            alignment=TA_LEFT
        )
        
        subtitle_style = ParagraphStyle(
            'CompanySubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=muted_gray,
            alignment=TA_LEFT
        )
        
        doc_header_style = ParagraphStyle(
            'DocHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=dark_slate,
            alignment=TA_RIGHT
        )
        
        doc_sub_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=muted_gray,
            alignment=TA_RIGHT
        )
        
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=dark_slate
        )
        
        cell_regular = ParagraphStyle(
            'CellReg',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=dark_slate
        )

        cell_muted = ParagraphStyle(
            'CellMuted',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=muted_gray
        )
        
        cell_amount = ParagraphStyle(
            'CellAmount',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=dark_slate,
            alignment=TA_RIGHT
        )

        cell_amount_bold = ParagraphStyle(
            'CellAmountBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=dark_slate,
            alignment=TA_RIGHT
        )

        story = []

        # 1. Header Banner
        header_data = [
            [
                Paragraph("<b>PeoplePay360</b>", title_style),
                Paragraph("<b>PAYSLIP FOR SALARY</b>", doc_header_style)
            ],
            [
                Paragraph("Enterprise HR & Payroll Management System<br/>Reg Office: Silicon Tech Park, Tower B, Bangalore - 560103", subtitle_style),
                Paragraph(f"Payslip No: <b>{payslip.payslip_number}</b><br/>Pay Period: {payslip.period_start.strftime('%d %b %Y')} - {payslip.period_end.strftime('%d %b %Y')}", doc_sub_style)
            ]
        ]
        t_header = Table(header_data, colWidths=[300, 220])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(t_header)
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=10))

        # 2. Employee Profile Grid
        emp_name = f"{employee.first_name} {employee.last_name}"
        emp_data = [
            [
                Paragraph("Employee Name:", cell_muted), Paragraph(f"<b>{emp_name}</b>", cell_bold),
                Paragraph("Employee Code:", cell_muted), Paragraph(f"<b>{employee.emp_code}</b>", cell_bold)
            ],
            [
                Paragraph("Designation:", cell_muted), Paragraph(employee.position or "Associate", cell_regular),
                Paragraph("Department:", cell_muted), Paragraph(employee.department or "Engineering", cell_regular)
            ],
            [
                Paragraph("Date of Joining:", cell_muted), Paragraph(employee.joining_date.strftime('%d-%m-%Y') if employee.joining_date else "-", cell_regular),
                Paragraph("Bank Name & A/C:", cell_muted), Paragraph(f"{employee.bank_name or 'HDFC Bank'} - {employee.bank_account_number or '4819xxxx921'}", cell_regular)
            ],
            [
                Paragraph("PAN / Tax ID:", cell_muted), Paragraph(employee.pan_number or "ABCDE1234F", cell_regular),
                Paragraph("PF / UAN No:", cell_muted), Paragraph(employee.uan_number or "100928374619", cell_regular)
            ],
            [
                Paragraph("Total Working Days:", cell_muted), Paragraph(str(int(payslip.total_working_days)), cell_regular),
                Paragraph("Days Attended / Paid:", cell_muted), Paragraph(f"{int(payslip.attended_days + payslip.paid_leave_days)} (LOP: {int(payslip.unpaid_leave_days)})", cell_regular)
            ]
        ]
        t_emp = Table(emp_data, colWidths=[110, 150, 110, 150])
        t_emp.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_emp)
        story.append(Spacer(1, 12))

        # 3. Earnings & Deductions Breakdown
        lines = []
        if payslip.lines_json:
            try:
                lines = json.loads(payslip.lines_json)
            except Exception:
                lines = []

        earnings = [item for item in lines if item.get('category') in ['BASIC', 'ALLOWANCE']]
        deductions = [item for item in lines if item.get('category') == 'DEDUCTION']

        # Balance rows for side-by-side alignment
        max_rows = max(len(earnings), len(deductions), 1)
        
        earnings_table_data = [[
            Paragraph("<b>EARNINGS</b>", cell_bold),
            Paragraph("<b>AMOUNT (₹)</b>", cell_amount_bold)
        ]]
        for i in range(max_rows):
            if i < len(earnings):
                e = earnings[i]
                earnings_table_data.append([
                    Paragraph(e.get('name', ''), cell_regular),
                    Paragraph(f"₹ {e.get('amount', 0.0):,.2f}", cell_amount)
                ])
            else:
                earnings_table_data.append([Paragraph("", cell_regular), Paragraph("", cell_amount)])
        
        earnings_table_data.append([
            Paragraph("<b>Total Gross Earnings</b>", cell_bold),
            Paragraph(f"<b>₹ {payslip.gross_salary:,.2f}</b>", cell_amount_bold)
        ])

        deductions_table_data = [[
            Paragraph("<b>DEDUCTIONS</b>", cell_bold),
            Paragraph("<b>AMOUNT (₹)</b>", cell_amount_bold)
        ]]
        for i in range(max_rows):
            if i < len(deductions):
                d = deductions[i]
                deductions_table_data.append([
                    Paragraph(d.get('name', ''), cell_regular),
                    Paragraph(f"₹ {d.get('amount', 0.0):,.2f}", cell_amount)
                ])
            else:
                deductions_table_data.append([Paragraph("", cell_regular), Paragraph("", cell_amount)])
        
        deductions_table_data.append([
            Paragraph("<b>Total Deductions</b>", cell_bold),
            Paragraph(f"<b>₹ {payslip.total_deductions:,.2f}</b>", cell_amount_bold)
        ])

        # Render Earnings & Deductions side by side
        t_earn = Table(earnings_table_data, colWidths=[170, 85])
        t_earn.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#F1F5F9")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))

        t_ded = Table(deductions_table_data, colWidths=[170, 85])
        t_ded.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#FEF2F2")),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#F1F5F9")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))

        side_by_side = Table([
            [t_earn, t_ded]
        ], colWidths=[260, 260])
        side_by_side.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(side_by_side)
        story.append(Spacer(1, 14))

        # 4. Net Pay Summary Highlight Card
        words = num_to_words(payslip.net_salary)
        net_summary_data = [
            [
                Paragraph("<b>NET SALARY PAYABLE:</b>", ParagraphStyle('NetTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#1E3A8A"))),
                Paragraph(f"<b>₹ {payslip.net_salary:,.2f}</b>", ParagraphStyle('NetVal', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=primary_color, alignment=TA_RIGHT))
            ],
            [
                Paragraph(f"<b>In Words:</b> {words}", cell_regular),
                Paragraph(f"Status: <b>{payslip.status}</b>", doc_sub_style)
            ]
        ]
        t_net = Table(net_summary_data, colWidths=[360, 160])
        t_net.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
            ('BOX', (0,0), (-1,-1), 1, primary_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_net)
        story.append(Spacer(1, 20))

        # 5. Signatures and Disclaimers
        sign_data = [
            [
                Paragraph("<b>Employee Signature</b><br/><br/><br/>________________________", cell_regular),
                Paragraph("<b>Authorized Signatory</b><br/><br/><br/><b>PeoplePay360 Finance & HR</b>", ParagraphStyle('AuthSign', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, alignment=TA_RIGHT))
            ]
        ]
        t_sign = Table(sign_data, colWidths=[260, 260])
        t_sign.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(KeepTogether([
            t_sign,
            Spacer(1, 12),
            Paragraph("<i>Note: This is a system-generated payslip generated via PeoplePay360 HR & Payroll Engine and does not require a physical signature if digitally verified.</i>", cell_muted)
        ]))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
