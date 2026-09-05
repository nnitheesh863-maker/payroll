from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse

class PayrunBase(BaseModel):
    name: str
    period_start: date
    period_end: date
    pay_date: date
    notes: Optional[str] = None

class PayrunCreate(PayrunBase):
    employee_ids: Optional[List[int]] = None # If None, applies to all active employees

class PayrunUpdate(BaseModel):
    name: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    pay_date: Optional[date] = None
    notes: Optional[str] = None

class PayrunResponse(PayrunBase):
    id: int
    batch_number: str
    status: str
    total_gross: float
    total_deductions: float
    total_net: float
    total_employer_contributions: float
    employee_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True
