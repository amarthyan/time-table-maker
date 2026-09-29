from sqlalchemy import Column, Integer, String, Boolean, Time
from app.core.database import Base

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False) # MONDAY, TUESDAY, etc.
    period_number = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_break = Column(Boolean, default=False)
