from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    attendance_date = Column(Date, default=date.today, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    worked_hours = Column(Float, default=0.0) # computed in hours
    overtime_hours = Column(Float, default=0.0)
    status = Column(String, default="PRESENT", nullable=False) # PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_records")
