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
