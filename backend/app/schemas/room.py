from pydantic import BaseModel
from typing import Optional

class RoomBase(BaseModel):
    department_id: int
    name: str
    capacity: int
    building: Optional[str] = None
    floor: Optional[str] = None
    status: str = "ACTIVE"

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    department_id: Optional[int] = None
    name: Optional[str] = None
    capacity: Optional[int] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    status: Optional[str] = None

class RoomResponse(RoomBase):
    id: int

    class Config:
        from_attributes = True
