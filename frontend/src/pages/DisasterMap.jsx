import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents } from '../context/IncidentContext';
import { Button, Card, CardHeader, CardBody, Badge, PlaceholderCard } from '../components/ui';
import './DisasterMap.css';

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS_URL = `https://cdn.jsdelivr.net/npm/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_CSS_URL = `https://cdn.jsdelivr.net/npm/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;

// Sikkim-first view: geographic centre of the state, zoomed to show the region.
const SIKKIM_CENTER = [27.53, 88.51];
const SIKKIM_ZOOM = 8;
// Soft containment so the prototype stays focused on Sikkim (not a boundary).
const SIKKIM_MAX_BOUNDS = [[26.6, 87.6], [28.4, 89.3]];

const SEVERITY_META = {
  critical: { label: 'Critical', color: '#dc3545' },
  high: { label: 'High', color: '#fd7e14' },
  moderate: { label: 'Medium', color: '#0dcaf0' },
  low: { label: 'Low', color: '#198754' },
};
const FILTERS = ['all', 'critical', 'high', 'moderate', 'low'];

// Load Leaflet from CDN once (no new npm dependency).
let leafletPromise = null;
function loadLeaflet() {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS_URL;
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => (
      window.L ? resolve(window.L) : reject(new Error('Map library failed to initialise'))
    );
    script.onerror = () => reject(new Error('Could not load the map library (network required)'));
    document.body.appendChild(script);
    setTimeout(() => reject(new Error('Map library load timed out')), 15000);
  }).catch((err) => {
    leafletPromise = null;
    throw err;
  });
  return leafletPromise;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatType(disasterType) {
  const raw = String(disasterType || 'incident');
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
}

function popupHtml(incident) {
  const sev = (incident.severity || 'low').toLowerCase();
  const meta = SEVERITY_META[sev] || SEVERITY_META.low;
  const when = incident.timestamp ? new Date(incident.timestamp).toLocaleString() : 'Unknown';
  return `
    <div class="map-popup">
      <div class="map-popup-title">${esc(formatType(incident.disasterType))}</div>
      <div class="map-popup-sev"><span class="map-popup-dot" style="background:${meta.color}"></span>${esc(meta.label)}</div>
      <div class="map-popup-row"><strong>Location:</strong> ${esc(incident.location || 'Unknown')}</div>
      <div class="map-popup-row"><strong>Affected:</strong> ${esc(incident.affectedPeople ?? 0)} people</div>
      <div class="map-popup-row"><strong>Status:</strong> ${esc(incident.status || 'ACTIVE')}</div>
      <div class="map-popup-row"><strong>Reported:</strong> ${esc(when)}</div>
    </div>`;
}

