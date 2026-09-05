from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceCheckIn, AttendanceCheckOut
from app.core.permissions import get_current_user, RequireRole, HR_AND_ADMIN_ROLES, MANAGEMENT_ROLES, ROLE_EMPLOYEE
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance Tracking"])

@router.get("", response_model=List[AttendanceResponse])
def list_attendance(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Attendance)
    
    if current_user.role == ROLE_EMPLOYEE:
        if not current_user.employee_id:
            return []
        query = query.filter(Attendance.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    if start_date:
        query = query.filter(Attendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(Attendance.attendance_date <= end_date)
    if status:
        query = query.filter(Attendance.status == status)

    return query.order_by(Attendance.attendance_date.desc(), Attendance.id.desc()).offset(skip).limit(limit).all()

@router.get("/today", response_model=Optional[AttendanceResponse])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee_id:
        return None
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == current_user.employee_id,
        Attendance.attendance_date == today
    ).first()
    return record

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    data: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = data.employee_id if (data.employee_id and current_user.role in HR_AND_ADMIN_ROLES) else current_user.employee_id
    if not emp_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile linked to user")

    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp_id,
        Attendance.attendance_date == today
    ).first()

    now = datetime.utcnow()
    if existing:
        if existing.check_in:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked in for today")
        existing.check_in = now
        existing.status = "PRESENT"
        db.commit()
        db.refresh(existing)
        return existing
    
    # Calculate initial status (e.g., late if after 9:30 AM)
    status_val = "PRESENT"
    if now.hour > 9 or (now.hour == 9 and now.minute > 30):
        status_val = "LATE"

    record = Attendance(
        employee_id=emp_id,
        attendance_date=today,
        check_in=now,
        status=status_val,
        worked_hours=0.0
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    data: AttendanceCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = data.employee_id if (data.employee_id and current_user.role in HR_AND_ADMIN_ROLES) else current_user.employee_id
    if not emp_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile linked to user")

    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == emp_id,
        Attendance.attendance_date == today
    ).first()

    if not record or not record.check_in:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot check out without checking in first")
    
    now = datetime.utcnow()
    record.check_out = now
    
    # Calculate worked hours
    duration = (now - record.check_in).total_seconds() / 3600.0
    record.worked_hours = round(duration, 2)
    if record.worked_hours > 8.0:
        record.overtime_hours = round(record.worked_hours - 8.0, 2)
    
    if record.worked_hours < 4.0 and record.status != "ON_LEAVE":
        record.status = "HALF_DAY"

    if data.notes:
        record.notes = data.notes

    db.commit()
    db.refresh(record)
    return record

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance_record(
    attendance_id: int,
    data_in: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(HR_AND_ADMIN_ROLES)),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    update_data = data_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record

@router.get("/employee/{employee_id}", response_model=List[AttendanceResponse])
def get_employee_attendance_history(
    employee_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == ROLE_EMPLOYEE and current_user.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    return query.order_by(Attendance.attendance_date.desc()).all()
