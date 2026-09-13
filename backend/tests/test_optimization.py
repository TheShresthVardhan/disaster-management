"""
Tests for the demo resource optimizer (rule-based, no ML).
Covers: severity ordering, affected-people influence, allocation caps,
empty/invalid input. No accuracy metrics — behavior-only assertions.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.optimization import (
    IncidentForOptimization,
    ResourceInput,
    optimize,
    score_incident,
)

client = TestClient(app)


def inc(incident_id, severity="moderate", affected=0, dtype="flood", status="ACTIVE", **kw):
    return IncidentForOptimization(
        incident_id=incident_id,
        disaster_type=dtype,
        severity=severity,
        affected_people=affected,
        status=status,
        **kw,
    )


def res(rtype, available):
    return ResourceInput(type=rtype, available=available)


# --- priority scoring ---


def test_severity_ordering():
    scores = {
        sev: score_incident(severity=sev, affected_people=0, disaster_type="other")[0]
        for sev in ("low", "moderate", "high", "critical")
    }
    assert scores["critical"] > scores["high"] > scores["moderate"] > scores["low"]


def test_affected_people_increases_score():
    low = score_incident(severity="high", affected_people=0, disaster_type="other")[0]
    high = score_incident(severity="high", affected_people=200, disaster_type="other")[0]
    assert high > low


def test_affected_people_capped():
    assert score_incident(severity="low", affected_people=500)[0] == score_incident(
        severity="low", affected_people=5000
    )[0]


def test_ai_severity_preferred_when_valid():
    score, _, _, explanation, _ = score_incident(
        severity="low", affected_people=0, ai_predicted_severity="critical"
    )
    assert "AI severity critical" in explanation
    assert score >= 100


def test_inactive_incidents_downweighted():
    active = score_incident(severity="high", status="ACTIVE")[0]
    resolved = score_incident(severity="high", status="RESOLVED")[0]
    assert resolved < active


def test_unknown_severity_defaults_low():
    score, level, _, _, _ = score_incident(severity="nonsense")
    assert level == "low" and score < 30


# --- allocation ---


def test_ranking_and_allocation_respects_pool():
    result = optimize(
        [inc("A", severity="critical", affected=100), inc("B", severity="low")],
        [res("rescue_team", 1), res("relief_kit", 50)],
    )
    assert [r.incident_id for r in result["ranked"]] == ["A", "B"]
    assert result["ranked"][0].allocated_quantity == 1
    # pool exhausted for the shared resource -> second gets 0 + unmet flag
    assert result["ranked"][1].allocated_quantity == 0
    assert result["ranked"][1].unmet_need is True


def test_empty_incidents_returns_empty_ranking():
    result = optimize([], [res("ambulance", 2)])
    assert result["ranked"] == []
    assert any("No incidents" in w for w in result["warnings"])


def test_empty_resources_uses_demo_inventory():
    result = optimize([inc("A", severity="high")], [])
    assert any("DEMO inventory" in w for w in result["warnings"])
    assert result["resource_usage"]["rescue_team"]["available"] > 0


def test_negative_affected_rejected_by_schema():
    with pytest.raises(Exception):
        IncidentForOptimization(incident_id="X", affected_people=-5)


# --- endpoint ---


def test_endpoint_ranks_and_flags_demo():
    r = client.post(
        "/api/optimize-resources",
        json={
            "incidents": [
                {"incident_id": "A", "severity": "critical", "affected_people": 45,
                 "disaster_type": "flood", "status": "ACTIVE"},
                {"incident_id": "B", "severity": "low", "affected_people": 0,
                 "disaster_type": "other", "status": "ACTIVE"},
            ],
            "resources": [],
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True and body["is_demo"] is True
    assert body["ranked"][0]["incident_id"] == "A"
    assert all("explanation" in row and row["explanation"] for row in body["ranked"])


def test_endpoint_empty_incidents():
    r = client.post("/api/optimize-resources", json={"incidents": [], "resources": []})
    assert r.status_code == 200
    assert r.json()["ranked"] == []


def test_endpoint_invalid_input_rejected():
    r = client.post(
        "/api/optimize-resources",
        json={"incidents": [{"incident_id": "X", "affected_people": -1}], "resources": []},
    )
    assert r.status_code == 422
