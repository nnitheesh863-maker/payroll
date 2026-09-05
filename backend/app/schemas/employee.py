from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class EmployeeBase(BaseModel):
    emp_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str = "Engineering"
    position: str = "Associate"
    joining_date: date = date.today()
    status: str = "ACTIVE"
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    pan_number: Optional[str] = None
    pf_number: Optional[str] = None
    uan_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    profile_photo: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    emp_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    pan_number: Optional[str] = None
    pf_number: Optional[str] = None
    uan_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    profile_photo: Optional[str] = None

class EmployeeSummary(BaseModel):
    id: int
    emp_code: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    email: str
    department: str
    position: str
    status: str

    class Config:
        from_attributes = True

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
