from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payslip import Payslip
from app.schemas.payslip import PayslipResponse
from app.integrations.pdf.reportlab_service import ReportLabPayslipService
from app.integrations.email.smtp_service import EmailService
from app.core.permissions import get_current_user, RequireRole, ROLE_EMPLOYEE, PAYROLL_ROLES
from app.models.user import User

router = APIRouter(prefix="/payslips", tags=["Payslips Management"])

@router.get("", response_model=List[PayslipResponse])
def list_payslips(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    payrun_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Payslip)
    
    if current_user.role == ROLE_EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(Payslip.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(Payslip.employee_id == employee_id)
        
    if payrun_id:
        query = query.filter(Payslip.payrun_id == payrun_id)

    return query.order_by(Payslip.id.desc()).offset(skip).limit(limit).all()

@router.get("/{payslip_id}", response_model=PayslipResponse)
def get_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payslip not found")
    
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != payslip.employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return payslip

@router.get("/{payslip_id}/pdf")
def download_payslip_pdf(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payslip not found")
    
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != payslip.employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pdf_bytes = ReportLabPayslipService.generate_payslip_pdf(payslip, payslip.employee, payslip.payrun)
    
    filename = f"Payslip_{payslip.payslip_number}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.post("/{payslip_id}/send-email")
def email_individual_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payslip not found")
    
    emp = payslip.employee
    if not emp or not emp.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee has no valid email address")

    pdf_bytes = ReportLabPayslipService.generate_payslip_pdf(payslip, emp, payslip.payrun)
    period_str = f"{payslip.period_start.strftime('%B %Y')}"
    
    EmailService.send_payslip_email(
        recipient_email=emp.email,
        recipient_name=f"{emp.first_name} {emp.last_name}",
        payslip_number=payslip.payslip_number,
        period_str=period_str,
        net_amount=payslip.net_salary,
        pdf_bytes=pdf_bytes,
    )
    payslip.status = "SENT"
    db.commit()
    return {"message": f"Payslip {payslip.payslip_number} successfully emailed to {emp.email}"}
