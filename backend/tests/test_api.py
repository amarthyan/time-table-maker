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
