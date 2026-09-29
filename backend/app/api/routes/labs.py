from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Lab, Department
from app.schemas.lab import LabCreate, LabResponse

router = APIRouter()

@router.post("/", response_model=LabResponse)
def create_lab(lab: LabCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == lab.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    
    # Validation: Only the configured three labs should be available. Max 3 check conceptually.
    if db.query(Lab).count() >= 3:
        raise HTTPException(status_code=400, detail="Maximum number of 3 labs reached")
        
    db_lab = Lab(**lab.model_dump())
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

@router.get("/", response_model=list[LabResponse])
def get_labs(db: Session = Depends(get_db)):
    return db.query(Lab).all()
