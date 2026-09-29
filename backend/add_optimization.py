import os

BASE_DIR = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\backend"

CONFIG_PATCH = """
    # Scheduler optimization settings
    MINIMIZE_CLASS_GAPS: bool = True
    BALANCE_SUBJECTS: bool = True
    BALANCE_TEACHER_WORKLOAD: bool = True
    MAX_SOLVER_TIME_SECONDS: int = 30
"""

OBJECTIVE_PY = """\
from app.core.config import settings

def apply_soft_constraints(solver):
    model = solver.model
    X = solver.X
    time_slots = [t for t in solver.time_slots if not t.is_break]
    assignments = solver.assignments
    
    # We define weights
    WEIGHT_GAP = 10
    WEIGHT_MULTIPLE_SESSIONS = 5
    WEIGHT_TEACHER_OVERLOAD = 5
    
    penalties = []
    
    # Organize slots by day
    days = {}
    for t in time_slots:
        days.setdefault(t.day, []).append(t)
    for d in days:
        days[d].sort(key=lambda x: x.period)
        
    # Group assignments by class
    classes = {}
    for a in assignments:
        classes.setdefault(a.class_id, []).append(a)

    # 1. Minimize class gaps (empty periods between scheduled periods for a class)
    # For a class on a given day, a gap happens if it has class at t1 and t3, but not at t2
    if settings.MINIMIZE_CLASS_GAPS:
        for c_id, asgns in classes.items():
            for day, slots in days.items():
                if len(slots) < 3: continue
                # is_active[t] = 1 if any subject is scheduled at slot t for class c_id
                is_active = []
                for t in slots:
                    act = model.NewBoolVar(f"class_{c_id}_{day}_t{t.id}_active")
                    # act == 1 if sum(X[(a.id, t.id)]) > 0
                    model.AddMaxEquality(act, [X[(a.id, t.id)] for a in asgns])
                    is_active.append(act)
                
                # Gap at index i (0 < i < len-1): active at i-1, not active at i, active at i+1
                for i in range(1, len(slots) - 1):
                    gap_var = model.NewBoolVar(f"gap_c{c_id}_{day}_{i}")
                    # gap_var is 1 if (is_active[i-1]==1 and is_active[i]==0 and is_active[i+1]==1)
                    # We can use a linear constraint: gap_var >= is_active[i-1] + (1 - is_active[i]) + is_active[i+1] - 2
                    model.Add(gap_var >= is_active[i-1] - is_active[i] + is_active[i+1] - 1)
                    # We penalize gap_var
                    penalties.append(WEIGHT_GAP * gap_var)
                    
    # 2. Distribute weekly classes
    # Avoid putting > 1 session of the same subject on one day
    if settings.BALANCE_SUBJECTS:
        for a in assignments:
            if a.weekly_periods <= 1 or a.is_lab: continue
            for day, slots in days.items():
                sessions_on_day = sum(X[(a.id, t.id)] for t in slots)
                # We want to penalize sessions_on_day > 1
                # diff = max(0, sessions_on_day - 1)
                diff = model.NewIntVar(0, len(slots), f"diff_subj_a{a.id}_{day}")
                model.Add(diff >= sessions_on_day - 1)
                penalties.append(WEIGHT_MULTIPLE_SESSIONS * diff)

    # 3. Teacher workload distribution
    if settings.BALANCE_TEACHER_WORKLOAD:
        # Group by teacher
        teacher_assignments = {}
        for a in assignments:
            for tr in [a.teacher_id] + a.assistant_ids:
                teacher_assignments.setdefault(tr, []).append(a)
                
        for tr_id, asgns in teacher_assignments.items():
            for day, slots in days.items():
                daily_load = sum(X[(a.id, t.id)] for a in asgns for t in slots)
                # Penalize if daily load > 4
                overload = model.NewIntVar(0, len(slots), f"overload_tr{tr_id}_{day}")
                model.Add(overload >= daily_load - 4)
                penalties.append(WEIGHT_TEACHER_OVERLOAD * overload)

    if penalties:
        model.Minimize(sum(penalties))
"""

SOLVER_PY = """\
from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from .constraints import apply_hard_constraints
from .objective import apply_soft_constraints
from app.core.config import settings

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
        
        self.X = {}
        self.Y = {}
        self.Z = {}
        
        self._create_variables()
        apply_hard_constraints(self)
        apply_soft_constraints(self)

    def _create_variables(self):
        for a in self.assignments:
            for t in self.time_slots:
                if t.is_break:
                    continue
                self.X[(a.id, t.id)] = self.model.NewBoolVar(f"x_a{a.id}_t{t.id}")
                if not a.is_lab:
                    for r in self.rooms:
                        self.Y[(a.id, t.id, r.id)] = self.model.NewBoolVar(f"y_a{a.id}_t{t.id}_r{r.id}")
                else:
                    for l in self.labs:
                        self.Z[(a.id, t.id, l.id)] = self.model.NewBoolVar(f"z_a{a.id}_t{t.id}_l{l.id}")

    def solve(self):
        solver = cp_model.CpSolver()
        if hasattr(settings, 'MAX_SOLVER_TIME_SECONDS'):
            solver.parameters.max_time_in_seconds = float(settings.MAX_SOLVER_TIME_SECONDS)
        
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
            
            status_str = "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"
            return {"status": "success", "solver_status": status_str, "entries": result}
        else:
            status_str = "INFEASIBLE" if status == cp_model.INFEASIBLE else "UNKNOWN"
            return {"status": "unsatisfiable", "solver_status": status_str, "entries": []}
"""

TEST_OPTIMIZATION = """\
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
"""

def update_config():
    cfg_path = os.path.join(BASE_DIR, "app/core/config.py")
    with open(cfg_path, "r", encoding="utf-8") as f:
        content = f.read()
    if "MINIMIZE_CLASS_GAPS" not in content:
        # Insert before model_config
        parts = content.split("model_config =")
        new_content = parts[0] + CONFIG_PATCH + "\n    model_config =" + parts[1]
        with open(cfg_path, "w", encoding="utf-8") as f:
            f.write(new_content)

FILES = {
    "app/scheduler/objective.py": OBJECTIVE_PY,
    "app/scheduler/solver.py": SOLVER_PY,
    "tests/test_optimization.py": TEST_OPTIMIZATION
}

update_config()

for path, content in FILES.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated optimization files successfully.")
