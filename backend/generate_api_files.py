import os

BASE_DIR = r"c:\Users\Rohith Roblelal\Desktop\projects\time-table-maker\backend"

FILES = {
    "app/main.py": """\
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
""",
    "app/api/routes/__init__.py": "",
    
    "app/api/routes/users.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Note: Password hashing should be done here in real app
    new_user = User(name=user.name, email=user.email, password_hash=user.password, role=user.role, is_active=user.is_active)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()
""",
    
    "app/api/routes/departments.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Department
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate

router = APIRouter()

@router.post("/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    if db.query(Department).filter((Department.name == dept.name) | (Department.code == dept.code)).first():
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")
    db_dept = Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.put("/{id}", response_model=DepartmentResponse)
def update_department(id: int, dept: DepartmentUpdate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in dept.model_dump(exclude_unset=True).items():
        setattr(db_dept, k, v)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{id}")
def delete_department(id: int, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(db_dept)
    db.commit()
    return {"message": "Deleted successfully"}
""",

    "app/api/routes/academic_years.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import AcademicYear
from app.schemas.academic_year import AcademicYearCreate, AcademicYearResponse, AcademicYearUpdate

router = APIRouter()

@router.post("/", response_model=AcademicYearResponse)
def create_academic_year(year: AcademicYearCreate, db: Session = Depends(get_db)):
    if db.query(AcademicYear).filter(AcademicYear.name == year.name).first():
        raise HTTPException(status_code=400, detail="Academic year already exists")
    db_year = AcademicYear(**year.model_dump())
    db.add(db_year)
    db.commit()
    db.refresh(db_year)
    return db_year

@router.get("/", response_model=list[AcademicYearResponse])
def get_academic_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).all()

@router.put("/{id}", response_model=AcademicYearResponse)
def update_academic_year(id: int, year: AcademicYearUpdate, db: Session = Depends(get_db)):
    db_year = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not db_year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    for k, v in year.model_dump(exclude_unset=True).items():
        setattr(db_year, k, v)
    db.commit()
    db.refresh(db_year)
    return db_year
""",

    "app/api/routes/semesters.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Semester, AcademicYear
from app.schemas.semester import SemesterCreate, SemesterResponse, SemesterUpdate

router = APIRouter()

@router.post("/", response_model=SemesterResponse)
def create_semester(sem: SemesterCreate, db: Session = Depends(get_db)):
    if not db.query(AcademicYear).filter(AcademicYear.id == sem.academic_year_id).first():
        raise HTTPException(status_code=400, detail="Academic year not found")
    if db.query(Semester).filter(Semester.academic_year_id == sem.academic_year_id, Semester.name == sem.name).first():
        raise HTTPException(status_code=400, detail="Semester already exists in this academic year")
    db_sem = Semester(**sem.model_dump())
    db.add(db_sem)
    db.commit()
    db.refresh(db_sem)
    return db_sem

@router.get("/", response_model=list[SemesterResponse])
def get_semesters(db: Session = Depends(get_db)):
    return db.query(Semester).all()

@router.get("/{id}", response_model=SemesterResponse)
def get_semester(id: int, db: Session = Depends(get_db)):
    sem = db.query(Semester).filter(Semester.id == id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    return sem
""",

    "app/api/routes/classes.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import ClassModel, Department, AcademicYear, Semester
from app.schemas.class_model import ClassModelCreate, ClassModelResponse, ClassModelUpdate

router = APIRouter()

