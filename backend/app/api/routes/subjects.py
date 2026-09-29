from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Subject, Department, Semester
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate

router = APIRouter()

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == subject.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if not db.query(Semester).filter(Semester.id == subject.semester_id).first():
        raise HTTPException(status_code=400, detail="Semester not found")
    if db.query(Subject).filter(Subject.subject_code == subject.subject_code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
        
    db_subject = Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/", response_model=list[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.get("/{id}", response_model=SubjectResponse)
def get_subject(id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    return s
