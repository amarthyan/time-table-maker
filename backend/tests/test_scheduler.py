import pytest
from app.scheduler.models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from app.scheduler.solver import TimetableSolver

def test_teacher_conflict():
    slots = [SchedTimeSlot(id=1, day="Mon", period=1, is_break=False)]
    rooms = [SchedRoom(id=1), SchedRoom(id=2)]
    labs = []
    # 2 assignments same teacher, same time
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1),
        SchedAssignment(id=2, class_id=2, subject_id=2, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1),
    ]
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "unsatisfiable"

def test_room_conflict():
    slots = [SchedTimeSlot(id=1, day="Mon", period=1, is_break=False)]
    rooms = [SchedRoom(id=1)] # Only 1 room
    labs = []
    # 2 assignments different teachers, but need a room at the same time
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1),
        SchedAssignment(id=2, class_id=2, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=False, weekly_periods=1),
    ]
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "unsatisfiable"

def test_valid_small_dataset():
    slots = [SchedTimeSlot(id=1, day="Mon", period=1, is_break=False), SchedTimeSlot(id=2, day="Mon", period=2, is_break=False)]
    rooms = [SchedRoom(id=1), SchedRoom(id=2)]
    labs = [SchedLab(id=1)]
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=1),
        SchedAssignment(id=2, class_id=2, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=False, weekly_periods=1),
    ]
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "success"
    assert len(result["entries"]) == 2

def test_lab_duration_consecutive():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False)
    ]
    rooms = []
    labs = [SchedLab(id=1)]
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=True, weekly_periods=2),
    ]
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "success"
    
def test_lab_unsatisfiable_no_consecutive():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=True), # Break breaks the block
        SchedTimeSlot(id=3, day="Mon", period=3, is_break=False)
    ]
    rooms = []
    labs = [SchedLab(id=1)]
    assignments = [
        SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=True, weekly_periods=2),
    ]
    solver = TimetableSolver(slots, assignments, rooms, labs)
    result = solver.solve()
    assert result["status"] == "unsatisfiable"

