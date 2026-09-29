from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    subject_code = Column(String, unique=True, index=True, nullable=False)
    subject_name = Column(String, nullable=False)
    subject_type = Column(String, nullable=False) # THEORY, LAB, TUTORIAL, PROJECT, OTHER
    weekly_hours = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    assignments = relationship("Assignment", back_populates="subject")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")
