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
