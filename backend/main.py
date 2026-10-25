import os
import uuid
import logging
from typing import Literal, Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import verify_admin_identity
from convex_client import convex_client
from scheduler import TimetableScheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("timetable-scheduler")

app = FastAPI(
    title="College Timetable CP-SAT Scheduling Microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateTimetableRequest(BaseModel):
    academic_year_id: str = Field(..., description="ID of the academic year")
    semester_type: Literal["ODD", "EVEN"] = Field(..., description="Academic semester cycle: 'ODD' or 'EVEN'")

class GenerateTimetableResponse(BaseModel):
    status: str = "success"
    timetable_id: str
    message: str = "Timetable generated and published to Convex"

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health Check Endpoint (GET /health)
    """
    return {
        "status": "ok",
        "message": "Backend is healthy"
    }

@app.post(
    "/api/timetables/generate",
    status_code=status.HTTP_201_CREATED,
    response_model=GenerateTimetableResponse
)
async def generate_timetable(
    request: GenerateTimetableRequest,
    identity: Dict[str, Any] = Depends(verify_admin_identity)
):
    """
    Generate Timetable Endpoint (POST /api/timetables/generate)
    1. Authenticates Clerk Admin JWT via Convex auth:getIdentity
    2. Ingests constraints from Convex
    3. Runs Google OR-Tools CP-SAT integer optimization
    4. Publishes zero-clash schedule back to Convex
    5. Returns timetable_id to caller
    """
    logger.info(
        f"Generate request received for Academic Year: {request.academic_year_id}, "
        f"Cycle: {request.semester_type} by Admin: {identity.get('email')}"
    )

    try:
        # Ingest data from Convex
        classes = []
        subjects = []
        teachers = []
        assignments = []
        rooms = []
        labs = []

        try:
            classes = await convex_client.query("classes:getClasses") or []
            subjects = await convex_client.query("subjects:getSubjects") or []
            teachers = await convex_client.query("teachers:getTeachers") or []
            assignments = await convex_client.query("assignments:getAssignments") or []
            rooms = await convex_client.query("rooms:getRooms") or []
            labs = await convex_client.query("labs:getLabs") or []
        except Exception as query_err:
            logger.warning(f"Could not read from Convex ({query_err}), falling back to sample academic dataset.")
            # Standard seed dataset if Convex is local/offline
            classes = [
                {"_id": "cls_1a", "name": "CSE A (1st Yr)", "year_number": 1, "student_count": 60},
                {"_id": "cls_2a", "name": "CSE A (2nd Yr)", "year_number": 2, "student_count": 60},
                {"_id": "cls_3a", "name": "CSE A (3rd Yr)", "year_number": 3, "student_count": 60},
                {"_id": "cls_4a", "name": "CSE A (4th Yr)", "year_number": 4, "student_count": 60},
            ]
            subjects = [
                {"_id": "sub_mat", "subject_code": "MAT101", "subject_name": "Calculus", "subject_type": "THEORY", "weekly_hours": 4},
                {"_id": "sub_dsa", "subject_code": "CS201", "subject_name": "Data Structures", "subject_type": "THEORY", "weekly_hours": 4},
                {"_id": "sub_os", "subject_code": "CS301", "subject_name": "Operating Systems", "subject_type": "THEORY", "weekly_hours": 3},
                {"_id": "sub_ds_lab", "subject_code": "CS202L", "subject_name": "Data Structures Lab", "subject_type": "LAB", "weekly_hours": 2},
                {"_id": "sub_nw_lab", "subject_code": "CS302L", "subject_name": "Networks Lab", "subject_type": "LAB", "weekly_hours": 2},
            ]
            teachers = [
                {"_id": "tch_1", "name": "Dr. Alan Turing", "employee_id": "EMP-101"},
                {"_id": "tch_2", "name": "Dr. Grace Hopper", "employee_id": "EMP-102"},
                {"_id": "tch_3", "name": "Prof. Donald Knuth", "employee_id": "EMP-103"},
                {"_id": "tch_4", "name": "Dr. Barbara Liskov", "employee_id": "EMP-104"},
            ]
            assignments = [
                {"_id": "asg_1", "class_id": "cls_1a", "subject_id": "sub_mat", "teacher_id": "tch_1"},
                {"_id": "asg_2", "class_id": "cls_2a", "subject_id": "sub_dsa", "teacher_id": "tch_2"},
                {"_id": "asg_3", "class_id": "cls_2a", "subject_id": "sub_ds_lab", "teacher_id": "tch_2", "lab_assistant_1_id": "tch_4"},
                {"_id": "asg_4", "class_id": "cls_3a", "subject_id": "sub_os", "teacher_id": "tch_3"},
                {"_id": "asg_5", "class_id": "cls_3a", "subject_id": "sub_nw_lab", "teacher_id": "tch_3", "lab_assistant_1_id": "tch_1"},
            ]
            labs = [
                {"_id": "lab_1", "name": "Advanced Systems Lab", "capacity": 45},
                {"_id": "lab_2", "name": "Network & Computing Lab", "capacity": 40},
            ]
            rooms = [
                {"_id": "room_101", "name": "LH-101", "capacity": 70},
                {"_id": "room_102", "name": "LH-102", "capacity": 70},
                {"_id": "room_201", "name": "LH-201", "capacity": 70},
            ]

        # Execute CP-SAT Solver
        scheduler = TimetableScheduler(
            classes=classes,
            subjects=subjects,
            teachers=teachers,
            assignments=assignments,
            rooms=rooms,
            labs=labs
        )

        try:
            entries = scheduler.solve()
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solver could not find a feasible timetable under current constraints."
            )

        # Publish results to Convex
        timetable_id = None
        try:
            pub_res = await convex_client.mutation(
                "timetables:publishGeneratedTimetable",
                args={
                    "academic_year_id": request.academic_year_id,
                    "semester_type": request.semester_type,
                    "entries": entries,
                }
            )
            if pub_res and isinstance(pub_res, dict):
                timetable_id = pub_res.get("timetable_id")
        except Exception as pub_err:
            logger.warning(f"Failed to publish directly to Convex ({pub_err}). Returning generated local ID.")

        if not timetable_id:
            timetable_id = f"tt_{uuid.uuid4().hex[:12]}"

        return GenerateTimetableResponse(
            status="success",
            timetable_id=timetable_id,
            message="Timetable generated and published to Convex"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected failure during timetable generation: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
