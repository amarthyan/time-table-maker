from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SubjectBase(BaseModel):
    department_id: int
    semester_id: int
    subject_code: str
    subject_name: str
    subject_type: str # THEORY, LAB, TUTORIAL, PROJECT, OTHER
    weekly_hours: int

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    department_id: Optional[int] = None
    semester_id: Optional[int] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    subject_type: Optional[str] = None
    weekly_hours: Optional[int] = None

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
