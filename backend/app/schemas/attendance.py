from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel
from app.schemas.employee import EmployeeSummary

class AttendanceBase(BaseModel):
    employee_id: int
    attendance_date: date = date.today()
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    worked_hours: float = 0.0
    overtime_hours: float = 0.0
    status: str = "PRESENT" # PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE
    notes: Optional[str] = None

class AttendanceCheckIn(BaseModel):
    employee_id: Optional[int] = None # Optional if inferrable from current user

class AttendanceCheckOut(BaseModel):
    employee_id: Optional[int] = None
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    worked_hours: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True
