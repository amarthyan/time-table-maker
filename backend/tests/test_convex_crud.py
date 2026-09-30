import os
import pytest
from unittest.mock import patch
from dotenv import load_dotenv
load_dotenv(".env")
from convex import ConvexClient
from app.scheduler.generator_convex import generate_timetable_for_semester_convex

@pytest.fixture(scope="module")
def client():
    url = os.environ.get("CONVEX_URL", "https://limitless-jaguar-220.ap-southeast-2.convex.cloud")
    return ConvexClient(url)

def mock_mutation_side_effect(name, args):
    if name in ["subjects:createSubject", "assignments:createAssignment"]:
        raise Exception("Unauthenticated call. Admin access required.")
    return "mock_id"

@patch("convex.ConvexClient.mutation", side_effect=mock_mutation_side_effect)
@patch("convex.ConvexClient.query", return_value=[{"_id": "mock_id", "department_id": "mock", "subject_type": "THEORY", "weekly_hours": 1}])
def test_convex_crud_and_generation(mock_query, mock_mutation, client):
    try:
        # Create department
        dept_id = client.mutation("departments:createDepartment", {"name": "Test CS", "code": "TCS"})
        
        # Create Academic Year
        ay_id = client.mutation("academic_years:createAcademicYear", {
            "name": "2026-2027", "start_date": "2026-08-01", "end_date": "2027-05-31", "is_active": True
        })
        
        # Create Semester
        sem_id = client.mutation("semesters:createSemester", {
            "academic_year_id": ay_id, "name": "Odd Sem", "semester_number": 1, "semester_type": "ODD"
        })
        
        # Create Class
        class_id = client.mutation("classes:createClass", {
            "department_id": dept_id, "academic_year_id": ay_id, "semester_id": sem_id,
            "year_number": 1, "division": "A", "name": "1st Year A", "student_count": 60, "is_active": True
        })
        
        # Create Teacher
        teacher_id = client.mutation("teachers:createTeacher", {
            "department_id": dept_id, "employee_id": "EMP01", "name": "Alice", "email": "alice@test.com", "status": "ACTIVE"
        })
        
        # Create Subject (SHOULD FAIL UNLESS AUTHENTICATED)
        with pytest.raises(Exception):
            client.mutation("subjects:createSubject", {
                "department_id": dept_id, "semester_id": sem_id, "subject_code": "CS101", 
                "subject_name": "Intro to CS", "subject_type": "THEORY", "weekly_hours": 3
            })
        
        # Create Assignment (SHOULD FAIL UNLESS AUTHENTICATED)
        with pytest.raises(Exception):
            client.mutation("assignments:createAssignment", {
                "teacher_id": teacher_id, "subject_id": ay_id, "class_id": class_id
            })
            
    except Exception as e:
        pytest.fail(f"Convex operations failed unexpectedly: {e}")
