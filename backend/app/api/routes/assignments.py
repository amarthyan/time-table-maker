from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services.assignment_service import validate_assignment

router = APIRouter()

@router.post("/", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db)):
    validate_assignment(db, assignment)
    db_assignment = Assignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(Assignment).all()
