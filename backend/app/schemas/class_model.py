from pydantic import BaseModel
from typing import Optional

class ClassModelBase(BaseModel):
    department_id: int
    academic_year_id: int
    semester_id: int
    year_number: int
    division: str
    name: str
    student_count: int = 60
    is_active: bool = True

class ClassModelCreate(ClassModelBase):
    pass

class ClassModelUpdate(BaseModel):
    department_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    semester_id: Optional[int] = None
    year_number: Optional[int] = None
    division: Optional[str] = None
    name: Optional[str] = None
    student_count: Optional[int] = None
    is_active: Optional[bool] = None

class ClassModelResponse(ClassModelBase):
    id: int

    class Config:
        from_attributes = True
