from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    classes = relationship("ClassModel", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")
    subjects = relationship("Subject", back_populates="department")
    rooms = relationship("Room", back_populates="department")
    labs = relationship("Lab", back_populates="department")
    timetables = relationship("Timetable", back_populates="department")
