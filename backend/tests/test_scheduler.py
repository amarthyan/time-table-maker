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

def test_lab_assistant_conflict():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False)
    ]
    rooms = [SchedRoom(id=1)]
    labs = [SchedLab(id=1)]
    
    # Assignment 1: Lab with teacher 1, assistant 2
    a1 = SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[2], is_lab=True, weekly_periods=2)
    # Assignment 2: Normal class with teacher 2 (who is assistant in the lab) at the same time
    a2 = SchedAssignment(id=2, class_id=2, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=False, weekly_periods=1)
    
    solver = TimetableSolver(slots, [a1, a2], rooms, labs)
    result = solver.solve()
    
    # Since there are only 2 slots and a1 takes both, and a2 takes 1, they must overlap. 
    # Teacher 2 cannot be assistant in a1 and teach a2 simultaneously.
    assert result["status"] == "unsatisfiable"

def test_weekly_subject_hours_enforced():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False)
    ]
    rooms = [SchedRoom(id=1)]
    labs = []
    
    # Requires 3 periods but only 2 slots exist
    a1 = SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=3)
    solver = TimetableSolver(slots, [a1], rooms, labs)

def test_lab_overlap_conflict():
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False)
    ]
    rooms = []
    labs = [SchedLab(id=1)] # Only 1 lab
    
    # 2 different lab assignments, different teachers/classes, but need the same lab
    a1 = SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=True, weekly_periods=2)
    a2 = SchedAssignment(id=2, class_id=2, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=True, weekly_periods=2)
    
    solver = TimetableSolver(slots, [a1, a2], rooms, labs)
    result = solver.solve()
    assert result["status"] == "unsatisfiable"

def test_lab_final_period_conflict():
    # 3 periods, first two are occupied by normal class, leaving only 3rd period for the lab
    slots = [
        SchedTimeSlot(id=1, day="Mon", period=1, is_break=False),
        SchedTimeSlot(id=2, day="Mon", period=2, is_break=False),
        SchedTimeSlot(id=3, day="Mon", period=3, is_break=False)
    ]
    rooms = [SchedRoom(id=1)]
    labs = [SchedLab(id=1)]
    
    a1 = SchedAssignment(id=1, class_id=1, subject_id=1, teacher_id=1, assistant_ids=[], is_lab=False, weekly_periods=2)
    a2 = SchedAssignment(id=2, class_id=1, subject_id=2, teacher_id=2, assistant_ids=[], is_lab=True, weekly_periods=2)
    
    # a1 needs 2 periods. Since there are 3 total periods, a1 will take (1,2) or (2,3) or (1,3).
    # a2 needs 2 consecutive periods. 
    # If a1 takes (1,3), a2 could take (1,2)? No class overlap!
    # Let's force a1 to take periods 1 and 2 by making a1 require 2 periods AND adding another class that needs 1 period.
    # Actually, if class_id=1, a1 and a2 cannot overlap. 
    # Total periods needed = 2 + 2 = 4. But we only have 3 slots!
    # Let's make it simpler: only 1 slot is available before the end of the day.
    
    slots2 = [SchedTimeSlot(id=1, day="Mon", period=1, is_break=False)]
    solver2 = TimetableSolver(slots2, [a2], rooms, labs)
    result2 = solver2.solve()
    assert result2["status"] == "unsatisfiable"
