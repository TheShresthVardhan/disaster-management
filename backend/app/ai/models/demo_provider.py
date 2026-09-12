"""
DEMO/MOCK Incident AI Provider
=================================================================
⚠️  THIS IS A DEMONSTRATION/MOCK PROVIDER - NOT A TRAINED MODEL
=================================================================

This provider exists ONLY to test the AI pipeline without a trained model.
It returns deterministic, rule-based outputs based on simple keyword matching
and should NEVER be used for real disaster response decisions.

DO NOT:
- Present outputs as real AI predictions
- Use confidence values as genuine model certainty
- Deploy in production without replacing with a trained model

USE FOR:
- Testing the AI pipeline end-to-end
- Frontend integration development
- Pipeline debugging

REPLACEMENT:
Replace with a real trained model (sklearn, PyTorch, TensorFlow, ONNX, etc.)
in Phase 5B or later by implementing a new IncidentAIProvider subclass.
"""

import time
import re
from typing import Optional
from app.ai.models.base import IncidentAIProvider
from app.ai.schemas import IncidentInput, IncidentAIResult, DisasterType, SeverityLevel


class DemoIncidentAIProvider(IncidentAIProvider):
    """
    Demo/mock provider that returns rule-based assessments.
    Clearly labeled as DEMO - not a trained ML model.
    """

    name = "demo"
    version = "demo-v1"
    is_demo = True

    # Keyword patterns for simple rule-based classification
    DISASTER_KEYWORDS = {
        DisasterType.FLOOD: [
            "flood", "flooding", "water level", "river", "inundat", "submerged",
            "flash flood", "overflow", "dam breach", "levee", "water rising"
        ],
        DisasterType.LANDSLIDE: [
            "landslide", "mudslide", "rockslide", "slope fail", "debris flow",
            "hillside", "embankment", "retaining wall", "ground movement"
        ],
        DisasterType.EARTHQUAKE: [
            "earthquake", "tremor", "quake", "seismic", "aftershock", "magnitude",
            "richter", "epicenter", "ground shaking", "building crack"
        ],
        DisasterType.FIRE: [
            "fire", "wildfire", "forest fire", "blaze", "burning", "smoke",
            "flames", "arson", "brush fire", "grass fire", "structure fire"
        ],
        DisasterType.CYCLONE: [
            "cyclone", "hurricane", "typhoon", "tropical storm", "storm surge",
            "eye wall", "landfall", "category"
        ],
        DisasterType.STORM: [
            "storm", "thunderstorm", "hail", "lightning", "wind", "gust",
            "tornado", "twister", "severe weather", "squall"
        ],
        DisasterType.INFRASTRUCTURE_DAMAGE: [
            "bridge collapse", "building collapse", "road damage", "power line",
            "utility pole", "gas leak", "water main", "structural damage",
            "cracked foundation", "wall collapse"
        ],
    }

    SEVERITY_KEYWORDS = {
        SeverityLevel.CRITICAL: [
            "catastrophic", "devastat", "mass casualty", "total destroy",
            "emergency", "evacuat", "life threatening", "critical"
        ],
        SeverityLevel.HIGH: [
            "severe", "major", "significant", "widespread", "extensive",
            "multiple", "serious", "urgent"
        ],
        SeverityLevel.MODERATE: [
            "moderate", "partial", "localized", "limited", "some damage",
            "manageable", "contained"
        ],
        SeverityLevel.LOW: [
            "minor", "minimal", "slight", "small", "no damage", "no injur",
            "under control", "minor"
        ],
    }

    def _classify_disaster_type(self, text: str) -> DisasterType:
        """Simple keyword-based disaster type classification."""
        text_lower = text.lower()
        scores = {}
        for dtype, keywords in self.DISASTER_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[dtype] = score
        if scores:
            return max(scores, key=scores.get)
        return DisasterType.OTHER

    def _classify_severity(self, text: str, affected_people: int) -> SeverityLevel:
        """Simple keyword + affected people based severity classification."""
        text_lower = text.lower()
        scores = {}
        for sev, keywords in self.SEVERITY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[sev] = score

        # Boost severity based on affected people
        if affected_people > 100:
            scores[SeverityLevel.CRITICAL] = scores.get(SeverityLevel.CRITICAL, 0) + 2
        elif affected_people > 50:
            scores[SeverityLevel.HIGH] = scores.get(SeverityLevel.HIGH, 0) + 2
        elif affected_people > 10:
            scores[SeverityLevel.MODERATE] = scores.get(SeverityLevel.MODERATE, 0) + 1

        if scores:
            return max(scores, key=scores.get)
        return SeverityLevel.LOW

    def _generate_infrastructure_impact(self, disaster_type: DisasterType, severity: SeverityLevel) -> str:
        """Generate infrastructure impact assessment based on type and severity."""
        base_impacts = {
            DisasterType.FLOOD: "Roads, bridges, and low-lying infrastructure at risk. Potential water contamination.",
            DisasterType.LANDSLIDE: "Roads, buildings, and utilities on slopes at risk. Road blockages likely.",
            DisasterType.EARTHQUAKE: "Buildings, bridges, utilities, and underground infrastructure at risk.",
            DisasterType.FIRE: "Buildings, power lines, communication infrastructure, and vegetation at risk.",
            DisasterType.CYCLONE: "Coastal infrastructure, power grid, communications, and transportation at risk.",
            DisasterType.STORM: "Roofs, power lines, trees, and lightweight structures at risk.",
            DisasterType.INFRASTRUCTURE_DAMAGE: "Direct structural damage to buildings, bridges, roads, and utilities.",
        }
        base = base_impacts.get(disaster_type, "Infrastructure impact assessment not available for this disaster type.")

        severity_modifiers = {
            SeverityLevel.CRITICAL: " Catastrophic infrastructure failure expected. Immediate engineering assessment required.",
            SeverityLevel.HIGH: " Major infrastructure damage likely. Priority repairs needed.",
            SeverityLevel.MODERATE: " Moderate infrastructure impact. Targeted repairs recommended.",
            SeverityLevel.LOW: " Minimal infrastructure impact expected. Routine monitoring sufficient.",
        }
        return base + severity_modifiers.get(severity, "")

    def _generate_safety_assessment(self, disaster_type: DisasterType, severity: SeverityLevel, affected_people: int) -> str:
        """Generate safety assessment and recommendations."""
        base_safety = {
            DisasterType.FLOOD: "Avoid flood waters. Move to higher ground. Do not drive through flooded roads.",
            DisasterType.LANDSLIDE: "Evacuate slide area immediately. Avoid slopes. Watch for secondary slides.",
            DisasterType.EARTHQUAKE: "Drop, Cover, Hold On. Expect aftershocks. Check for gas leaks and structural damage.",
            DisasterType.FIRE: "Evacuate immediately. Stay low in smoke. Do not re-enter until cleared by authorities.",
            DisasterType.CYCLONE: "Shelter in interior room. Stay away from windows. Monitor official updates.",
            DisasterType.STORM: "Seek sturdy shelter. Avoid windows. Secure loose objects.",
            DisasterType.INFRASTRUCTURE_DAMAGE: "Avoid damaged structures. Watch for falling debris. Follow engineer guidance.",
        }
        base = base_safety.get(disaster_type, "Follow standard emergency protocols. Monitor official channels.")

        severity_guidance = {
            SeverityLevel.CRITICAL: " IMMEDIATE EVACUATION RECOMMENDED. Life-threatening conditions. Call 112.",
            SeverityLevel.HIGH: " High risk to life and property. Prepare to evacuate. Follow official orders.",
            SeverityLevel.MODERATE: " Elevated risk. Stay alert. Prepare emergency kit. Monitor updates.",
            SeverityLevel.LOW: " Low immediate risk. Stay informed. Standard precautions advised.",
        }

        people_note = ""
        if affected_people > 100:
            people_note = f" {affected_people} people reported affected - coordinate mass care."
        elif affected_people > 10:
            people_note = f" {affected_people} people reported affected - ensure their safety."
        elif affected_people > 0:
            people_note = f" {affected_people} people reported affected."

        return base + severity_guidance.get(severity, "") + people_note

    def _generate_recommended_actions(self, disaster_type: DisasterType, severity: SeverityLevel) -> list:
        """Generate recommended immediate actions."""
        actions = {
            DisasterType.FLOOD: [
                "Evacuate low-lying areas immediately",
                "Move to designated shelters on higher ground",
                "Avoid contact with flood water",
                "Shut off utilities if safe to do so"
            ],
            DisasterType.LANDSLIDE: [
                "Evacuate slide path and surrounding area",
                "Monitor for ground movement sounds",
                "Stay away from slope edges",
                "Contact geological survey"
            ],
            DisasterType.EARTHQUAKE: [
                "Drop, Cover, Hold On",
                "Check for injuries and structural damage",
                "Expect aftershocks",
                "Shut off gas if leak suspected"
            ],
            DisasterType.FIRE: [
                "Evacuate immediately via planned routes",
                "Close doors behind you",
                "Call fire emergency (112)",
                "Do not use elevators"
            ],
            DisasterType.CYCLONE: [
                "Shelter in interior room on lowest floor",
                "Stay away from windows and doors",
                "Monitor official weather bulletins",
                "Prepare emergency supplies"
            ],
            DisasterType.STORM: [
                "Seek sturdy indoor shelter",
                "Secure loose outdoor objects",
                "Avoid travel until storm passes",
                "Monitor weather alerts"
            ],
            DisasterType.INFRASTRUCTURE_DAMAGE: [
                "Evacuate damaged structures",
                "Establish safety perimeter",
                "Contact structural engineer",
                "Document damage for insurance"
            ],
        }
        base_actions = actions.get(disaster_type, ["Follow standard emergency protocols", "Monitor official channels"])

        if severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH):
            base_actions.insert(0, "Activate emergency response plan")
            base_actions.append("Coordinate with emergency services (112)")

        return base_actions

    async def analyze(self, incident: IncidentInput) -> IncidentAIResult:
        """
        Analyze incident using rule-based classification.
        DEMO ONLY - not a trained model.
        """
        start_time = time.time()

        # Combine description and location text for analysis
        analysis_text = " ".join(filter(None, [
            incident.description,
            incident.location_text,
            incident.disaster_type.value if incident.disaster_type else None
        ]))

        # Use user-provided type/severity as hints but allow override
        predicted_type = self._classify_disaster_type(analysis_text)
        predicted_severity = self._classify_severity(analysis_text, incident.affected_people)

        # If user provided type/severity and confidence in them, could weight them
        # For demo, we just use our classification

        # Generate assessments
        infrastructure_impact = self._generate_infrastructure_impact(predicted_type, predicted_severity)
        safety_assessment = self._generate_safety_assessment(predicted_type, predicted_severity, incident.affected_people)
        recommended_actions = self._generate_recommended_actions(predicted_type, predicted_severity)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return IncidentAIResult(
            predicted_disaster_type=predicted_type,
            predicted_severity=predicted_severity,
            confidence=0.65,  # Fixed demo confidence - NOT from model
            infrastructure_impact=infrastructure_impact,
            safety_assessment=safety_assessment,
            affected_areas=None,  # Would need geocoding
            recommended_actions=recommended_actions,
            model_version=self.version,
            processing_time_ms=processing_time_ms,
            is_demo=True
        )