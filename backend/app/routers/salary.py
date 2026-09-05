from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.salary_structure import SalaryStructure, SalaryRule
from app.schemas.salary import (
    SalaryStructureCreate,
    SalaryStructureResponse,
    SalaryRuleCreate,
    SalaryRuleResponse,
)
from app.core.permissions import get_current_user, RequireRole, PAYROLL_ROLES, ROLE_ADMIN
from app.models.user import User

router = APIRouter(prefix="/salary", tags=["Salary Structures & Rules"])

@router.get("/structures", response_model=List[SalaryStructureResponse])
def list_salary_structures(db: Session = Depends(get_db)):
    return db.query(SalaryStructure).all()

@router.post("/structures", response_model=SalaryStructureResponse, status_code=status.HTTP_201_CREATED)
def create_salary_structure(
    struct_in: SalaryStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    existing = db.query(SalaryStructure).filter(SalaryStructure.code == struct_in.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Structure code already exists")
    
    struct = SalaryStructure(
        code=struct_in.code,
        name=struct_in.name,
        description=struct_in.description,
        is_active=struct_in.is_active,
    )
    db.add(struct)
    db.commit()
    db.refresh(struct)

    if struct_in.rules:
        for r in struct_in.rules:
            rule = SalaryRule(
                salary_structure_id=struct.id,
                code=r.code,
                name=r.name,
                category=r.category,
                rule_type=r.rule_type,
                amount_or_percentage=r.amount_or_percentage,
                base_code=r.base_code,
                sequence=r.sequence,
                is_active=r.is_active,
            )
            db.add(rule)
        db.commit()
        db.refresh(struct)

    return struct

@router.get("/structures/{structure_id}", response_model=SalaryStructureResponse)
def get_salary_structure(structure_id: int, db: Session = Depends(get_db)):
    struct = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not struct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary structure not found")
    return struct

@router.post("/rules", response_model=SalaryRuleResponse, status_code=status.HTTP_201_CREATED)
def create_salary_rule(
    rule_in: SalaryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    if not rule_in.salary_structure_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="salary_structure_id is required")
    
    rule = SalaryRule(**rule_in.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salary_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(PAYROLL_ROLES)),
):
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return None
