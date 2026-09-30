from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssignmentBase(BaseModel):
    teacher_id: int
    subject_id: int
    class_id: int
    lab_assistant_1_id: Optional[int] = None
    lab_assistant_2_id: Optional[int] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    teacher_id: Optional[int] = None
    subject_id: Optional[int] = None
    class_id: Optional[int] = None
    lab_assistant_1_id: Optional[int] = None
    lab_assistant_2_id: Optional[int] = None

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
