from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payslip_number = Column(String, unique=True, nullable=False) # e.g. "PS-202608-EMP001"
    payrun_id = Column(Integer, ForeignKey("payruns.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Working Days & Attendance Breakdown
    total_working_days = Column(Float, default=30.0)
    attended_days = Column(Float, default=30.0)
    paid_leave_days = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    
    # Financial Amounts
    base_wage = Column(Float, default=0.0)
    basic_salary = Column(Float, default=0.0)
    total_allowances = Column(Float, default=0.0)
    gross_salary = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)
    employer_contributions = Column(Float, default=0.0)
    
    status = Column(String, default="DRAFT", nullable=False) # DRAFT, COMPUTED, VALIDATED, PAID, SENT
    
    # Detailed line items stored as JSON string for complete audit record
    lines_json = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payrun = relationship("Payrun", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")
    contract = relationship("Contract", back_populates="payslips")
