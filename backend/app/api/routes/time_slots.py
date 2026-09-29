from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import TimeSlot
from app.schemas.time_slot import TimeSlotCreate, TimeSlotResponse

router = APIRouter()

@router.post("/", response_model=TimeSlotResponse)
def create_time_slot(slot: TimeSlotCreate, db: Session = Depends(get_db)):
    db_slot = TimeSlot(**slot.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

@router.get("/", response_model=list[TimeSlotResponse])
def get_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()
