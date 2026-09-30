from pydantic import BaseModel
from typing import Optional
from datetime import time

class TimeSlotBase(BaseModel):
    day: str
    period_number: int
    start_time: time
    end_time: time
    is_break: bool = False

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotUpdate(BaseModel):
    day: Optional[str] = None
    period_number: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_break: Optional[bool] = None

class TimeSlotResponse(TimeSlotBase):
    id: int

    class Config:
        from_attributes = True
