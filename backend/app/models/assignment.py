from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    
    # Optional lab assistants for lab assignments
    lab_assistant_1_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    lab_assistant_2_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    teacher = relationship("Teacher", foreign_keys=[teacher_id], back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    class_ = relationship("ClassModel", back_populates="assignments")
    lab_assistant_1 = relationship("Teacher", foreign_keys=[lab_assistant_1_id])
    lab_assistant_2 = relationship("Teacher", foreign_keys=[lab_assistant_2_id])
