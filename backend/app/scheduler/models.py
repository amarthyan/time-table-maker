from dataclasses import dataclass
from typing import List, Optional

@dataclass
class SchedTimeSlot:
    id: int
    day: str
    period: int
    is_break: bool

@dataclass
class SchedTeacher:
    id: int

@dataclass
class SchedRoom:
    id: int

@dataclass
class SchedLab:
    id: int

@dataclass
class SchedAssignment:
    id: int
    class_id: int
    subject_id: int
    teacher_id: int
    assistant_ids: List[int]
    is_lab: bool
    weekly_periods: int # 1 hour = 1 period. For labs, weekly_hours should be even
