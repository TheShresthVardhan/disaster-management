"""
Tests for the Incident AI integration (Phase 5A foundation + 5B API).

Covers: endpoint availability, registry/provider wiring, demo flagging,
input validation, and health checks. No accuracy claims — the only
provider is the rule-based demo (is_demo=True, fixed 0.65 confidence).
"""
from fastapi.testclient import TestClient

from app.main import app
from app.ai import get_provider, get_registry

client = TestClient(app)

VALID_INCIDENT = {
    "description": "Heavy flooding in Rangpo area, water levels rising rapidly, 45 people affected",
    "latitude": 27.1767,
    "longitude": 88.5333,
    "location_text": "Rangpo, East Sikkim",
    "affected_people": 45,
}


def test_registry_defaults_to_demo_provider():
    registry = get_registry()
    default = registry.get_default()
    assert default is not None
    assert default.is_demo is True
    assert get_provider().name == default.name


def test_analyze_incident_returns_demo_flagged_result():
    r = client.post("/api/ai/analyze-incident", json=VALID_INCIDENT)
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["is_demo"] is True
    assert body["provider"] == "demo"
    result = body["result"]
    assert result["is_demo"] is True
    assert result["model_version"] == "demo-v1"
    assert result["confidence"] == 0.65
    assert result["predicted_disaster_type"] == "flood"
    assert result["infrastructure_impact"]
    assert result["safety_assessment"]
    assert isinstance(result["recommended_actions"], list)


def test_analyze_incident_invalid_disaster_type_rejected():
    r = client.post(
        "/api/ai/analyze-incident",
        json={**VALID_INCIDENT, "disaster_type": "wildfire"},
    )
    assert r.status_code == 400
    assert "disaster_type" in str(r.json()["detail"])


def test_analyze_incident_short_description_rejected():
    r = client.post("/api/ai/analyze-incident", json={"description": "short"})
    assert r.status_code == 422


def test_analyze_incident_negative_affected_rejected():
    r = client.post(
        "/api/ai/analyze-incident", json={**VALID_INCIDENT, "affected_people": -1}
    )
    assert r.status_code in (400, 422)


def test_providers_endpoint_lists_demo_default():
    r = client.get("/api/ai/providers")
    assert r.status_code == 200
    body = r.json()
    assert body["default"] == "demo"
    assert body["providers"]["demo"]["is_demo"] is True


def test_ai_health_check_ok_and_demo():
    r = client.get("/api/ai/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["provider"] == "demo"
    assert body["is_demo"] is True


def test_landslide_health_check_ok():
    r = client.get("/api/ai/landslide/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
