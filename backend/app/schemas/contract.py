from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.employee import EmployeeSummary

class ContractBase(BaseModel):
    employee_id: int
    contract_title: str
    contract_type: str = "FULL_TIME"
    start_date: date
    end_date: Optional[date] = None
    wage: float
    working_hours_per_week: float = 40.0
    salary_structure_id: Optional[int] = None
    status: str = "ACTIVE"

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    contract_title: Optional[str] = None
    contract_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    wage: Optional[float] = None
    working_hours_per_week: Optional[float] = None
    salary_structure_id: Optional[int] = None
    status: Optional[str] = None

class ContractResponse(ContractBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True
