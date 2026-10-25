"""
Google OR-Tools CP-SAT Timetable Generation Engine
Formulates and solves simultaneous multi-cohort academic scheduling as an Integer Program.
"""

from ortools.sat.python import cp_model
from typing import List, Dict, Any, Tuple
import uuid

DAYS = [1, 2, 3, 4, 5, 6]  # Monday to Saturday
PERIODS = [1, 2, 3, 4, 5, 6]  # 6 periods per day

class TimetableScheduler:
    def __init__(
        self,
        classes: List[Dict[str, Any]],
        subjects: List[Dict[str, Any]],
        teachers: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]],
        rooms: List[Dict[str, Any]],
        labs: List[Dict[str, Any]],
    ):
        self.classes = classes
        self.subjects = {s.get("_id", s.get("id")): s for s in subjects}
        self.teachers = {t.get("_id", t.get("id")): t for t in teachers}
        self.assignments = assignments
        self.rooms = rooms
        self.labs = labs

    def solve(self) -> List[Dict[str, Any]]:
        """
        Builds CP-SAT model and searches for a feasible zero-clash schedule.
        Returns list of timetable entry dictionaries.
        """
        model = cp_model.CpModel()

        # Build Session Units from assignments
        # Each assignment specifies (class, subject, teacher)
        session_units = []
        unit_idx = 0

        for a in self.assignments:
            subj_id = a.get("subject_id") or a.get("subjectId")
            class_id = a.get("class_id") or a.get("classId")
            teacher_id = a.get("teacher_id") or a.get("teacherId")
            asst1_id = a.get("lab_assistant_1_id") or a.get("assistant1Id")
            asst2_id = a.get("lab_assistant_2_id") or a.get("assistant2Id")

            subject = self.subjects.get(subj_id, {})
            is_lab = subject.get("subject_type") == "LAB" or subject.get("type") == "LAB"
            duration = 2 if is_lab else 1
            weekly_hours = int(subject.get("weekly_hours", subject.get("weeklyHours", 3)))

            # Number of sessions: Labs are usually 1 session of 2 hrs; theory is weekly_hours sessions of 1 hr
            num_sessions = 1 if is_lab else max(1, weekly_hours)

            for s_num in range(num_sessions):
                unit = {
                    "unit_id": f"unit_{unit_idx}",
                    "assignment_id": a.get("_id", str(uuid.uuid4())),
                    "class_id": class_id,
                    "subject_id": subj_id,
                    "teacher_id": teacher_id,
                    "lab_assistant_1_id": asst1_id,
                    "lab_assistant_2_id": asst2_id,
                    "duration": duration,
                    "entry_type": "LAB" if is_lab else "THEORY",
                    "session_num": s_num,
                }
                session_units.append(unit)
                unit_idx += 1

        # Decision Variables:
        # x[u, d, p] = 1 if unit u starts on day d at period p
        x = {}
        for u in session_units:
            u_id = u["unit_id"]
            dur = u["duration"]
            max_start_period = 6 - dur + 1  # 5 for 2-hour labs, 6 for 1-hour theory
            for d in DAYS:
                for p in range(1, max_start_period + 1):
                    x[(u_id, d, p)] = model.NewBoolVar(f"x_{u_id}_{d}_{p}")

        # Constraint 1: Exactly one slot allocated per session unit
        for u in session_units:
            u_id = u["unit_id"]
            dur = u["duration"]
            max_start_period = 6 - dur + 1
            model.Add(
                sum(x[(u_id, d, p)] for d in DAYS for p in range(1, max_start_period + 1)) == 1
            )

        # Helper to get variable for whether unit u occupies slot (d, p)
        def unit_occupies(u, d, p):
            u_id = u["unit_id"]
            dur = u["duration"]
            terms = []
            for start_p in range(max(1, p - dur + 1), p + 1):
                if (u_id, d, start_p) in x:
                    terms.append(x[(u_id, d, start_p)])
            return terms

        # Constraint 2: Class clash prevention (a class cannot have 2 subjects at same day & period)
        classes_map = {}
        for u in session_units:
            classes_map.setdefault(u["class_id"], []).append(u)

        for c_id, units in classes_map.items():
            for d in DAYS:
                for p in PERIODS:
                    active_terms = []
                    for u in units:
                        active_terms.extend(unit_occupies(u, d, p))
                    if len(active_terms) > 1:
                        model.Add(sum(active_terms) <= 1)

        # Constraint 3: Teacher clash prevention (a teacher cannot be in 2 places at same day & period)
        teachers_map = {}
        for u in session_units:
            if u["teacher_id"]:
                teachers_map.setdefault(u["teacher_id"], []).append(u)
            # Assistants also cannot clash
            if u.get("lab_assistant_1_id"):
                teachers_map.setdefault(u["lab_assistant_1_id"], []).append(u)
            if u.get("lab_assistant_2_id"):
                teachers_map.setdefault(u["lab_assistant_2_id"], []).append(u)

        for t_id, units in teachers_map.items():
            for d in DAYS:
                for p in PERIODS:
                    active_terms = []
                    for u in units:
                        active_terms.extend(unit_occupies(u, d, p))
                    if len(active_terms) > 1:
                        model.Add(sum(active_terms) <= 1)

        # Constraint 4: Lab room clash prevention
        # Distribute lab units among available lab facilities
        lab_units = [u for u in session_units if u["entry_type"] == "LAB"]
        num_labs = max(1, len(self.labs))
        for d in DAYS:
            for p in PERIODS:
                active_labs = []
                for u in lab_units:
                    active_labs.extend(unit_occupies(u, d, p))
                if len(active_labs) > num_labs:
                    model.Add(sum(active_labs) <= num_labs)

        # Solve model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        solver.parameters.num_search_workers = 4
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            raise ValueError("Solver could not find a feasible timetable under current constraints.")

        # Extract solution
        generated_entries = []
        assigned_labs_counter = {}
        assigned_rooms_counter = {}

        for u in session_units:
            u_id = u["unit_id"]
            dur = u["duration"]
            max_start_period = 6 - dur + 1
            for d in DAYS:
                for p in range(1, max_start_period + 1):
                    if solver.Value(x[(u_id, d, p)]) == 1:
                        # Allocate room or lab
                        room_id = None
                        lab_id = None
                        if u["entry_type"] == "LAB":
                            if self.labs:
                                lab_idx = assigned_labs_counter.get((d, p), 0) % len(self.labs)
                                assigned_labs_counter[(d, p)] = lab_idx + 1
                                lab_id = self.labs[lab_idx].get("_id", self.labs[lab_idx].get("id", f"lab_{lab_idx+1}"))
                        else:
                            if self.rooms:
                                room_idx = assigned_rooms_counter.get((d, p), 0) % len(self.rooms)
                                assigned_rooms_counter[(d, p)] = room_idx + 1
                                room_id = self.rooms[room_idx].get("_id", self.rooms[room_idx].get("id", f"room_{room_idx+1}"))
                            else:
                                room_id = f"Room-{u['class_id'][-3:] if len(u['class_id']) >= 3 else '101'}"

                        entry = {
                            "class_id": u["class_id"],
                            "subject_id": u["subject_id"],
                            "teacher_id": u["teacher_id"],
                            "lab_assistant_1_id": u.get("lab_assistant_1_id"),
                            "lab_assistant_2_id": u.get("lab_assistant_2_id"),
                            "room_id": room_id,
                            "lab_id": lab_id,
                            "day": d,
                            "period": p,
                            "duration": dur,
                            "entry_type": u["entry_type"],
                        }
                        generated_entries.append(entry)

        return generated_entries
