from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee
from app.models.contract import Contract
from app.models.attendance import Attendance
from app.models.timeoff import TimeOffRequest, TimeOffAllocation
from app.models.payslip import Payslip
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.schemas.contract import ContractResponse
from app.schemas.attendance import AttendanceResponse
from app.schemas.timeoff import TimeOffRequestResponse, TimeOffAllocationResponse
from app.schemas.payslip import PayslipResponse
from app.core.permissions import (
    get_current_user,
    RequireRole,
    ROLE_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_EMPLOYEE,
    HR_AND_ADMIN_ROLES,
    MANAGEMENT_ROLES,
)
from app.models.user import User

router = APIRouter(prefix="/employees", tags=["Employees Hub"])

@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    skip: int = 0,
    limit: int = 200,
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Employee)
    
    # If standard employee, can only see basic directory or own profile
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id:
        # Non-managers can still list peers for collaboration directory
        pass

    if department:
        query = query.filter(Employee.department == department)
    if status:
        query = query.filter(Employee.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_fmt)) |
            (Employee.last_name.ilike(search_fmt)) |
            (Employee.emp_code.ilike(search_fmt)) |
            (Employee.email.ilike(search_fmt))
        )
    return query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(HR_AND_ADMIN_ROLES)),
):
    existing = db.query(Employee).filter(
        (Employee.emp_code == emp_in.emp_code) | (Employee.email == emp_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this code or email already exists",
        )
    
    employee = Employee(**emp_in.dict())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to own employee profile",
        )
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    emp_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(HR_AND_ADMIN_ROLES)),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    
    update_data = emp_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([ROLE_ADMIN])),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    db.delete(employee)
    db.commit()
    return None

# Sub-resources for Employee 360 Hub
@router.get("/{employee_id}/contracts", response_model=List[ContractResponse])
def get_employee_contracts(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(Contract).filter(Contract.employee_id == employee_id).order_by(Contract.id.desc()).all()

@router.get("/{employee_id}/attendance", response_model=List[AttendanceResponse])
def get_employee_attendance(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(Attendance).filter(Attendance.employee_id == employee_id).order_by(Attendance.attendance_date.desc()).limit(60).all()

@router.get("/{employee_id}/time-off", response_model=List[TimeOffRequestResponse])
def get_employee_timeoff(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == employee_id).order_by(TimeOffRequest.id.desc()).all()

@router.get("/{employee_id}/allocations", response_model=List[TimeOffAllocationResponse])
def get_employee_allocations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == employee_id).all()

@router.get("/{employee_id}/payslips", response_model=List[PayslipResponse])
def get_employee_payslips(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return db.query(Payslip).filter(Payslip.employee_id == employee_id).order_by(Payslip.period_start.desc()).all()
