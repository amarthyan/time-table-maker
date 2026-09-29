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
