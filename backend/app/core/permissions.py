from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Defined roles according to specification
ROLE_EMPLOYEE = "EMPLOYEE"
ROLE_HR_MANAGER = "HR_MANAGER"
ROLE_HR_PAYROLL_USER = "HR_PAYROLL_USER"
ROLE_HR_PAYROLL_MANAGER = "HR_PAYROLL_MANAGER"
ROLE_ADMIN = "ADMIN"

ALL_ROLES = [
    ROLE_EMPLOYEE,
    ROLE_HR_MANAGER,
    ROLE_HR_PAYROLL_USER,
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_ADMIN,
]

HR_AND_ADMIN_ROLES = [
    ROLE_HR_MANAGER,
    ROLE_ADMIN,
]

PAYROLL_ROLES = [
    ROLE_HR_PAYROLL_USER,
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_ADMIN,
]

PAYROLL_MANAGER_ROLES = [
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_ADMIN,
]

MANAGEMENT_ROLES = [
    ROLE_HR_MANAGER,
    ROLE_HR_PAYROLL_USER,
    ROLE_HR_PAYROLL_MANAGER,
    ROLE_ADMIN,
]

def get_current_user_token_payload(
    token: str = Depends(oauth2_scheme),
) -> dict:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def get_current_user(
    payload: dict = Depends(get_current_user_token_payload),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return user

class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {self.allowed_roles}",
            )
        return current_user
