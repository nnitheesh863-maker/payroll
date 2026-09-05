from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_title = Column(String, nullable=False) # e.g. "Full-Time Employment Agreement"
    contract_type = Column(String, default="FULL_TIME", nullable=False) # FULL_TIME, PART_TIME, CONTRACT, INTERN
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    wage = Column(Float, default=0.0, nullable=False) # Monthly Base Wage / CTC base
    working_hours_per_week = Column(Float, default=40.0)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="ACTIVE", nullable=False) # ACTIVE, EXPIRED, TERMINATED, DRAFT

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="contracts")
    salary_structure = relationship("SalaryStructure", back_populates="contracts")
    payslips = relationship("Payslip", back_populates="contract")
