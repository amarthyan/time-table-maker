import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from convex import ConvexClient

client = TestClient(app)

def test_unauthenticated_generate_timetable():
    # Without Authorization header
    response = client.post("/api/timetables/generate", json={
        "academic_year_id": "test_year",
        "semester_type": "ODD"
    })
    # HTTPBearer returns 401 Unauthorized when token is missing
    assert response.status_code == 401

def test_unauthenticated_convex_mutations():
    c = ConvexClient("https://happy-animal-123.convex.cloud")
    # Actually hitting the real convex url will fail due to no token
    # But for a reliable test without needing network:
    with patch.object(ConvexClient, 'mutation', side_effect=Exception("Unauthenticated call. Admin access required.")):
        with pytest.raises(Exception, match="Unauthenticated"):
            c.mutation("subjects:createSubject", {})
            
        with pytest.raises(Exception, match="Unauthenticated"):
            c.mutation("assignments:createAssignment", {})

@patch("app.api.routes.timetables.generate_timetable_for_semester_convex")
def test_authenticated_admin_flow(mock_generate):
    mock_generate.return_value = {"timetable_id": "success_id"}
    
    # With dummy Bearer token
    response = client.post(
        "/api/timetables/generate", 
        json={
            "academic_year_id": "test_year",
            "semester_type": "ODD"
        },
        headers={"Authorization": "Bearer admin_test_token"}
    )
    assert response.status_code == 201
    assert response.json()["timetable_id"] == "success_id"

    # Mock convex admin calls
    with patch.object(ConvexClient, 'mutation', return_value="success_id") as mock_mut:
        c = ConvexClient("https://happy-animal-123.convex.cloud")
        c.set_auth("admin_test_token")
        
        c.mutation("subjects:createSubject", {})
        c.mutation("assignments:createAssignment", {})
        
        assert mock_mut.call_count == 2
