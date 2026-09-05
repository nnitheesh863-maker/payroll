from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payrun(Base):
    __tablename__ = "payruns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # e.g. "August 2026 Regular Payrun"
    batch_number = Column(String, unique=True, nullable=False) # e.g. "PR-2026-08-01"
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)
    status = Column(String, default="DRAFT", nullable=False) # DRAFT -> COMPUTED -> VALIDATED -> PAID -> CLOSED
    
    # Financial Aggregates
    total_gross = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    total_employer_contributions = Column(Float, default=0.0)
    employee_count = Column(Integer, default=0)
    
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    validated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payslips = relationship("Payslip", back_populates="payrun", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by_id])
    validator = relationship("User", foreign_keys=[validated_by_id])
