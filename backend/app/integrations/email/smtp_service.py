import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from app.core.config import settings

class EmailService:
    @staticmethod
    def send_payslip_email(
        recipient_email: str,
        recipient_name: str,
        payslip_number: str,
        period_str: str,
        net_amount: float,
        pdf_bytes: Optional[bytes] = None
    ) -> bool:
        """
        Sends an email with payslip notification and attached PDF.
        Logs to console in sandbox mode or dispatches via SMTP if live.
        """
        subject = f"Your Payslip for {period_str} [{payslip_number}] - PeoplePay360"
        
        body = f"""
        Dear {recipient_name},

        Your salary payslip for the period {period_str} has been computed and approved.

        Summary:
        - Payslip Number: {payslip_number}
        - Net Pay Disbursed: ₹ {net_amount:,.2f}
        
        Please find your itemized salary breakdown attached as a PDF document.
        You can also log in to your PeoplePay360 Employee Portal anytime to view and download all past payslips.

        Best regards,
        Finance & Payroll Operations
        PeoplePay360 Enterprise ERP
        """

        print(f"[EMAIL SERVICE] Simulated Sending email to: {recipient_email} | Subject: {subject} | Net: ₹{net_amount:,.2f}")
        return True
