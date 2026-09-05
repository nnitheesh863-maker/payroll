from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.employee import EmployeeSummary
from app.schemas.user import UserResponse

class TimeOffTypeBase(BaseModel):
    code: str
    name: str
    is_paid: int = 1
    default_days_per_year: float = 12.0
    description: Optional[str] = None

class TimeOffTypeResponse(TimeOffTypeBase):
    id: int

    class Config:
        from_attributes = True

class TimeOffAllocationResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    year: int
    allocated_days: float
    used_days: float
    remaining_days: float
    leave_type: Optional[TimeOffTypeResponse] = None

    class Config:
        from_attributes = True

class TimeOffRequestCreate(BaseModel):
    employee_id: Optional[int] = None
    leave_type_id: int
    start_date: date
    end_date: date
    days_count: float = 1.0
    reason: str

class TimeOffRequestApproval(BaseModel):
    status: str # APPROVED or REJECTED
    rejection_reason: Optional[str] = None

class TimeOffRequestResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    days_count: float
    reason: str
    status: str
    approved_by_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: Optional[EmployeeSummary] = None
    leave_type: Optional[TimeOffTypeResponse] = None
    approver: Optional[UserResponse] = None

    class Config:
        from_attributes = True
