import { Link } from 'react-router-dom';
import { useIncidents } from '../context/IncidentContext';
import { Button, Card, CardHeader, CardBody, Badge, PlaceholderCard } from '../components/ui';
import './DisasterMap.css';

// Approximate Sikkim bounding box for preview positioning
const MAP_BOUNDS = {
  minLat: 26.9,
  maxLat: 28.1,
  minLng: 88.0,
  maxLng: 89.0,
};

const SEVERITY_COLORS = {
  critical: '#dc3545',
  high: '#fd7e14',
  moderate: '#0dcaf0',
  low: '#198754',
};

function toXY(lat, lng) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y = (1 - (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

function DisasterMap() {
  const { activeIncidents } = useIncidents();

  const plottable = activeIncidents.filter(
    (inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
  );
  const unplottable = activeIncidents.filter(
    (inc) => typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number'
  );

  return (
    <div className="page map-page">
      <div className="container-fluid px-3 px-md-4">
        <header className="page-header mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="page-header-icon" aria-hidden="true">🗺️</div>
            <div>
              <h1 className="h2 fw-bold mb-1">Disaster Map</h1>
              <p className="text-muted mb-0">
                Geographic view of active incidents across Sikkim.
              </p>
            </div>
            <Badge variant="warning" size="md" className="ms-auto">Future Updates</Badge>
          </div>
          <div className="prototype-notice">
            <div className="prototype-badge">Preview</div>
            <div className="prototype-text">
              <strong>Interactive map is under development.</strong> Below is a
              simplified preview plotting your current incidents. Full map with
              clustering, heat layers, and live tracking lands in future updates.
            </div>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <Card variant="elevated" className="h-100">
              <CardHeader
                title="Sikkim — Incident Preview"
                subtitle={`${plottable.length} of ${activeIncidents.length} active incidents with coordinates`}
              />
              <CardBody>
                <div
                  className="map-preview"
                  role="img"
                  aria-label={`Preview map showing ${plottable.length} incidents in Sikkim`}
                >
                  <div className="map-preview-grid" aria-hidden="true" />
                  {plottable.map((inc) => {
                    const { x, y } = toXY(inc.latitude, inc.longitude);
                    return (
                      <div
                        key={inc.incidentId}
                        className="map-pin"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          '--pin-color': SEVERITY_COLORS[inc.severity] || '#0d6efd',
                        }}
                        title={`${inc.disasterType} — ${inc.location}`}
                      >
                        <span className="map-pin-dot" aria-hidden="true" />
                        <span className="visually-hidden">
                          {inc.disasterType} at {inc.location}, severity {inc.severity}
                        </span>
                      </div>
                    );
                  })}
                  {plottable.length === 0 && (
                    <div className="map-preview-empty">
                      <span aria-hidden="true">🗺️</span>
                      <p>No incidents with coordinates yet — report one to see it here.</p>
                    </div>
                  )}
                  <div className="map-legend" aria-label="Severity legend">
                    {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
                      <span key={level} className="map-legend-item">
                        <span
                          className="map-legend-dot"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        {level}
                      </span>
                    ))}
                  </div>
                </div>

                {unplottable.length > 0 && (
                  <p className="text-muted small mt-3 mb-0">
                    {unplottable.length} active incident{unplottable.length > 1 ? 's' : ''} without
                    GPS coordinates {unplottable.length > 1 ? 'are' : 'is'} listed on the dashboard
                    instead of the preview.
                  </p>
                )}

                <div className="d-flex gap-2 flex-wrap mt-3">
                  <Button variant="primary" size="sm" as={Link} to="/report">
                    Report Incident
                  </Button>
                  <Button variant="outline" size="sm" as={Link} to="/">
                    Back to Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="col-12 col-lg-4">
            <PlaceholderCard
              title="Future Updates"
              description="The full interactive disaster map is on the roadmap."
              icon="🚀"
              features={[
                'Incident clustering for dense areas',
                'Severity heat layers + risk overlays',
                'Live responder / resource tracking',
                'Map filters by type, severity & date',
                'Offline tile caching for field use',
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisasterMap;
