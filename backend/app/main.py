from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import timetables

app = FastAPI(
    title="College Timetable Management System API",
    description="Backend API for the College Timetable Management System",
    version="1.0.0",
)

import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
CONVEX_URL = os.environ.get("CONVEX_URL")

if not CONVEX_URL:
    logger.warning("CONVEX_URL is not set. The backend may not be able to communicate with Convex.")
elif "127.0.0.1" in CONVEX_URL or "localhost" in CONVEX_URL:
    logger.warning("Running with local Convex emulator configuration.")
else:
    logger.info("Configured for production Convex environment.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

app.include_router(timetables.router, prefix="/api/timetables", tags=["Timetables"])
