from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Department
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate

router = APIRouter()

@router.post("/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    if db.query(Department).filter((Department.name == dept.name) | (Department.code == dept.code)).first():
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    db_dept = Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.put("/{id}", response_model=DepartmentResponse)
def update_department(id: int, dept: DepartmentUpdate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in dept.model_dump(exclude_unset=True).items():
        setattr(db_dept, k, v)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{id}")
def delete_department(id: int, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(db_dept)
    db.commit()
    return {"message": "Deleted successfully"}
