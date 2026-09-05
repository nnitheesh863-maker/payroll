from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False) # e.g. "STD_INDIA", "EXEC_TIER1"
    name = Column(String, nullable=False) # e.g. "Standard Corporate Salary Structure"
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rules = relationship("SalaryRule", back_populates="salary_structure", cascade="all, delete-orphan", order_by="SalaryRule.sequence")
    contracts = relationship("Contract", back_populates="salary_structure")

class SalaryRule(Base):
    __tablename__ = "salary_rules"

    id = Column(Integer, primary_key=True, index=True)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False) # e.g. BASIC, HRA, SPECIAL_ALLOW, PF, TDS, ESI, PROF_TAX
    name = Column(String, nullable=False) # e.g. "Basic Salary", "House Rent Allowance"
    category = Column(String, nullable=False) # BASIC, ALLOWANCE, DEDUCTION, EMPLOYER_CONTRIBUTION
    rule_type = Column(String, default="PERCENTAGE", nullable=False) # PERCENTAGE, FIXED, FORMULA
    amount_or_percentage = Column(Float, default=0.0, nullable=False) # e.g. 50.0 (for 50% of wage) or 2000.0 (fixed)
    base_code = Column(String, nullable=True) # e.g. "WAGE" or "BASIC" or "GROSS"
    sequence = Column(Integer, default=10, nullable=False) # Order of computation
    is_active = Column(Boolean, default=True)

    salary_structure = relationship("SalaryStructure", back_populates="rules")
