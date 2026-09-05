from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SalaryRuleBase(BaseModel):
    code: str
    name: str
    category: str # BASIC, ALLOWANCE, DEDUCTION, EMPLOYER_CONTRIBUTION
    rule_type: str = "PERCENTAGE" # PERCENTAGE, FIXED, FORMULA
    amount_or_percentage: float = 0.0
    base_code: Optional[str] = "WAGE"
    sequence: int = 10
    is_active: bool = True

class SalaryRuleCreate(SalaryRuleBase):
    salary_structure_id: Optional[int] = None

class SalaryRuleResponse(SalaryRuleBase):
    id: int
    salary_structure_id: int

    class Config:
        from_attributes = True

class SalaryStructureBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True

class SalaryStructureCreate(SalaryStructureBase):
    rules: Optional[List[SalaryRuleBase]] = []

class SalaryStructureResponse(SalaryStructureBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    rules: List[SalaryRuleResponse] = []

    class Config:
        from_attributes = True
