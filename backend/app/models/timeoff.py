from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TimeOffType(Base):
    __tablename__ = "timeoff_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False) # e.g. PAID, CASUAL, SICK, UNPAID
    name = Column(String, nullable=False) # e.g. "Paid Annual Leave", "Casual Leave"
    is_paid = Column(Integer, default=1) # 1 for paid, 0 for unpaid (loss of pay)
    default_days_per_year = Column(Float, default=12.0)
    description = Column(String, nullable=True)

class TimeOffAllocation(Base):
    __tablename__ = "timeoff_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("timeoff_types.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, default=datetime.utcnow().year, nullable=False)
    allocated_days = Column(Float, default=12.0, nullable=False)
    used_days = Column(Float, default=0.0, nullable=False)
    remaining_days = Column(Float, default=12.0, nullable=False)

    employee = relationship("Employee", back_populates="timeoff_allocations")
    leave_type = relationship("TimeOffType")

class TimeOffRequest(Base):
    __tablename__ = "timeoff_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("timeoff_types.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, default=1.0, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED, CANCELLED
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="timeoff_requests", foreign_keys=[employee_id])
    leave_type = relationship("TimeOffType")
    approver = relationship("User", foreign_keys=[approved_by_id])
