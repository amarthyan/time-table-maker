from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Timetable
from app.schemas.timetable import TimetableCreate, TimetableResponse
from app.scheduler.generator import generate_timetable_for_semester
from pydantic import BaseModel

router = APIRouter()

class GenerateRequest(BaseModel):
    academic_year_id: int
    semester_type: str

@router.post("/", response_model=TimetableResponse)
def create_timetable(tt: TimetableCreate, db: Session = Depends(get_db)):
    db_tt = Timetable(**tt.model_dump())
    db.add(db_tt)
    db.commit()
    db.refresh(db_tt)
    return db_tt

@router.get("/", response_model=list[TimetableResponse])
def get_timetables(db: Session = Depends(get_db)):
    return db.query(Timetable).all()

@router.post("/generate")
def generate_timetable(req: GenerateRequest, db: Session = Depends(get_db)):
    tt = generate_timetable_for_semester(db, req.academic_year_id, req.semester_type)
    return {
        "status": "success",
        "timetable_id": tt.id,
        "classes": [] # simplified response for now
    }
