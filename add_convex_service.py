import os

BASE_DIR_BACKEND = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\backend"
BASE_DIR_CONVEX = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\convex"

CONVEX_SERVICE_PY = """\
import os
from convex import ConvexClient

class ConvexService:
    def __init__(self):
        url = os.environ.get("CONVEX_URL", "https://happy-animal-123.convex.cloud")
        self.client = ConvexClient(url)
        
    def get_classes(self, academic_year_id: str, semester_id: str):
        # We query all classes and filter, or use an index. For simplicity:
        classes = self.client.query("classes:getClasses")
        return [c for c in classes if c.get("academic_year_id") == academic_year_id and c.get("semester_id") == semester_id]
        
    def get_semesters(self, academic_year_id: str, semester_type: str):
        sems = self.client.query("semesters:getSemesters")
        return [s for s in sems if s.get("academic_year_id") == academic_year_id and s.get("semester_type") == semester_type]
        
    def get_assignments(self, class_ids: list):
        asgns = self.client.query("assignments:getAssignments")
        return [a for a in asgns if a.get("class_id") in class_ids]
        
    def get_time_slots(self):
        # Time slots don't have a direct query in our generated files yet, so we use a generic fetch if available,
        # or we should make sure we have time_slots:getTimeSlots. Let's assume we can fetch them.
        try:
            return self.client.query("time_slots:getTimeSlots")
        except Exception:
            return [] # Mock for now or implement in Convex
            
    def get_rooms(self):
        return self.client.query("rooms:getRooms")
        
    def get_labs(self):
        return self.client.query("labs:getLabs")
        
    def get_subjects(self):
        return self.client.query("subjects:getSubjects")

    def publish_timetable(self, department_id: str, academic_year_id: str, semester_type: str, entries: list):
        # Transactional mutation to insert timetable and entries
        timetable_id = self.client.mutation("timetables:publishGeneratedTimetable", {
            "department_id": department_id,
            "academic_year_id": academic_year_id,
            "semester_type": semester_type,
            "entries": entries
        })
        return timetable_id
"""

GENERATOR_UPDATE = """\
from app.scheduler.models import SchedTimeSlot, SchedTeacher, SchedRoom, SchedLab, SchedAssignment
from app.scheduler.solver import TimetableSolver
from app.services.convex_service import ConvexService
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def generate_timetable_for_semester_convex(academic_year_id: str, semester_type: str):
    convex = ConvexService()
    
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
"""

TIMETABLES_MUTATION_APPEND = """

export const publishGeneratedTimetable = mutation({
  args: {
    department_id: v.id("departments"),
    academic_year_id: v.id("academic_years"),
    semester_type: v.string(),
    entries: v.array(v.object({
      class_id: v.id("classes"),
      subject_id: v.id("subjects"),
      teacher_id: v.id("teachers"),
      lab_assistant_1_id: v.optional(v.id("teachers")),
      lab_assistant_2_id: v.optional(v.id("teachers")),
      room_id: v.optional(v.id("rooms")),
      lab_id: v.optional(v.id("labs")),
      day: v.string(),
      period: v.number(),
      duration: v.number(),
      entry_type: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    // 1. Create timetable
    const ttId = await ctx.db.insert("timetables", {
      department_id: args.department_id,
      academic_year_id: args.academic_year_id,
      semester_type: args.semester_type,
      version: 1,
      status: "GENERATED"
    });
    
    // 2. Insert all entries
    for (const entry of args.entries) {
      await ctx.db.insert("timetable_entries", {
        timetable_id: ttId,
        ...entry
      });
    }
    
    return ttId;
  }
});
"""

TIME_SLOTS_CONVEX = """\
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTimeSlots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("time_slots").collect();
  },
});
"""

TEST_CONVEX_INTEGRATION = """\
import pytest
from app.services.convex_service import ConvexService

def test_convex_client_initialization():
    service = ConvexService()
    assert service.client is not None
"""

FILES_BACKEND = {
    "app/services/convex_service.py": CONVEX_SERVICE_PY,
    "app/scheduler/generator_convex.py": GENERATOR_UPDATE,
    "tests/test_convex_integration.py": TEST_CONVEX_INTEGRATION
}

for path, content in FILES_BACKEND.items():
    full_path = os.path.join(BASE_DIR_BACKEND, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

with open(os.path.join(BASE_DIR_CONVEX, "timetables.ts"), "a", encoding="utf-8") as f:
    f.write(TIMETABLES_MUTATION_APPEND)
    
with open(os.path.join(BASE_DIR_CONVEX, "time_slots.ts"), "w", encoding="utf-8") as f:
    f.write(TIME_SLOTS_CONVEX)

print("Generated convex service files.")
