from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    
    # Optional lab assistants
    lab_assistant_1_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    lab_assistant_2_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)

    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    lab_id = Column(Integer, ForeignKey("labs.id"), nullable=True)
    day = Column(String, nullable=False)
    period = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False, default=1) # 1 for theory, 2 for lab
    entry_type = Column(String, nullable=False) # THEORY, LAB, TUTORIAL, PROJECT

    # Relationships
    timetable = relationship("Timetable", back_populates="entries")
    class_ = relationship("ClassModel", back_populates="timetable_entries")
    subject = relationship("Subject", back_populates="timetable_entries")
    teacher = relationship("Teacher", foreign_keys=[teacher_id], back_populates="timetable_entries")
    lab_assistant_1 = relationship("Teacher", foreign_keys=[lab_assistant_1_id])
    lab_assistant_2 = relationship("Teacher", foreign_keys=[lab_assistant_2_id])
    room = relationship("Room", back_populates="timetable_entries")
    lab = relationship("Lab", back_populates="timetable_entries")
