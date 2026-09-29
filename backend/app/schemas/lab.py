from pydantic import BaseModel
from typing import Optional

class LabBase(BaseModel):
    department_id: int
    name: str
    lab_type: str
    capacity: int
    status: str = "ACTIVE"

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    department_id: Optional[int] = None
    name: Optional[str] = None
    lab_type: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

class LabResponse(LabBase):
    id: int

    class Config:
        from_attributes = True
