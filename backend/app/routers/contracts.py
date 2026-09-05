from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.models.employee import Employee
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.core.permissions import (
    get_current_user,
    RequireRole,
    ROLE_ADMIN,
    ROLE_HR_MANAGER,
    HR_AND_ADMIN_ROLES,
    PAYROLL_ROLES,
)
from app.models.user import User

router = APIRouter(prefix="/contracts", tags=["Contracts Management"])

@router.get("", response_model=List[ContractResponse])
def list_contracts(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(MANAGEMENT_ROLES if 'MANAGEMENT_ROLES' in globals() else PAYROLL_ROLES + [ROLE_HR_MANAGER])),
):
    query = db.query(Contract)
    if employee_id:
        query = query.filter(Contract.employee_id == employee_id)
    if status:
        query = query.filter(Contract.status == status)
    return query.order_by(Contract.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract_in: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(HR_AND_ADMIN_ROLES)),
):
    emp = db.query(Employee).filter(Employee.id == contract_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    contract = Contract(**contract_in.dict())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    if current_user.role == "EMPLOYEE" and current_user.employee_id != contract.employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return contract

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(HR_AND_ADMIN_ROLES)),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    
    update_data = contract_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contract, field, value)
    
    db.commit()
    db.refresh(contract)
    return contract

@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([ROLE_ADMIN])),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    db.delete(contract)
    db.commit()
    return None
