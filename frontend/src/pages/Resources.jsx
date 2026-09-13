import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents } from '../context/IncidentContext';
import { Button, Card, CardHeader, CardBody, Badge } from '../components/ui';
import {
  DEMO_INVENTORY,
  toOptimizerInput,
  optimizeResources,
  optimizeLocal,
} from '../services/resourceOptimization';
import './Resources.css';

const RESOURCE_LABELS = {
  ambulance: '🚑 Ambulance',
  rescue_team: '🧑‍🚒 Rescue Team',
  relief_kit: '📦 Relief Kit',
};

function Resources() {
  const { incidents } = useIncidents();
  const [inventory, setInventory] = useState(() =>
    DEMO_INVENTORY.map((r) => ({ ...r }))
  );
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const activeInput = toOptimizerInput(incidents.filter((i) => i.status === 'ACTIVE'));

  const run = useCallback(async (inv) => {
    setRunning(true);
    setError(null);
    try {
      const data = await optimizeResources(activeInput, inv);
      setResult(data);
    } catch {
      // Backend unreachable (static hosting) — same rule set, run locally.
      setResult(optimizeLocal(activeInput, inv));
    } finally {
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents]);

  useEffect(() => {
    run(inventory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setQty = (type, value) => {
    const next = inventory.map((r) =>
      r.type === type ? { ...r, available: Math.max(0, Number(value) || 0) } : r
    );
    setInventory(next);
  };

  return (
    <div className="page resources-page">
      <div className="container-fluid px-3 px-md-4">
        <header className="page-header mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="page-header-icon" aria-hidden="true">🚑</div>
            <div>
              <h1 className="h2 fw-bold mb-1">Resource Priority</h1>
              <p className="text-muted mb-0">
                Which active incidents should receive limited emergency resources first.
              </p>
            </div>
            <Badge variant="warning" size="md" className="ms-auto">DEMO / PROTOTYPE</Badge>
          </div>
          <div className="prototype-notice">
            <div className="prototype-badge">DEMO / PROTOTYPE</div>
            <div className="prototype-text">
              <strong>DEMO / SIMULATED RESOURCE ALLOCATION.</strong> Transparent rule-based
              ranking (severity + affected people + type) against a small simulated
              inventory. Not connected to real ambulances or rescue teams — never use
              for actual dispatch.
            </div>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <Card variant="elevated" className="h-100">
              <CardHeader title="Demo Inventory" subtitle="Simulated availability — edit and re-run" />
              <CardBody>
                {inventory.map((r) => (
                  <div key={r.type} className="inventory-row">
                    <label htmlFor={`inv-${r.type}`} className="inventory-label">
                      {RESOURCE_LABELS[r.type] || r.type}
                    </label>
                    <input
                      id={`inv-${r.type}`}
                      type="number"
                      min="0"
                      className="form-control inventory-input"
                      value={r.available}
                      onChange={(e) => setQty(r.type, e.target.value)}
                    />
                  </div>
                ))}
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  className="mt-3"
                  loading={running}
                  onClick={() => run(inventory)}
                >
                  {running ? 'Optimizing…' : 'Run Optimization'}
                </Button>
                {result && (
                  <p className="text-muted small mt-2 mb-0">
                    Source: {result.source === 'backend' ? 'Backend optimizer' : 'Local fallback (backend unreachable)'} ·{' '}
                    {result.processing_time_ms ?? '—'} ms
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-8">
            <Card variant="elevated" className="h-100">
              <CardHeader
                title="Priority Ranking"
                subtitle={`${activeInput.length} active incident${activeInput.length === 1 ? '' : 's'}`}
              />
              <CardBody>
                {error && <div className="alert alert-danger">{error}</div>}
                {!result && running && <p className="text-muted">Scoring incidents…</p>}
                {result && result.ranked.length === 0 && (
                  <p className="text-muted mb-0">
                    No active incidents to rank. <Link to="/report">Report one</Link> to see it here.
                  </p>
                )}
                {result && result.ranked.length > 0 && (
                  <ol className="priority-rank-list">
                    {result.ranked.map((row) => (
                      <li key={row.incident_id} className="priority-rank-item" data-level={row.priority_level}>
                        <div className="priority-rank-top">
                          <span className="priority-rank-num" aria-hidden="true">#{row.rank}</span>
                          <div className="priority-rank-main">
                            <code className="priority-rank-id">{row.incident_id}</code>
                            <Badge severity={row.priority_level} size="sm" />
                            <span className="priority-rank-score">{row.priority_score} pts</span>
                          </div>
                        </div>
                        <div className="priority-rank-alloc">
                          {(RESOURCE_LABELS[row.recommended_resource] || row.recommended_resource)}
                          {' '}→ allocate <strong>{row.allocated_quantity}/{row.recommended_quantity}</strong>
                          {row.unmet_need && <Badge variant="warning" size="sm">shortfall</Badge>}
                        </div>
                        <p className="priority-rank-expl">{row.explanation}</p>
                      </li>
                    ))}
                  </ol>
                )}
                {result && result.warnings?.length > 0 && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <ul className="mb-0 small">
                      {result.warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;
