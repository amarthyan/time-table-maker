from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TeacherBase(BaseModel):
    department_id: int
    employee_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    status: str = "ACTIVE"

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class TeacherResponse(TeacherBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
