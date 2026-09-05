from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class KPISummary(BaseModel):
    total_employees: int
    active_employees: int
    total_payroll_last_month: float
    today_present: int
    today_on_leave: int
    today_late: int
    pending_leave_requests: int
    pending_payruns: int

class SalaryTrendItem(BaseModel):
    month: str
    gross_payroll: float
    net_payroll: float
    employee_count: int

class DepartmentDistribution(BaseModel):
    department: str
    count: int
    total_wage: float

class DashboardData(BaseModel):
    kpis: KPISummary
    salary_trends: List[SalaryTrendItem]
    department_distribution: List[DepartmentDistribution]
    recent_activities: List[Dict[str, Any]]
    quick_alerts: List[Dict[str, Any]]