@router.post("/", response_model=ClassModelResponse)
def create_class(cls: ClassModelCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == cls.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if not db.query(AcademicYear).filter(AcademicYear.id == cls.academic_year_id).first():
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    sem = db.query(Semester).filter(Semester.id == cls.semester_id).first()
    if not sem:
        raise HTTPException(status_code=400, detail="Semester not found")
    if sem.academic_year_id != cls.academic_year_id:
        raise HTTPException(status_code=400, detail="Semester does not belong to the selected academic year")

    if db.query(ClassModel).filter(ClassModel.department_id == cls.department_id, ClassModel.academic_year_id == cls.academic_year_id, ClassModel.name == cls.name).first():
        raise HTTPException(status_code=400, detail="Class already exists")
        
    db_class = ClassModel(**cls.model_dump())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.get("/", response_model=list[ClassModelResponse])
def get_classes(db: Session = Depends(get_db)):
    return db.query(ClassModel).all()

@router.get("/{id}", response_model=ClassModelResponse)
def get_class(id: int, db: Session = Depends(get_db)):
    cls = db.query(ClassModel).filter(ClassModel.id == id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls

@router.put("/{id}", response_model=ClassModelResponse)
def update_class(id: int, cls: ClassModelUpdate, db: Session = Depends(get_db)):
    db_cls = db.query(ClassModel).filter(ClassModel.id == id).first()
    if not db_cls:
        raise HTTPException(status_code=404, detail="Class not found")
    for k, v in cls.model_dump(exclude_unset=True).items():
        setattr(db_cls, k, v)
    db.commit()
    db.refresh(db_cls)
    return db_cls
""",

    "app/api/routes/teachers.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Teacher, Department
from app.schemas.teacher import TeacherCreate, TeacherResponse, TeacherUpdate

router = APIRouter()

@router.post("/", response_model=TeacherResponse)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == teacher.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if db.query(Teacher).filter((Teacher.email == teacher.email) | (Teacher.employee_id == teacher.employee_id)).first():
        raise HTTPException(status_code=400, detail="Teacher with this email or employee ID already exists")
    db_teacher = Teacher(**teacher.model_dump())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.get("/", response_model=list[TeacherResponse])
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

@router.get("/{id}", response_model=TeacherResponse)
def get_teacher(id: int, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return t
""",

    "app/api/routes/subjects.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Subject, Department, Semester
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate

router = APIRouter()

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == subject.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if not db.query(Semester).filter(Semester.id == subject.semester_id).first():
        raise HTTPException(status_code=400, detail="Semester not found")
    if db.query(Subject).filter(Subject.subject_code == subject.subject_code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
        
    db_subject = Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/", response_model=list[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.get("/{id}", response_model=SubjectResponse)
def get_subject(id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    return s
""",

    "app/services/assignment_service.py": """\
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Assignment, Teacher, Subject, ClassModel

def validate_assignment(db: Session, assignment_data):
    teacher = db.query(Teacher).filter(Teacher.id == assignment_data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="Teacher not found")
    
    subject = db.query(Subject).filter(Subject.id == assignment_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Subject not found")
        
    cls = db.query(ClassModel).filter(ClassModel.id == assignment_data.class_id).first()
    if not cls:
        raise HTTPException(status_code=400, detail="Class not found")
        
    # Validation: A subject must belong to the appropriate semester (which the class is in)
    if subject.semester_id != cls.semester_id:
        raise HTTPException(status_code=400, detail="Subject semester does not match class semester")
        
    # Lab rules
    if subject.subject_type == "LAB":
        assistants = [a for a in [assignment_data.lab_assistant_1_id, assignment_data.lab_assistant_2_id] if a is not None]
        if teacher.id in assistants:
            raise HTTPException(status_code=400, detail="Main teacher cannot also be a lab assistant")
        if len(assistants) == 2 and assistants[0] == assistants[1]:
            raise HTTPException(status_code=400, detail="Lab assistants must be unique")
            
        for ast_id in assistants:
            if not db.query(Teacher).filter(Teacher.id == ast_id).first():
                raise HTTPException(status_code=400, detail=f"Lab assistant {ast_id} not found")
    else:
        if assignment_data.lab_assistant_1_id or assignment_data.lab_assistant_2_id:
            raise HTTPException(status_code=400, detail="Non-lab subjects cannot have lab assistants")

    # Duplicate prevention
    existing = db.query(Assignment).filter(
        Assignment.teacher_id == assignment_data.teacher_id,
        Assignment.subject_id == assignment_data.subject_id,
        Assignment.class_id == assignment_data.class_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This assignment already exists")
""",

    "app/api/routes/assignments.py": """\
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services.assignment_service import validate_assignment

router = APIRouter()

@router.post("/", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db)):
    validate_assignment(db, assignment)
    db_assignment = Assignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(Assignment).all()
""",

    "app/api/routes/rooms.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Room, Department
from app.schemas.room import RoomCreate, RoomResponse

router = APIRouter()

@router.post("/", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == room.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    if db.query(Room).filter(Room.name == room.name).first():
        raise HTTPException(status_code=400, detail="Room already exists")
    db_room = Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/", response_model=list[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()
""",

    "app/api/routes/labs.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Lab, Department
from app.schemas.lab import LabCreate, LabResponse

router = APIRouter()

@router.post("/", response_model=LabResponse)
def create_lab(lab: LabCreate, db: Session = Depends(get_db)):
    if not db.query(Department).filter(Department.id == lab.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")
    
    # Validation: Only the configured three labs should be available. Max 3 check conceptually.
    if db.query(Lab).count() >= 3:
        raise HTTPException(status_code=400, detail="Maximum number of 3 labs reached")
        
    db_lab = Lab(**lab.model_dump())
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

@router.get("/", response_model=list[LabResponse])
def get_labs(db: Session = Depends(get_db)):
    return db.query(Lab).all()
""",

    "app/api/routes/time_slots.py": """\
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import TimeSlot
from app.schemas.time_slot import TimeSlotCreate, TimeSlotResponse

router = APIRouter()

@router.post("/", response_model=TimeSlotResponse)
def create_time_slot(slot: TimeSlotCreate, db: Session = Depends(get_db)):
    db_slot = TimeSlot(**slot.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

@router.get("/", response_model=list[TimeSlotResponse])
def get_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()
""",

    "app/api/routes/timetables.py": """\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Timetable, TimetableEntry
from app.schemas.timetable import TimetableCreate, TimetableResponse

router = APIRouter()

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
""",
    
    "tests/test_api.py": """\
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_create_department():
    response = client.post("/api/departments/", json={"name": "Computer Science", "code": "CS"})
    assert response.status_code == 200
    assert response.json()["code"] == "CS"
    
def test_create_academic_year():
    response = client.post("/api/academic-years/", json={"name": "2026-2027", "start_date": "2026-08-01", "end_date": "2027-05-31"})
    assert response.status_code == 200
    
def test_create_semester():
    response = client.post("/api/semesters/", json={"academic_year_id": 1, "name": "Odd 2026", "semester_number": 1, "semester_type": "ODD"})
    assert response.status_code == 200

def test_create_class():
    response = client.post("/api/classes/", json={
        "department_id": 1, "academic_year_id": 1, "semester_id": 1,
        "year_number": 1, "division": "A", "name": "1st Year A"
    })
    assert response.status_code == 200

def test_create_teacher_and_subject():
    client.post("/api/teachers/", json={"department_id": 1, "employee_id": "T01", "name": "John Doe", "email": "john@test.com"})
    client.post("/api/subjects/", json={"department_id": 1, "semester_id": 1, "subject_code": "CS101", "subject_name": "Programming", "subject_type": "THEORY", "weekly_hours": 4})
    
def test_valid_assignment():
    response = client.post("/api/assignments/", json={"teacher_id": 1, "subject_id": 1, "class_id": 1})
    assert response.status_code == 200
    
def test_invalid_lab_assignment_with_wrong_subject_type():
    client.post("/api/teachers/", json={"department_id": 1, "employee_id": "T02", "name": "Jane", "email": "jane@test.com"})
    # Theory subject with lab assistant should fail
    response = client.post("/api/assignments/", json={"teacher_id": 1, "subject_id": 1, "class_id": 1, "lab_assistant_1_id": 2})
    assert response.status_code == 400
    assert "cannot have lab assistants" in response.json()["detail"]
"""
}

for path, content in FILES.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Created all files successfully.")
