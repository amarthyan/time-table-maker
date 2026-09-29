from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import departments, academic_years, semesters, classes, teachers, subjects, assignments, rooms, labs, time_slots, timetables, users

app = FastAPI(
    title="College Timetable Management System API",
    description="Backend API for the College Timetable Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(academic_years.router, prefix="/api/academic-years", tags=["Academic Years"])
app.include_router(semesters.router, prefix="/api/semesters", tags=["Semesters"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Subjects"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(time_slots.router, prefix="/api/time-slots", tags=["Time Slots"])
app.include_router(timetables.router, prefix="/api/timetables", tags=["Timetables"])
