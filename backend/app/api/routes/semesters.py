from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Semester, AcademicYear
from app.schemas.semester import SemesterCreate, SemesterResponse, SemesterUpdate

router = APIRouter()

@router.post("/", response_model=SemesterResponse)
def create_semester(sem: SemesterCreate, db: Session = Depends(get_db)):
    if not db.query(AcademicYear).filter(AcademicYear.id == sem.academic_year_id).first():
        raise HTTPException(status_code=400, detail="Academic year not found")
    if db.query(Semester).filter(Semester.academic_year_id == sem.academic_year_id, Semester.name == sem.name).first():
        raise HTTPException(status_code=400, detail="Semester already exists in this academic year")
    db_sem = Semester(**sem.model_dump())
    db.add(db_sem)
    db.commit()
    db.refresh(db_sem)
    return db_sem

@router.get("/", response_model=list[SemesterResponse])
def get_semesters(db: Session = Depends(get_db)):
    return db.query(Semester).all()

@router.get("/{id}", response_model=SemesterResponse)
def get_semester(id: int, db: Session = Depends(get_db)):
    sem = db.query(Semester).filter(Semester.id == id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    return sem
