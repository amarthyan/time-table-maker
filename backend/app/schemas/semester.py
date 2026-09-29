from pydantic import BaseModel
from typing import Optional

class SemesterBase(BaseModel):
    academic_year_id: int
    name: str
    semester_number: int
    semester_type: str # ODD, EVEN

class SemesterCreate(SemesterBase):
    pass

class SemesterUpdate(BaseModel):
    academic_year_id: Optional[int] = None
    name: Optional[str] = None
    semester_number: Optional[int] = None
    semester_type: Optional[str] = None

class SemesterResponse(SemesterBase):
    id: int

    class Config:
        from_attributes = True
