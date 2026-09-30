from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "College Timetable Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    FRONTEND_URL: str = "http://localhost:3000"
    CONVEX_URL: Optional[str] = None
    
    # Scheduler optimization settings
    MINIMIZE_CLASS_GAPS: bool = True
    BALANCE_SUBJECTS: bool = True
    BALANCE_TEACHER_WORKLOAD: bool = True
    MAX_SOLVER_TIME_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
