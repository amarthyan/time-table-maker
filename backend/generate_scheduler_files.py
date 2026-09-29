import os

BASE_DIR = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\backend"

FILES = {
    "app/scheduler/__init__.py": "",
    
    "app/scheduler/models.py": """\
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
""",

    "app/scheduler/solver.py": """\
from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from .constraints import apply_hard_constraints

class TimetableSolver:
    def __init__(
        self,
        time_slots: List[SchedTimeSlot],
        assignments: List[SchedAssignment],
        rooms: List[SchedRoom],
        labs: List[SchedLab]
    ):
        self.model = cp_model.CpModel()
        self.time_slots = time_slots
        self.assignments = assignments
        self.rooms = rooms
        self.labs = labs
        
        # Variables
        # X[a, t] = 1 if assignment a is scheduled at time slot t
        self.X = {}
        # Y[a, t, r] = 1 if assignment a is scheduled at t in room r (for non-labs)
        self.Y = {}
        # Z[a, t, l] = 1 if assignment a is scheduled at t in lab l (for labs)
        self.Z = {}
        
        self._create_variables()
        apply_hard_constraints(self)

    def _create_variables(self):
        for a in self.assignments:
            for t in self.time_slots:
                if t.is_break:
                    continue # Cannot schedule during breaks
                    
                self.X[(a.id, t.id)] = self.model.NewBoolVar(f"x_a{a.id}_t{t.id}")
                
                if not a.is_lab:
                    for r in self.rooms:
                        self.Y[(a.id, t.id, r.id)] = self.model.NewBoolVar(f"y_a{a.id}_t{t.id}_r{r.id}")
                else:
                    for l in self.labs:
                        self.Z[(a.id, t.id, l.id)] = self.model.NewBoolVar(f"z_a{a.id}_t{t.id}_l{l.id}")

    def solve(self):
        solver = cp_model.CpSolver()
        # Optional: solver.parameters.max_time_in_seconds = 30
        status = solver.Solve(self.model)
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            result = []
            for a in self.assignments:
                for t in self.time_slots:
                    if t.is_break: continue
                    if solver.Value(self.X[(a.id, t.id)]):
                        entry = {
                            "assignment_id": a.id,
                            "time_slot_id": t.id,
                            "class_id": a.class_id,
                            "subject_id": a.subject_id,
                            "teacher_id": a.teacher_id,
                            "is_lab": a.is_lab,
                            "room_id": None,
                            "lab_id": None
                        }
                        if not a.is_lab:
                            for r in self.rooms:
                                if solver.Value(self.Y[(a.id, t.id, r.id)]):
                                    entry["room_id"] = r.id
                        else:
                            for l in self.labs:
                                if solver.Value(self.Z[(a.id, t.id, l.id)]):
                                    entry["lab_id"] = l.id
                        result.append(entry)
            return {"status": "success", "entries": result}
        else:
            return {"status": "unsatisfiable", "entries": []}
""",

    "app/scheduler/constraints.py": """\
def apply_hard_constraints(solver):
    model = solver.model
    time_slots = [t for t in solver.time_slots if not t.is_break]
    assignments = solver.assignments
    rooms = solver.rooms
    labs = solver.labs
    X = solver.X
    Y = solver.Y
    Z = solver.Z
    
    # 1. Weekly hours must be satisfied
    for a in assignments:
        model.Add(sum(X[(a.id, t.id)] for t in time_slots) == a.weekly_periods)
        
        # Link X with Y or Z
        for t in time_slots:
            if not a.is_lab:
                model.Add(X[(a.id, t.id)] == sum(Y[(a.id, t.id, r.id)] for r in rooms))
            else:
                model.Add(X[(a.id, t.id)] == sum(Z[(a.id, t.id, l.id)] for l in labs))

    # 2. Class conflict: A class cannot have two subjects at the same time
    class_assignments = {}
    for a in assignments:
        class_assignments.setdefault(a.class_id, []).append(a)
    
    for t in time_slots:
        for class_id, asgns in class_assignments.items():
            model.AddAtMostOne(X[(a.id, t.id)] for a in asgns)

    # 3. Teacher conflict: A teacher cannot teach two classes simultaneously
    teacher_vars = {}
    for t in time_slots:
        for a in assignments:
            teachers = [a.teacher_id] + a.assistant_ids
            for tr in teachers:
                if tr not in teacher_vars:
                    teacher_vars[tr] = {}
                if t.id not in teacher_vars[tr]:
                    teacher_vars[tr][t.id] = []
                teacher_vars[tr][t.id].append(X[(a.id, t.id)])
                
    for tr, time_vars in teacher_vars.items():
        for t_id, vars_list in time_vars.items():
            model.AddAtMostOne(vars_list)

    # 4. Room conflict: A room cannot host two classes simultaneously
    for t in time_slots:
        for r in rooms:
            model.AddAtMostOne(Y[(a.id, t.id, r.id)] for a in assignments if not a.is_lab)

    # 5. Lab conflict: A lab cannot host two sessions simultaneously
    for t in time_slots:
        for l in labs:
            model.AddAtMostOne(Z[(a.id, t.id, l.id)] for a in assignments if a.is_lab)

    # 6. Lab sessions occupy 2 consecutive periods
    # Group time slots by day
    days = {}
    for t in time_slots:
        days.setdefault(t.day, []).append(t)
        
    for day_slots in days.values():
        day_slots.sort(key=lambda x: x.period)
        
    for a in assignments:
        if a.is_lab:
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    # A lab cannot start on the last period of the day or before a break if consecutive
                    if i == len(slots) - 1 or slots[i+1].period != t.period + 1:
                        # Cannot start a lab block here
                        # Actually OR-tools doesn't easily let us say "if X=1 then next X=1".
                        # A better way: define a starting variable for 2-hour blocks.
                        pass
                        
    # Better implementation for 2-hour labs:
    # We create a new boolean variable for "Lab starts at t"
    # lab_start[(a, t)]
    lab_starts = {}
    for a in assignments:
        if a.is_lab:
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    lab_starts[(a.id, t.id)] = model.NewBoolVar(f"lab_start_a{a.id}_t{t.id}")
                    
            # A lab is running at t if it started at t or t-1
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    prev_start = lab_starts[(a.id, slots[i-1].id)] if i > 0 and slots[i-1].period == t.period - 1 else 0
                    curr_start = lab_starts[(a.id, t.id)]
                    model.Add(X[(a.id, t.id)] == (prev_start + curr_start))
                    
                    # Cannot start at the last slot if no next slot or next slot is not contiguous
                    if i == len(slots) - 1 or slots[i+1].period != t.period + 1:
                        model.Add(curr_start == 0)
                        
            # Same lab room must be used for both slots
            for l in labs:
                for day, slots in days.items():
                    for i in range(len(slots) - 1):
                        if slots[i+1].period == slots[i].period + 1:
                            t1 = slots[i].id
                            t2 = slots[i+1].id
                            # If lab starts at t1, Z at t1 and t2 must be equal to 1 for some l
                            start_var = lab_starts[(a.id, t1)]
                            model.AddImplication(start_var, Z[(a.id, t1, l.id)] == Z[(a.id, t2, l.id)])
""",

    "app/scheduler/generator.py": """\
from sqlalchemy.orm import Session
from app.models import AcademicYear, Semester, ClassModel, Subject, Teacher, Assignment, Room, Lab, TimeSlot, Timetable, TimetableEntry
from app.scheduler.models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from app.scheduler.solver import TimetableSolver
from fastapi import HTTPException

def generate_timetable_for_semester(db: Session, academic_year_id: int, semester_type: str):
    # 1. Load data
    semesters = db.query(Semester).filter(Semester.academic_year_id == academic_year_id, Semester.semester_type == semester_type).all()
    if not semesters:
        raise HTTPException(status_code=400, detail="No semesters found for given configuration")
    semester_ids = [s.id for s in semesters]
    
    classes = db.query(ClassModel).filter(ClassModel.semester_id.in_(semester_ids), ClassModel.is_active == True).all()
    if not classes:
        raise HTTPException(status_code=400, detail="No active classes found for this semester type")
    class_ids = [c.id for c in classes]
    
    assignments = db.query(Assignment).filter(Assignment.class_id.in_(class_ids)).all()
    if not assignments:
        raise HTTPException(status_code=400, detail="No assignments found for the classes")
        
    time_slots = db.query(TimeSlot).all()
    if not time_slots:
        raise HTTPException(status_code=400, detail="No time slots configured")
        
    rooms = db.query(Room).filter(Room.status == "ACTIVE").all()
    labs = db.query(Lab).filter(Lab.status == "ACTIVE").all()
    if not rooms and not labs:
        raise HTTPException(status_code=400, detail="No active rooms or labs found")

    # 2. Build internal structures
    sched_slots = [SchedTimeSlot(id=t.id, day=t.day, period=t.period_number, is_break=t.is_break) for t in time_slots]
    sched_rooms = [SchedRoom(id=r.id) for r in rooms]
    sched_labs = [SchedLab(id=l.id) for l in labs]
    
    sched_assignments = []
    for a in assignments:
        subj = a.subject
        assistants = [x for x in [a.lab_assistant_1_id, a.lab_assistant_2_id] if x]
        sched_assignments.append(SchedAssignment(
            id=a.id,
            class_id=a.class_id,
            subject_id=a.subject_id,
            teacher_id=a.teacher_id,
            assistant_ids=assistants,
            is_lab=(subj.subject_type == "LAB"),
            weekly_periods=subj.weekly_hours
        ))

    # 3. Solve
    solver = TimetableSolver(sched_slots, sched_assignments, sched_rooms, sched_labs)
    result = solver.solve()
    
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail="Constraints are unsatisfiable. Cannot generate a valid timetable.")
        
    # 4. Save to DB
    tt = Timetable(
        department_id=classes[0].department_id, # Simplified
        academic_year_id=academic_year_id,
        semester_type=semester_type,
        status="GENERATED"
    )
    db.add(tt)
    db.flush()
    
    # Map back time slot id to day/period
    ts_map = {t.id: t for t in time_slots}
    # Map assignment id to Assignment
    asgn_map = {a.id: a for a in assignments}
    
    # For labs, we need to group 2-hour blocks into 1 entry with duration=2
    # To keep it simple, we can just save two 1-hour entries or group them.
    # TRD says "duration = 2". Let's group them.
    entries_data = result["entries"]
    
    # Simple grouping for labs
    lab_entries = [e for e in entries_data if e["is_lab"]]
    theory_entries = [e for e in entries_data if not e["is_lab"]]
    
    # Sort lab entries by assignment and period to easily group
    lab_entries.sort(key=lambda x: (x["assignment_id"], ts_map[x["time_slot_id"]].day, ts_map[x["time_slot_id"]].period_number))
    
    grouped_lab_entries = []
    skip = False
    for i in range(len(lab_entries)):
        if skip:
            skip = False
            continue
        e = lab_entries[i]
        # Check if next is consecutive
        if i + 1 < len(lab_entries):
            nxt = lab_entries[i+1]
            t1 = ts_map[e["time_slot_id"]]
            t2 = ts_map[nxt["time_slot_id"]]
            if e["assignment_id"] == nxt["assignment_id"] and t1.day == t2.day and t1.period_number + 1 == t2.period_number:
                # Grouped
                grouped_lab_entries.append({**e, "duration": 2})
                skip = True
                continue
        grouped_lab_entries.append({**e, "duration": 1}) # Fallback, should not happen

    final_entries = theory_entries + grouped_lab_entries
    
    for e in final_entries:
        a = asgn_map[e["assignment_id"]]
        ts = ts_map[e["time_slot_id"]]
        db_entry = TimetableEntry(
            timetable_id=tt.id,
            class_id=e["class_id"],
            subject_id=e["subject_id"],
            teacher_id=e["teacher_id"],
            lab_assistant_1_id=a.lab_assistant_1_id,
            lab_assistant_2_id=a.lab_assistant_2_id,
            room_id=e["room_id"],
            lab_id=e["lab_id"],
            day=ts.day,
            period=ts.period_number,
            duration=e.get("duration", 1),
            entry_type=a.subject.subject_type
        )
        db.add(db_entry)
        
    db.commit()
    return tt
""",

    "app/scheduler/validators.py": """\
# Validators for pre/post checks (optional, reserved for future use)
def validate_timetable(entries):
    pass
""",

    "app/api/routes/timetables.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Timetable
from app.schemas.timetable import TimetableCreate, TimetableResponse
from app.scheduler.generator import generate_timetable_for_semester
from pydantic import BaseModel

router = APIRouter()

class GenerateRequest(BaseModel):
    academic_year_id: int
    semester_type: str

@router.post("/", response_model=TimetableResponse)
def create_timetable(tt: TimetableCreate, db: Session = Depends(get_db)):
    db_tt = Timetable(**tt.model_dump())
    db.add(db_tt)
    db.commit()
    db.refresh(db_tt)
    return db_tt

@router.get("/", response_model=list[TimetableResponse])
def get_timetables(db: Session = Depends(get_db)):
    return db.query(Timetable).all()

@router.post("/generate")
def generate_timetable(req: GenerateRequest, db: Session = Depends(get_db)):
    tt = generate_timetable_for_semester(db, req.academic_year_id, req.semester_type)
    return {
        "status": "success",
        "timetable_id": tt.id,
        "classes": [] # simplified response for now
    }
""",

    "tests/test_scheduler.py": """\
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

"""
}

for path, content in FILES.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated scheduler files.")
