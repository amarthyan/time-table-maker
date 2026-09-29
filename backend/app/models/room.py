from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    building = Column(String, nullable=True)
    floor = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")

    # Relationships
    department = relationship("Department", back_populates="rooms")
    timetable_entries = relationship("TimetableEntry", back_populates="room")
