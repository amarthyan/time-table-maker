from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ClassModel(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    year_number = Column(Integer, nullable=False) # 1, 2, 3, 4
    division = Column(String, nullable=False) # A, B
    name = Column(String, nullable=False)
    student_count = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)

    # Relationships
    department = relationship("Department", back_populates="classes")
    academic_year = relationship("AcademicYear", back_populates="classes")
    semester = relationship("Semester", back_populates="classes")
    assignments = relationship("Assignment", back_populates="class_")
    timetable_entries = relationship("TimetableEntry", back_populates="class_")
