/**
 * Demo resource optimization client.
 * Tries the backend POST /api/optimize-resources first; falls back to a
 * small local mirror of the SAME transparent rule set when the backend is
 * unreachable (e.g. static Vercel preview). Always demo-labeled.
 */

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8000'
).replace(/\/$/, '');

export const RULESET_VERSION = 'rule-based-v1';

export const DEMO_INVENTORY = [
  { type: 'ambulance', available: 4, location_text: 'Gangtok depot (demo)' },
  { type: 'rescue_team', available: 6, location_text: 'Sikkim staging (demo)' },
  { type: 'relief_kit', available: 50, location_text: 'Rangpo warehouse (demo)' },
];

const SEVERITY_WEIGHTS = { critical: 100, high: 60, moderate: 30, low: 10 };
const TYPE_WEIGHTS = {
  earthquake: 10, flood: 8, landslide: 8, cyclone: 8, fire: 6, storm: 4, infrastructure_damage: 4,
};
const RESOURCE_MAP = {
  earthquake: 'rescue_team', landslide: 'rescue_team', flood: 'rescue_team', fire: 'rescue_team',
  cyclone: 'relief_kit', storm: 'relief_kit', infrastructure_damage: 'rescue_team',
};

function levelFor(score) {
  if (score >= 100) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

/** Local mirror of backend/app/optimization/scoring.py (rule-based-v1). */
export function scoreIncidentLocal({ severity, affected_people = 0, disaster_type, ai_predicted_severity, status }) {
  const affected = Math.max(0, Number(affected_people) || 0);
  const aiSev = (ai_predicted_severity || '').toLowerCase();
  const sevKey = SEVERITY_WEIGHTS[aiSev] !== undefined ? aiSev : (SEVERITY_WEIGHTS[(severity || '').toLowerCase()] !== undefined ? (severity || 'low').toLowerCase() : 'low');
  const sevW = SEVERITY_WEIGHTS[sevKey];
  const affectedW = Math.round(Math.min(affected, 500) * 0.1 * 10) / 10;
  const dtype = (disaster_type || '').toLowerCase();
  const typeW = TYPE_WEIGHTS[dtype] || 0;
  let score = Math.round((sevW + affectedW + typeW) * 10) / 10;
  const statusKey = (status || 'ACTIVE').toUpperCase();
  if (statusKey !== 'ACTIVE') score = Math.round(score * 0.3 * 10) / 10;
  const resource = RESOURCE_MAP[dtype] || 'relief_kit';
  const qty = Math.max(1, Math.min(20, Math.floor(affected / 25) + 1));
  const parts = [
    `${aiSev && SEVERITY_WEIGHTS[aiSev] !== undefined ? `AI severity ${sevKey}` : `reported severity ${sevKey}`} (+${sevW})`,
    `${affected} affected (+${affectedW})`,
  ];
  if (typeW) parts.push(`${dtype} (+${typeW})`);
  if (statusKey !== 'ACTIVE') parts.push(`status ${statusKey} (x0.3)`);
  return { score, level: levelFor(score), resource, qty, explanation: `${parts.join('; ')} = ${score}` };
}

export function optimizeLocal(incidents, resources) {
  const pool = {};
  (resources.length ? resources : DEMO_INVENTORY).forEach((r) => {
    pool[r.type] = (pool[r.type] || 0) + Math.max(0, Number(r.available) || 0);
  });
  const warnings = [];
  if (!resources.length) warnings.push('No resources supplied — using built-in DEMO inventory (simulated).');
  const scored = incidents.map((inc) => ({ inc, ...scoreIncidentLocal(inc) }));
  scored.sort((a, b) => b.score - a.score || (b.inc.affected_people || 0) - (a.inc.affected_people || 0));
  const allocated = {};
  const ranked = scored.map((s, i) => {
    const avail = (pool[s.resource] || 0) - (allocated[s.resource] || 0);
    const give = Math.min(s.qty, Math.max(0, avail));
    allocated[s.resource] = (allocated[s.resource] || 0) + give;
    const unmet = s.qty > give;
    if (unmet) warnings.push(`${s.inc.incident_id}: needs ${s.qty}x ${s.resource}, only ${give} available in demo pool.`);
    return {
      rank: i + 1, incident_id: s.inc.incident_id, priority_score: s.score,
      priority_level: s.level, recommended_resource: s.resource,
      recommended_quantity: s.qty, allocated_quantity: give,
      unmet_need: unmet, explanation: s.explanation,
    };
  });
  const resource_usage = Object.fromEntries(
    Object.entries(pool).map(([t, q]) => [t, { available: q, allocated: allocated[t] || 0, remaining: q - (allocated[t] || 0) }])
  );
  return { success: true, ranked, warnings, resource_usage, provider: RULESET_VERSION, is_demo: true, source: 'local-fallback' };
}

export async function optimizeResources(incidents, resources) {
  const response = await fetch(`${API_BASE}/api/optimize-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidents, resources }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || 'Optimization request failed');
  return { ...data, source: 'backend' };
}

export function toOptimizerInput(incidents) {
  return incidents.map((inc) => ({
    incident_id: inc.incidentId,
    disaster_type: inc.disasterType,
    severity: (inc.severity || 'low').toLowerCase(),
    ai_predicted_severity: inc.aiAssessment?.predicted_severity,
    affected_people: Number(inc.affectedPeople) || 0,
    status: inc.status || 'ACTIVE',
    location_text: inc.location,
    latitude: typeof inc.latitude === 'number' ? inc.latitude : undefined,
    longitude: typeof inc.longitude === 'number' ? inc.longitude : undefined,
  }));
}

export { API_BASE };
