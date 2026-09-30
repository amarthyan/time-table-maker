import pytest
from app.services.convex_service import ConvexService

def test_convex_client_initialization():
    service = ConvexService()
    assert service.client is not None
