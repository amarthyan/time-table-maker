import os
import sys
from dotenv import load_dotenv

# Load env variables
load_dotenv("backend/.env")

from convex import ConvexClient
from backend.app.scheduler.generator_convex import generate_timetable_for_semester_convex

def verify_convex():
    url = os.environ.get("CONVEX_URL")
    if not url:
        print("CONVEX_URL not set!")
        sys.exit(1)
        
    print(f"Connecting to Convex at {url}...")
    client = ConvexClient(url)
    
    # 1. Test CRUD - Create data
    print("Creating department...")
    dept_id = client.mutation("departments:createDepartment", {"name": "Computer Science", "code": "CS"})
    
    print("Creating academic year...")
    # There is no createAcademicYear in convex files yet, let's just insert directly if possible or skip.
    # Wait, we need to create one, let's assume we can use internal DB insertion or we need to define the mutation.
    pass
