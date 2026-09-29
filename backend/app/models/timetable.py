from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    semester_type = Column(String, nullable=False) # ODD, EVEN
    version = Column(Integer, nullable=False, default=1)
    status = Column(String, nullable=False, default="DRAFT") # DRAFT, GENERATING, GENERATED, FAILED, ARCHIVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="timetables")
    academic_year = relationship("AcademicYear", back_populates="timetables")
    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")
