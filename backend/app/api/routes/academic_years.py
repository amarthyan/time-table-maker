from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import AcademicYear
from app.schemas.academic_year import AcademicYearCreate, AcademicYearResponse, AcademicYearUpdate

router = APIRouter()

@router.post("/", response_model=AcademicYearResponse)
def create_academic_year(year: AcademicYearCreate, db: Session = Depends(get_db)):
    if db.query(AcademicYear).filter(AcademicYear.name == year.name).first():
        raise HTTPException(status_code=400, detail="Academic year already exists")
    db_year = AcademicYear(**year.model_dump())
    db.add(db_year)
    db.commit()
    db.refresh(db_year)
    return db_year

@router.get("/", response_model=list[AcademicYearResponse])
def get_academic_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).all()

@router.put("/{id}", response_model=AcademicYearResponse)
def update_academic_year(id: int, year: AcademicYearUpdate, db: Session = Depends(get_db)):
    db_year = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not db_year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    for k, v in year.model_dump(exclude_unset=True).items():
        setattr(db_year, k, v)
    db.commit()
    db.refresh(db_year)
    return db_year
