from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    name = Column(String, nullable=False)
    semester_number = Column(Integer, nullable=False)
    semester_type = Column(String, nullable=False) # ODD, EVEN

    # Relationships
    academic_year = relationship("AcademicYear", back_populates="semesters")
    classes = relationship("ClassModel", back_populates="semester")
    subjects = relationship("Subject", back_populates="semester")
