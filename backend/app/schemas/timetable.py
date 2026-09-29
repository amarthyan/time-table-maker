from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimetableBase(BaseModel):
    department_id: int
    academic_year_id: int
    semester_type: str
    version: int = 1
    status: str = "DRAFT"

class TimetableCreate(TimetableBase):
    pass

class TimetableUpdate(BaseModel):
    department_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    semester_type: Optional[str] = None
    version: Optional[int] = None
    status: Optional[str] = None

class TimetableResponse(TimetableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TimetableEntryBase(BaseModel):
    timetable_id: int
    class_id: int
    subject_id: int
    teacher_id: int
    lab_assistant_1_id: Optional[int] = None
    lab_assistant_2_id: Optional[int] = None
    room_id: Optional[int] = None
    lab_id: Optional[int] = None
    day: str
    period: int
    duration: int = 1
    entry_type: str

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryUpdate(BaseModel):
    timetable_id: Optional[int] = None
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    lab_assistant_1_id: Optional[int] = None
    lab_assistant_2_id: Optional[int] = None
    room_id: Optional[int] = None
    lab_id: Optional[int] = None
    day: Optional[str] = None
    period: Optional[int] = None
    duration: Optional[int] = None
    entry_type: Optional[str] = None

class TimetableEntryResponse(TimetableEntryBase):
    id: int

    class Config:
        from_attributes = True
