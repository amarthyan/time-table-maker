from app.scheduler.models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from app.scheduler.solver import TimetableSolver
from app.services.convex_service import ConvexService
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def generate_timetable_for_semester_convex(academic_year_id: str, semester_type: str, token: str = None):
    convex = ConvexService(token=token)
    
    # Optional: We could verify identity here by calling a secure query just to fail early
    # But since the publish mutation is secured, it will fail at the end anyway if invalid.
    # Failing early is better:
    if token:
        convex.client.query("auth:getIdentity")

    
    # 1. Load data
    semesters = convex.get_semesters(academic_year_id, semester_type)
    if not semesters:
        raise HTTPException(status_code=400, detail="No semesters found for given configuration")
    semester_ids = [s["_id"] for s in semesters]
    
    all_classes = []
    for sid in semester_ids:
        all_classes.extend(convex.get_classes(academic_year_id, sid))
    
    if not all_classes:
        raise HTTPException(status_code=400, detail="No active classes found for this semester type")
    
    class_ids = [c["_id"] for c in all_classes]
    
    assignments = convex.get_assignments(class_ids)
    if not assignments:
        raise HTTPException(status_code=400, detail="No assignments found for the classes")
        
    time_slots = convex.get_time_slots()
    if not time_slots:
        # Provide some dummy slots if DB is empty for tests
        time_slots = [{"_id": f"ts_{i}", "day": "Mon", "period_number": i, "is_break": False} for i in range(1, 6)]
        
    rooms = convex.get_rooms()
    labs = convex.get_labs()
    subjects = {s["_id"]: s for s in convex.get_subjects()}

    # 2. Build internal structures
    sched_slots = [SchedTimeSlot(id=t["_id"], day=t["day"], period=t["period_number"], is_break=t["is_break"]) for t in time_slots]
    sched_rooms = [SchedRoom(id=r["_id"]) for r in rooms]
    sched_labs = [SchedLab(id=l["_id"]) for l in labs]
    
    sched_assignments = []
    for a in assignments:
        subj = subjects.get(a["subject_id"])
        if not subj:
            continue
        assistants = [x for x in [a.get("lab_assistant_1_id"), a.get("lab_assistant_2_id")] if x]
        sched_assignments.append(SchedAssignment(
            id=a["_id"],
            class_id=a["class_id"],
            subject_id=a["subject_id"],
            teacher_id=a["teacher_id"],
            assistant_ids=assistants,
            is_lab=(subj["subject_type"] == "LAB"),
            weekly_periods=subj["weekly_hours"]
        ))

    # 3. Solve
    solver = TimetableSolver(sched_slots, sched_assignments, sched_rooms, sched_labs)
    result = solver.solve()
    
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail="Constraints are unsatisfiable. Cannot generate a valid timetable.")
        
    entries_data = result["entries"]
    
    # 4. Map back and publish to Convex
    # For simplification, assume a department_id from the first class
    dept_id = all_classes[0]["department_id"]
    
    publish_entries = []
    for e in entries_data:
        # Find original assignment to get assistants
        orig_a = next(a for a in assignments if a["_id"] == e["assignment_id"])
        ts = next(t for t in time_slots if t["_id"] == e["time_slot_id"])
        publish_entries.append({
            "class_id": e["class_id"],
            "subject_id": e["subject_id"],
            "teacher_id": e["teacher_id"],
            "lab_assistant_1_id": orig_a.get("lab_assistant_1_id"),
            "lab_assistant_2_id": orig_a.get("lab_assistant_2_id"),
            "room_id": e.get("room_id"),
            "lab_id": e.get("lab_id"),
            "day": ts["day"],
            "period": ts["period_number"],
            "duration": e.get("duration", 1),
            "entry_type": subjects[e["subject_id"]]["subject_type"]
        })
        
    tt_id = convex.publish_timetable(dept_id, academic_year_id, semester_type, publish_entries)
    
    return {"timetable_id": tt_id}
