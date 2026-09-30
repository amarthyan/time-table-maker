import requests
import sys

FASTAPI_URL = "http://127.0.0.1:8000"

def test_full_integration(clerk_token: str):
    print(f"Testing Unauthenticated Flow...")
    res = requests.post(f"{FASTAPI_URL}/api/timetables/generate", json={
        "academic_year_id": "test_id",
        "semester_type": "ODD"
    })
    
    if res.status_code == 401:
        print("✅ Unauthenticated request correctly rejected (401 Unauthorized)")
    else:
        print(f"❌ Failed: Expected 401, got {res.status_code}")
        
    print(f"\nTesting Authenticated Admin Flow...")
    res = requests.post(
        f"{FASTAPI_URL}/api/timetables/generate", 
        json={
            "academic_year_id": "test_id",
            "semester_type": "ODD"
        },
        headers={"Authorization": f"Bearer {clerk_token}"}
    )
    
    if res.status_code == 201:
        print("✅ Authenticated request succeeded!")
        print("Timetable ID:", res.json().get("timetable_id"))
    elif res.status_code == 400:
        print("✅ Authenticated request succeeded in hitting Convex, but constraints were unsatisfiable (Expected with dummy IDs)")
    else:
        print(f"❌ Failed: Expected success or constraint failure, got {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_integration.py <clerk_jwt_token>")
        sys.exit(1)
        
    test_full_integration(sys.argv[1])
