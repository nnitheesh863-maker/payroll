import uuid
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.payrun import Payrun
from app.models.payslip import Payslip
from app.models.employee import Employee
from app.models.contract import Contract
from app.models.salary_structure import SalaryStructure
from app.models.attendance import Attendance
from app.models.timeoff import TimeOffRequest
from app.schemas.payroll import PayrunCreate, PayrunUpdate, PayrunResponse
from app.schemas.payslip import PayslipResponse
from app.payroll_engine.calculator import PayrollCalculator
from app.integrations.pdf.reportlab_service import ReportLabPayslipService
from app.integrations.email.smtp_service import EmailService
from app.core.permissions import (
    get_current_user,
    RequireRole,
    PAYROLL_ROLES,
    PAYROLL_MANAGER_ROLES,
    ROLE_ADMIN,
    ROLE_HR_PAYROLL_MANAGER,
)
from app.models.user import User

router = APIRouter(prefix="/payruns", tags=["Payroll & Payruns"])

@router.get("", response_model=List[PayrunResponse])
def list_payruns(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    query = db.query(Payrun)
    if status:
        query = query.filter(Payrun.status == status)
    return query.order_by(Payrun.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PayrunResponse, status_code=status.HTTP_201_CREATED)
def create_payrun(
    payrun_in: PayrunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    batch_num = f"PR-{payrun_in.period_start.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    
    payrun = Payrun(
        name=payrun_in.name,
        batch_number=batch_num,
        period_start=payrun_in.period_start,
        period_end=payrun_in.period_end,
        pay_date=payrun_in.pay_date,
        status="DRAFT",
        notes=payrun_in.notes,
        created_by_id=current_user.id,
    )
    db.add(payrun)
    db.commit()
    db.refresh(payrun)
    return payrun

@router.get("/{payrun_id}", response_model=PayrunResponse)
def get_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payrun not found")
    return payrun

@router.get("/{payrun_id}/payslips", response_model=List[PayslipResponse])
def get_payrun_payslips(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    return db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()

@router.post("/{payrun_id}/compute", response_model=PayrunResponse)
def compute_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payrun not found")
    if payrun.status in ["VALIDATED", "PAID"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot recompute payrun in {payrun.status} status")

    # Clear existing draft payslips for this payrun
    db.query(Payslip).filter(Payslip.payrun_id == payrun_id).delete()

    # Get active employees
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    
    total_gross = 0.0
    total_deductions = 0.0
    total_net = 0.0
    total_employer_contributions = 0.0
    count = 0

    period_days = (payrun.period_end - payrun.period_start).days + 1
    total_working_days = max(1.0, float(period_days))

    for emp in employees:
        # Get active contract
        contract = db.query(Contract).filter(
            Contract.employee_id == emp.id,
            Contract.status == "ACTIVE"
        ).first()

        # Get salary structure
        structure = None
        if contract and contract.salary_structure_id:
            structure = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first()

        # Compute attendance and approved leaves in this period
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.attendance_date >= payrun.period_start,
            Attendance.attendance_date <= payrun.period_end
        ).all()
        
        attended_count = len([a for a in attendances if a.status in ["PRESENT", "LATE"]]) + (len([a for a in attendances if a.status == "HALF_DAY"]) * 0.5)
        if attended_count == 0:
            attended_count = total_working_days # fallback default if no punch-clock data yet

        # Approved leaves
        approved_leaves = db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == emp.id,
            TimeOffRequest.status == "APPROVED",
            TimeOffRequest.start_date <= payrun.period_end,
            TimeOffRequest.end_date >= payrun.period_start
        ).all()

        paid_leave_days = 0.0
        unpaid_leave_days = 0.0
        for l in approved_leaves:
            if l.leave_type and l.leave_type.is_paid == 1:
                paid_leave_days += l.days_count
            else:
                unpaid_leave_days += l.days_count

        res = PayrollCalculator.compute(
            employee=emp,
            contract=contract,
            salary_structure=structure,
            total_working_days=total_working_days,
            attended_days=attended_count,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
        )

        ps_num = f"PS-{payrun.period_start.strftime('%Y%m')}-{payrun.id}-{emp.emp_code}"
        payslip = Payslip(
            payslip_number=ps_num,
            payrun_id=payrun.id,
            employee_id=emp.id,
            contract_id=contract.id if contract else None,
            period_start=payrun.period_start,
            period_end=payrun.period_end,
            total_working_days=res.working_days,
            attended_days=res.attended_days,
            paid_leave_days=res.paid_leave_days,
            unpaid_leave_days=res.unpaid_leave_days,
            base_wage=res.base_wage,
            basic_salary=res.basic_salary,
            total_allowances=res.total_allowances,
            gross_salary=res.gross_salary,
            total_deductions=res.total_deductions,
            net_salary=res.net_salary,
            employer_contributions=res.employer_contributions,
            status="COMPUTED",
            lines_json=res.to_dict()["lines_json"],
        )
        db.add(payslip)

        total_gross += res.gross_salary
        total_deductions += res.total_deductions
        total_net += res.net_salary
        total_employer_contributions += res.employer_contributions
        count += 1

    payrun.total_gross = round(total_gross, 2)
    payrun.total_deductions = round(total_deductions, 2)
    payrun.total_net = round(total_net, 2)
    payrun.total_employer_contributions = round(total_employer_contributions, 2)
    payrun.employee_count = count
    payrun.status = "COMPUTED"

    db.commit()
    db.refresh(payrun)
    return payrun

@router.post("/{payrun_id}/validate", response_model=PayrunResponse)
def validate_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_MANAGER_ROLES)),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payrun not found")
    if payrun.status != "COMPUTED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Payrun must be COMPUTED before validation (current: {payrun.status})")

    payrun.status = "VALIDATED"
    payrun.validated_by_id = current_user.id
    
    # Update payslips status to VALIDATED
    db.query(Payslip).filter(Payslip.payrun_id == payrun_id).update({"status": "VALIDATED"})

    db.commit()
    db.refresh(payrun)
    return payrun

@router.post("/{payrun_id}/mark-paid", response_model=PayrunResponse)
def mark_payrun_paid(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_MANAGER_ROLES)),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payrun not found")
    if payrun.status not in ["VALIDATED", "COMPUTED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payrun must be validated before marking as paid")

    payrun.status = "PAID"
    db.query(Payslip).filter(Payslip.payrun_id == payrun_id).update({"status": "PAID"})
    db.commit()
    db.refresh(payrun)
    return payrun

@router.post("/{payrun_id}/send-payslips", response_model=PayrunResponse)
def send_payrun_payslips(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_MANAGER_ROLES)),
):
    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payrun not found")
    
    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    for ps in payslips:
        emp = ps.employee
        if emp and emp.email:
            period_str = f"{ps.period_start.strftime('%B %Y')}"
            pdf_bytes = ReportLabPayslipService.generate_payslip_pdf(ps, emp, payrun)
            EmailService.send_payslip_email(
                recipient_email=emp.email,
                recipient_name=f"{emp.first_name} {emp.last_name}",
                payslip_number=ps.payslip_number,
                period_str=period_str,
                net_amount=ps.net_salary,
                pdf_bytes=pdf_bytes,
            )
            ps.status = "SENT"

    db.commit()
    db.refresh(payrun)
    return payrun
