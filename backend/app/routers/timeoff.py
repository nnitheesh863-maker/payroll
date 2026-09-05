from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.timeoff import TimeOffType, TimeOffAllocation, TimeOffRequest
from app.models.employee import Employee
from app.schemas.timeoff import (
    TimeOffTypeResponse,
    TimeOffAllocationResponse,
    TimeOffRequestCreate,
    TimeOffRequestResponse,
    TimeOffRequestApproval,
)
from app.core.permissions import (
    get_current_user,
    RequireRole,
    HR_AND_ADMIN_ROLES,
    ROLE_EMPLOYEE,
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_ADMIN,
    ROLE_HR_MANAGER,
)
from app.models.user import User

router = APIRouter(prefix="/time-off", tags=["Time Off & Leaves"])

@router.get("/types", response_model=List[TimeOffTypeResponse])
def get_timeoff_types(db: Session = Depends(get_db)):
    return db.query(TimeOffType).all()

@router.get("/allocations", response_model=List[TimeOffAllocationResponse])
def get_allocations(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TimeOffAllocation)
    if current_user.role == ROLE_EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(TimeOffAllocation.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(TimeOffAllocation.employee_id == employee_id)
    
    return query.all()

@router.get("/requests", response_model=List[TimeOffRequestResponse])
def list_timeoff_requests(
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TimeOffRequest)
    if current_user.role == ROLE_EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(TimeOffRequest.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(TimeOffRequest.employee_id == employee_id)

    if status_filter:
        query = query.filter(TimeOffRequest.status == status_filter)

    return query.order_by(TimeOffRequest.id.desc()).all()

@router.post("/requests", response_model=TimeOffRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_timeoff_request(
    request_in: TimeOffRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = request_in.employee_id if (request_in.employee_id and current_user.role in HR_AND_ADMIN_ROLES) else current_user.employee_id
    if not emp_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile linked to user")

    # Check leave type
    ltype = db.query(TimeOffType).filter(TimeOffType.id == request_in.leave_type_id).first()
    if not ltype:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

    # Compute days count if not provided
    days = request_in.days_count or 1.0
    if request_in.end_date < request_in.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date cannot be before start date")

    timeoff_req = TimeOffRequest(
        employee_id=emp_id,
        leave_type_id=request_in.leave_type_id,
        start_date=request_in.start_date,
        end_date=request_in.end_date,
        days_count=days,
        reason=request_in.reason,
        status="PENDING",
    )
    db.add(timeoff_req)
    db.commit()
    db.refresh(timeoff_req)
    return timeoff_req

@router.put("/requests/{request_id}/approve", response_model=TimeOffRequestResponse)
def approve_timeoff_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([ROLE_ADMIN, ROLE_HR_MANAGER, ROLE_HR_PAYROLL_MANAGER])),
):
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Request is already {req.status}")

    req.status = "APPROVED"
    req.approved_by_id = current_user.id
    
    # Update allocation if exists
    allocation = db.query(TimeOffAllocation).filter(
        TimeOffAllocation.employee_id == req.employee_id,
        TimeOffAllocation.leave_type_id == req.leave_type_id
    ).first()
    
    if allocation:
        allocation.used_days += req.days_count
        allocation.remaining_days = max(0.0, allocation.allocated_days - allocation.used_days)

    db.commit()
    db.refresh(req)
    return req

@router.put("/requests/{request_id}/reject", response_model=TimeOffRequestResponse)
def reject_timeoff_request(
    request_id: int,
    approval_in: TimeOffRequestApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([ROLE_ADMIN, ROLE_HR_MANAGER, ROLE_HR_PAYROLL_MANAGER])),
):
    req = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Request is already {req.status}")

    req.status = "REJECTED"
    req.approved_by_id = current_user.id
    req.rejection_reason = approval_in.rejection_reason or "Request not approved"
    
    db.commit()
    db.refresh(req)
    return req