function DisasterMap() {
  const { incidents } = useIncidents();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [mapStatus, setMapStatus] = useState('loading'); // loading | ready | error
  const [mapError, setMapError] = useState(null);
  const [mapAttempt, setMapAttempt] = useState(0);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Live data: re-renders automatically when IncidentContext/Firebase updates.
  const activeIncidents = incidents.filter((inc) => inc.status === 'ACTIVE');
  const plottable = activeIncidents.filter(
    (inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
  );
  const visible = severityFilter === 'all'
    ? plottable
    : plottable.filter((inc) => (inc.severity || '').toLowerCase() === severityFilter);
  const countFor = (f) => (f === 'all'
    ? plottable.length
    : plottable.filter((inc) => (inc.severity || '').toLowerCase() === f).length);

  // Initialise the map once per attempt.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElRef.current || mapRef.current) return;
        const map = L.map(mapElRef.current, {
          center: SIKKIM_CENTER,
          zoom: SIKKIM_ZOOM,
          minZoom: 7,
          maxZoom: 16,
          maxBounds: SIKKIM_MAX_BOUNDS,
          maxBoundsViscosity: 0.8,
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMapStatus('ready');
      })
      .catch((err) => {
        if (!cancelled) {
          setMapError(err.message || 'Map failed to load');
          setMapStatus('error');
        }
      });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, [mapAttempt]);

  // Re-render markers whenever live data or the filter changes.
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current || !window.L || !layerRef.current) return;
    const layer = layerRef.current;
    layer.clearLayers();
    visible.forEach((inc) => {
      const sev = (inc.severity || 'low').toLowerCase();
      const meta = SEVERITY_META[sev] || SEVERITY_META.low;
      const marker = window.L.circleMarker([inc.latitude, inc.longitude], {
        radius: sev === 'critical' ? 11 : 9,
        color: '#ffffff',
        weight: 2,
        fillColor: meta.color,
        fillOpacity: 0.9,
      });
      marker.bindPopup(popupHtml(inc), { maxWidth: 280 });
      marker.addTo(layer);
    });
  }, [mapStatus, incidents, severityFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = () => {
    setMapError(null);
    setMapStatus('loading');
    setMapAttempt((a) => a + 1);
  };

  return (
    <div className="page map-page">
      <div className="container-fluid px-3 px-md-4">
        <header className="page-header mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="page-header-icon" aria-hidden="true">🗺️</div>
            <div>
              <h1 className="h2 fw-bold mb-1">Disaster Map — Sikkim</h1>
              <p className="text-muted mb-0">
                Live incident markers across Sikkim from stored GPS coordinates.
              </p>
            </div>
            <Badge variant="info" size="md" className="ms-auto">Sikkim Pilot</Badge>
          </div>
          <div className="map-notice">
            <div className="map-notice-badge">Prototype</div>
            <div className="map-notice-text">
              Markers show real stored incidents (including demo seed data). No live
              government feeds — for real emergencies call <strong>112</strong>.
            </div>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <Card variant="elevated" className="h-100">
              <CardHeader
                title="Sikkim — Active Incidents"
                subtitle={`${visible.length} of ${activeIncidents.length} active incidents shown`}
              />
              <CardBody>
                <div className="map-filters" role="group" aria-label="Filter markers by severity">
                  {FILTERS.map((f) => (
                    <Button
                      key={f}
                      variant={severityFilter === f ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSeverityFilter(f)}
                      aria-pressed={severityFilter === f}
                    >
                      {f === 'all' ? 'All' : SEVERITY_META[f].label} ({countFor(f)})
                    </Button>
                  ))}
                </div>

                {mapStatus !== 'error' && (
                  <div className="map-leaflet-wrap">
                    <div ref={mapElRef} className="map-leaflet" role="application" aria-label="Sikkim disaster incident map" />
                    {mapStatus === 'loading' && (
                      <div className="map-loading">
                        <span className="spinner-border text-primary" aria-hidden="true" />
                        <span>Loading map…</span>
                      </div>
                    )}
                  </div>
                )}

                {mapStatus === 'error' && (
                  <div className="map-fallback">
                    <p className="fw-semibold mb-1">Map unavailable: {mapError}</p>
                    <p className="text-muted small mb-3">
                      Showing the same incidents as a list instead. Check your connection and retry.
                    </p>
                    <ul className="map-fallback-list">
                      {visible.map((inc) => (
                        <li key={inc.incidentId}>
                          <strong>{formatType(inc.disasterType)}</strong> — {inc.location || 'Unknown'} ({inc.severity})
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" onClick={retry} className="mt-2">
                      Retry Map
                    </Button>
                  </div>
                )}

                <div className="map-legend" aria-label="Severity legend">
                  {Object.entries(SEVERITY_META).map(([level, meta]) => (
                    <span key={level} className="map-legend-item">
                      <span className="map-legend-dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                      {meta.label}
                    </span>
                  ))}
                  <span className="map-legend-src">© OpenStreetMap contributors</span>
                </div>

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
              title="What's Next"
              description="The Sikkim pilot map is live. Planned extensions:"
              icon="🚀"
              features={[
                'Expansion beyond Sikkim',
                'Live government disaster feeds',
                'Satellite / GIS data overlays',
                'Predictive risk layers',
                'Advanced heatmaps',
                'Real-time road & traffic info',
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisasterMap;
