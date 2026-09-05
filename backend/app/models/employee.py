from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_code = Column(String, unique=True, index=True, nullable=False) # e.g. EMP001
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    department = Column(String, default="Engineering", nullable=False) # Engineering, HR, Finance, Operations, Sales
    position = Column(String, default="Associate", nullable=False) # e.g. Software Engineer, HR Specialist
    joining_date = Column(Date, default=date.today, nullable=False)
    status = Column(String, default="ACTIVE", nullable=False) # ACTIVE, ON_LEAVE, TERMINATED
    
    # Financial & Legal Details
    bank_account_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    pf_number = Column(String, nullable=True)
    uan_number = Column(String, nullable=True)
    
    # Personal Info
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="employee", uselist=False)
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    timeoff_requests = relationship("TimeOffRequest", back_populates="employee", foreign_keys="TimeOffRequest.employee_id", cascade="all, delete-orphan")
    timeoff_allocations = relationship("TimeOffAllocation", back_populates="employee", cascade="all, delete-orphan")
    payslips = relationship("Payslip", back_populates="employee", cascade="all, delete-orphan")
