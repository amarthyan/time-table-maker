from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String, nullable=False)
    lab_type = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(String, default="ACTIVE")

    # Relationships
    department = relationship("Department", back_populates="labs")
    timetable_entries = relationship("TimetableEntry", back_populates="lab")
