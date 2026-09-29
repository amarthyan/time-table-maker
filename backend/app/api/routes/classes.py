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
