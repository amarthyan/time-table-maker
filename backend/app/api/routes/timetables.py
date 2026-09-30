from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from app.scheduler.generator_convex import generate_timetable_for_semester_convex

router = APIRouter()
security = HTTPBearer()

class GenerateRequest(BaseModel):
    academic_year_id: str = Field(..., description="Convex document ID of the Academic Year to schedule")
    semester_type: str = Field(..., description="Semester type ('ODD' or 'EVEN')", pattern="^(ODD|EVEN)$")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "academic_year_id": "jh78f2k9a1b2c3d4e5f6g7h8",
                "semester_type": "ODD"
            }
        }
    }

class GenerateResponse(BaseModel):
    status: str = Field(..., description="Status of the generation process")
    timetable_id: str = Field(..., description="Convex document ID of the newly generated timetable")
    message: str = Field(..., description="Human-readable status message")

@router.post(
    "/generate", 
    response_model=GenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a timetable using OR-Tools",
    description="Fetches data from Convex, passes it to the OR-Tools CP-SAT solver, validates the constraints, and publishes the resulting timetable entries directly back to Convex.",
    responses={
        400: {"description": "Validation error or solver determined the problem is INFEASIBLE."},
        500: {"description": "Internal server error during generation or publishing."}
    }
)
def generate_timetable(req: GenerateRequest, auth: HTTPAuthorizationCredentials = Depends(security)):
    try:
        result = generate_timetable_for_semester_convex(req.academic_year_id, req.semester_type, token=auth.credentials)
        return GenerateResponse(
            status="success",
            timetable_id=result["timetable_id"],
            message="Timetable generated and published to Convex"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Generation failed: {str(e)}")
