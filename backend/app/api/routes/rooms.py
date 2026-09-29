from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Room, Department
from app.schemas.room import RoomCreate, RoomResponse

router = APIRouter()

@router.post("/", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == room.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if db.query(Room).filter(Room.name == room.name).first():
        raise HTTPException(status_code=400, detail="Room already exists")
    db_room = Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/", response_model=list[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()
