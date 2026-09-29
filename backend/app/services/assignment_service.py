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
