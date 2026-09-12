import { useState } from 'react';
import { Badge, EmptyState, PlaceholderCard, Button } from '../components/ui';
import './DisasterMap.css';

const mockIncidents = [
  { id: 1, type: 'Flood', severity: 'high', location: 'Riverdale County', affected: 12500, updated: '15 min ago' },
  { id: 2, type: 'Wildfire', severity: 'critical', location: 'Pine Valley', affected: 8200, updated: '32 min ago' },
  { id: 3, type: 'Earthquake', severity: 'moderate', location: 'Metro City', affected: 45000, updated: '1 hr ago' },
  { id: 4, type: 'Hurricane', severity: 'high', location: 'Coastal Region', affected: 28000, updated: '2 hrs ago' },
  { id: 5, type: 'Tornado', severity: 'moderate', location: 'Plains County', affected: 3200, updated: '3 hrs ago' },
  { id: 6, type: 'Landslide', severity: 'low', location: 'Mountain Pass', affected: 450, updated: '5 hrs ago' },
];

const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };

function DisasterMap() {
  const [filterTypes, setFilterTypes] = useState([
    'Flood', 'Earthquake', 'Wildfire', 'Hurricane', 'Tornado', 'Landslide', 'Tsunami', 'Volcanic', 'Extreme Heat', 'Extreme Cold', 'Drought'
  ]);
  const [filterSeverity, setFilterSeverity] = useState(['critical', 'high', 'moderate', 'low']);
  const [timeRange, setTimeRange] = useState('24h');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allTypes = ['Flood', 'Earthquake', 'Wildfire', 'Hurricane', 'Tornado', 'Landslide', 'Tsunami', 'Volcanic', 'Extreme Heat', 'Extreme Cold', 'Drought'];
  const allSeverities = ['critical', 'high', 'moderate', 'low'];

  const filteredIncidents = mockIncidents
    .filter(i => filterTypes.includes(i.type))
    .filter(i => filterSeverity.includes(i.severity))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const toggleType = (type) => {
    setFilterTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleSeverity = (sev) => {
    setFilterSeverity(prev => prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]);
  };

  const clearFilters = () => {
    setFilterTypes(allTypes);
    setFilterSeverity(allSeverities);
  };

  return (
    <div className="page map-page">
      <div className="map-header">
        <div className="container-fluid px-3 px-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h2 fw-bold mb-1">Incident Map</h1>
              <p className="text-muted mb-0">Real-time visualization of active incidents</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button variant="primary" size="sm" leftIcon="📝" as="a" href="/report">
                Report Incident
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="map-layout">
        <aside 
          className={`map-sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="Map controls and legend"
        >
          <div className="sidebar-content">
            <header className="sidebar-header">
              <h2 className="h5 fw-bold mb-1">Map Controls</h2>
              <p className="text-muted small mb-0">
                {filteredIncidents.length} of {mockIncidents.length} incidents shown
              </p>
            </header>

            <section className="sidebar-section" aria-labelledby="filters-title">
              <h3 id="filters-title" className="h6 fw-semibold mb-3">Disaster Types</h3>
              <div className="filter-options">
                {allTypes.map((type) => (
                  <label key={type} className={`filter-chip ${filterTypes.includes(type) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filterTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="visually-hidden"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="sidebar-section" aria-labelledby="severity-title">
              <h3 id="severity-title" className="h6 fw-semibold mb-3">Severity</h3>
              <div className="filter-options severity-filters">
                {allSeverities.map((level) => (
                  <label key={level} className={`filter-chip ${filterSeverity.includes(level) ? 'active' : ''} severity-${level}`}>
                    <input
                      type="checkbox"
                      checked={filterSeverity.includes(level)}
                      onChange={() => toggleSeverity(level)}
                      className="visually-hidden"
                    />
                    <span className="d-flex align-items-center gap-2">
                      <span className="severity-dot" aria-hidden="true"></span>
                      <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="sidebar-section" aria-labelledby="time-title">
              <h3 id="time-title" className="h6 fw-semibold mb-3">Time Range</h3>
              <select
                className="form-select form-select-sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </section>

            <Button variant="outline" size="sm" className="w-100" onClick={clearFilters}>
              Clear All Filters
            </Button>

            <section className="sidebar-section" aria-labelledby="legend-title">
              <h3 id="legend-title" className="h6 fw-semibold mb-3">Legend</h3>
              <div className="legend-items">
                {[
                  { level: 'critical', color: '#dc3545', label: 'Critical' },
                  { level: 'high', color: '#fd7e14', label: 'High' },
                  { level: 'moderate', color: '#0dcaf0', label: 'Moderate' },
                  { level: 'low', color: '#198754', label: 'Low' },
                ].map((item) => (
                  <div key={item.level} className="legend-item d-flex align-items-center mb-2">
                    <span
                      className="legend-color me-2"
                      style={{
                        backgroundColor: item.color,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    ></span>
                    <span className="small">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="sidebar-section" aria-labelledby="active-title">
              <h3 id="active-title" className="h6 fw-semibold mb-3">Active Incidents</h3>
              <div className="active-incidents">
                {filteredIncidents.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon="🔍"
                    title="No incidents match filters"
                    description="Adjust your filters to see incidents"
                  />
                ) : (
                  filteredIncidents.map((incident) => (
                    <div key={incident.id} className="incident-item">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-medium small">{incident.type}</span>
                        <Badge severity={incident.severity} size="sm" />
                      </div>
                      <div className="d-flex justify-content-between align-items-center small text-muted">
                        <span>{incident.location}</span>
                        <span>{incident.affected.toLocaleString()} affected</span>
                      </div>
                      <div className="small text-muted mt-1">
                        Updated {incident.updated}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </aside>

        <main className="map-main" role="main" aria-label="Disaster map view">
          <div className="map-container" aria-hidden="true">
            <div className="map-placeholder">
              <div className="map-placeholder-content">
                <div className="map-icon" aria-hidden="true">🗺️</div>
                <h3>Interactive Incident Map</h3>
                <p className="text-muted">
                  Map visualization with real-time incident layers, clustering, 
                  and detailed incident popups will be implemented in Phase 3.
                </p>
                
                <div className="map-features">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <PlaceholderCard
                        title="Real-time Layers"
                        description="Satellite imagery, weather radar, and sensor data overlays"
                        icon="📡"
                        features={['Weather radar', 'Satellite imagery', 'Sensor feeds']}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <PlaceholderCard
                        title="Smart Clustering"
                        description="Automatic grouping of nearby incidents at different zoom levels"
                        icon="🔍"
                        features={['Dynamic clustering', 'Cluster popups', 'Zoom aggregation']}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <PlaceholderCard
                        title="Incident Details"
                        description="Rich popups with severity, affected count, resources, and actions"
                        icon="📋"
                        features={['Severity badge', 'Affected count', 'Resource links', 'Report actions']}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
}

export default DisasterMap;