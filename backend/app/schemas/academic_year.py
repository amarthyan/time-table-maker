from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AcademicYearBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_active: bool = True

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AcademicYearResponse(AcademicYearBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
