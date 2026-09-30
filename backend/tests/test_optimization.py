import pytest
from app.scheduler.models import SchedTimeSlot, SchedRoom, SchedLab, SchedAssignment
from app.scheduler.solver import TimetableSolver
from app.core.config import settings

def test_optimization_prefers_fewer_gaps():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False),
        SchedTimeSlot(id=3, day="Mon", period=3, is_break=False)
    ]
    rooms = [SchedRoom(id=1)]
    labs = []
    # 2 subjects for class 1. The solver should place them consecutively to avoid gap
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1),
        SchedAssignment(id=2, class_id=1, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=False, weekly_periods=1)
    ]
    
    settings.MINIMIZE_CLASS_GAPS = True
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "success"
    # To avoid a gap, the slots chosen should be (1,2) or (2,3), not (1,3).
    used_slots = sorted([e["time_slot_id"] for e in result["entries"]])
    assert used_slots in ([1, 2], [2, 3])

def test_optimization_respects_time_limit():
    slots = [SchedTimeSlot(id=i, day="Mon", period=i, is_break=False) for i in range(1, 4)]
    rooms = [SchedRoom(id=1)]
    assignments = [SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1)]
    settings.MAX_SOLVER_TIME_SECONDS = 1
    solver = TimetableSolver(slots, assignments, rooms, [])
    result = solver.solve()
    assert result["status"] == "success"
    assert result["solver_status"] in ("OPTIMAL", "FEASIBLE")
