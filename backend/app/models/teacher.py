from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="teachers")
    assignments = relationship("Assignment", back_populates="teacher")
    timetable_entries = relationship("TimetableEntry", foreign_keys="[TimetableEntry.teacher_id]", back_populates="teacher")
    lab_assistant_entries_1 = relationship("TimetableEntry", foreign_keys="[TimetableEntry.lab_assistant_1_id]")
    lab_assistant_entries_2 = relationship("TimetableEntry", foreign_keys="[TimetableEntry.lab_assistant_2_id]")
