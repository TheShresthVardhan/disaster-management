"""
Demo Priority Scoring (rule-based, fully explainable)
=================================================================
DEMO/PROTOTYPE ONLY — transparent heuristic, NOT a trained ML model.

score = severity_weight
      + min(affected_people, 500) * 0.1        (max +50)
      + disaster_type_weight                    (max +10)

Levels: >=100 critical | >=60 high | >=30 moderate | else low.

Recommended resource is a fixed mapping from disaster type, quantity
scales with affected people (1 unit per 25 people, min 1).
"""
from typing import Tuple, Optional

RULESET_VERSION = "rule-based-v1"

SEVERITY_WEIGHTS = {
    "critical": 100.0,
    "high": 60.0,
    "moderate": 30.0,
    "low": 10.0,
}

TYPE_WEIGHTS = {
    "earthquake": 10.0,
    "flood": 8.0,
    "landslide": 8.0,
    "cyclone": 8.0,
    "fire": 6.0,
    "storm": 4.0,
    "infrastructure_damage": 4.0,
}

# disaster type -> preferred demo resource
RESOURCE_MAP = {
    "earthquake": "rescue_team",
    "landslide": "rescue_team",
    "flood": "rescue_team",
    "fire": "rescue_team",
    "cyclone": "relief_kit",
    "storm": "relief_kit",
    "infrastructure_damage": "rescue_team",
}

LEVEL_THRESHOLDS = [(100.0, "critical"), (60.0, "high"), (30.0, "moderate")]

# Small built-in DEMO inventory used when the request omits resources.
# These numbers are illustrative placeholders, NOT real availability.
DEMO_INVENTORY = [
    {"type": "ambulance", "available": 4, "location_text": "Gangtok depot (demo)"},
    {"type": "rescue_team", "available": 6, "location_text": "Sikkim staging (demo)"},
    {"type": "relief_kit", "available": 50, "location_text": "Rangpo warehouse (demo)"},
]


def normalize_severity(value: Optional[str]) -> str:
    """Lowercase + validate; unknown values fall back to 'low' (least privilege)."""
    v = (value or "").strip().lower()
    return v if v in SEVERITY_WEIGHTS else "low"


def normalize_disaster_type(value: Optional[str]) -> str:
    """Lowercase + map common frontend labels to scorer keys."""
    v = (value or "").strip().lower()
    aliases = {
        "wildfire": "fire",
        "tornado": "storm",
        "tsunami": "flood",
        "emergency sos": "other",
        "emergency_sos": "other",
    }
    return aliases.get(v, v)


def priority_level_for(score: float) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if score >= threshold:
            return level
    return "low"


def score_incident(
    severity: Optional[str],
    affected_people: int = 0,
    disaster_type: Optional[str] = None,
    ai_predicted_severity: Optional[str] = None,
    status: Optional[str] = None,
) -> Tuple[float, str, str, str, int]:
    """
    Score one incident.

    Returns (score, level, recommended_resource, explanation, recommended_qty).
    Inactive (non-ACTIVE) incidents are down-weighted to 30%.
    AI-predicted severity is preferred when present and valid.
    """
    affected = max(0, int(affected_people or 0))

    ai_sev = (ai_predicted_severity or "").strip().lower()
    if ai_sev in SEVERITY_WEIGHTS:
        sev_key = ai_sev
        sev_note = f"AI severity {sev_key}"
    else:
        sev_key = normalize_severity(severity)
        sev_note = f"reported severity {sev_key}"

    sev_w = SEVERITY_WEIGHTS[sev_key]
    affected_w = round(min(affected, 500) * 0.1, 1)

    dtype = normalize_disaster_type(disaster_type)
    type_w = TYPE_WEIGHTS.get(dtype, 0.0)

    score = round(sev_w + affected_w + type_w, 1)

    status_key = (status or "ACTIVE").strip().upper()
    if status_key != "ACTIVE":
        score = round(score * 0.3, 1)

    resource = RESOURCE_MAP.get(dtype, "relief_kit")
    # SOS-style emergencies without a disaster type lean medical.
    if dtype in ("other", "") and (disaster_type or "").strip().lower().startswith("emergency"):
        resource = "ambulance"

    recommended_qty = max(1, min(20, (affected // 25) + 1))

    parts = [f"{sev_note} (+{sev_w:g})", f"{affected} affected (+{affected_w:g})"]
    if type_w:
        parts.append(f"{dtype} (+{type_w:g})")
    if status_key != "ACTIVE":
        parts.append(f"status {status_key} (x0.3)")
    explanation = "; ".join(parts) + f" = {score:g}"

    return score, priority_level_for(score), resource, explanation, recommended_qty
