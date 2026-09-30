import os
from convex import ConvexClient

class ConvexService:
    def __init__(self, token: str = None):
        url = os.environ.get("CONVEX_URL", "https://happy-animal-123.convex.cloud")
        self.client = ConvexClient(url)
        if token:
            self.client.set_auth(token)
        
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
