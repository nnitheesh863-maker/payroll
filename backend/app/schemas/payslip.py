from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from app.schemas.employee import EmployeeResponse

class PayslipLineItem(BaseModel):
    code: str
    name: str
    category: str # BASIC, ALLOWANCE, DEDUCTION, EMPLOYER_CONTRIBUTION
    rate_or_percentage: float
    amount: float

class PayslipResponse(BaseModel):
    id: int
    payslip_number: str
    payrun_id: int
    employee_id: int
    contract_id: Optional[int] = None
    period_start: date
    period_end: date
    total_working_days: float
    attended_days: float
    paid_leave_days: float
    unpaid_leave_days: float
    base_wage: float
    basic_salary: float
    total_allowances: float
    gross_salary: float
    total_deductions: float
    net_salary: float
    employer_contributions: float
    status: str
    lines_json: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True
