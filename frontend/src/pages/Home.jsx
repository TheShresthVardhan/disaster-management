import { Link } from 'react-router-dom';
import { useIncidents } from '../context/IncidentContext';
import { Button, Card, CardHeader, CardBody, Badge, StatsCard, PlaceholderCard, EmptyState } from '../components/ui';
import './Home.css';

const riskForecast = [
  { hazard: 'Flash Flooding', risk: 'high', area: 'Teesta River Basin', timeframe: 'Next 6-12 hrs', confidence: '78%' },
  { hazard: 'Landslide Risk', risk: 'high', area: 'Gangtok-Nathula Highway', timeframe: 'Next 12-24 hrs', confidence: '82%' },
  { hazard: 'Aftershocks', risk: 'moderate', area: 'North Sikkim', timeframe: 'Next 48 hrs', confidence: '65%' },
  { hazard: 'Glacial Lake Outburst', risk: 'moderate', area: 'Lhonak Lake, North Sikkim', timeframe: 'Next 24-48 hrs', confidence: '55%' },
];

const priorityAreas = [
  { rank: 1, area: 'Teesta River Valley', reason: 'High flood risk during monsoon, vulnerable communities along river', resources: 'Rescue boats, sandbags, medical teams, evacuation shelters' },
  { rank: 2, area: 'Gangtok-Nathula Highway (NH-310)', reason: 'Frequent landslides blocking critical supply route', resources: 'Earthmoving equipment, geotechnical teams, traffic management' },
  { rank: 3, area: 'Lhonak Lake Region', reason: 'Glacial lake expansion, GLOF risk to downstream communities', resources: 'Early warning systems, evacuation planning, monitoring equipment' },
];

function Home() {
  const { activeIncidents } = useIncidents();

  // Combine demo incidents with user-submitted incidents
  const allActiveIncidents = activeIncidents.map((inc, index) => ({
    ...inc,
    id: inc.incidentId || `demo-${index}`,
    type: inc.disasterType.charAt(0).toUpperCase() + inc.disasterType.slice(1).replace('_', ' '),
    severity: inc.severity,
    location: inc.location,
    affected: inc.affectedPeople,
    updated: formatTimeAgo(inc.timestamp),
  }));

  const totalAffected = allActiveIncidents.reduce((sum, i) => sum + (i.affected || 0), 0);
  const highRiskCount = riskForecast.filter(r => r.risk === 'critical' || r.risk === 'high').length;

  return (
    <div className="page home-page">
      {/* Hero / Status Overview */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="container-fluid px-3 px-md-4">
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="hero-content">
                <div className="hero-status-badge">
                  <span className="status-indicator" aria-hidden="true"></span>
                  <span>System Operational</span>
                </div>
                <h1 id="hero-title" className="hero-title">
                  Disaster Intelligence Dashboard
                </h1>
                <p className="hero-subtitle">
                  Real-time incident tracking, risk forecasting, and coordinated response guidance.
                  Last updated <span className="last-updated">just now</span>
                </p>
                <div className="hero-actions">
                  <Button variant="primary" size="lg" as={Link} to="/report" leftIcon="📝">
                    Report Incident
                  </Button>
                  <Button variant="outline" size="lg" as={Link} to="/map" leftIcon="🗺️">
                    View Incident Map
                  </Button>
                  <Button variant="danger" size="lg" as={Link} to="/sos" leftIcon="🆘">
                    Emergency SOS
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="hero-stats">
                <StatsCard value={allActiveIncidents.length} label="Active Incidents" icon="🚨" iconBg="var(--bs-danger-bg-subtle)" variant="danger" />
                <StatsCard value={totalAffected.toLocaleString()} label="People Affected" icon="👥" iconBg="var(--bs-warning-bg-subtle)" variant="warning" />
                <StatsCard value={highRiskCount} label="High Risk Zones" icon="⚠️" iconBg="var(--bs-info-bg-subtle)" variant="info" />
                <StatsCard value="Sikkim" label="Focus Region" icon="🗺️" iconBg="var(--bs-primary-bg-subtle)" variant="primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Key Questions Section */}
      <section className="key-questions-section" aria-labelledby="key-questions-title">
        <div className="container-fluid px-3 px-md-4">
          <header className="section-header">
            <h2 id="key-questions-title" className="section-title">Situation Overview</h2>
            <p className="section-subtitle">Answering the three critical questions for emergency response</p>
          </header>
          
          <div className="row g-4">
            {/* What is happening */}
            <div className="col-12 col-lg-4">
              <Card variant="elevated" hoverable className="h-100 key-question-card">
                <CardHeader 
                  title="What Is Happening Now" 
                  subtitle="Active incidents requiring attention"
                  action={<Badge variant="danger" size="sm">{allActiveIncidents.length} Active</Badge>}
                />
                <CardBody>
                  <div className="incident-list">
                    {allActiveIncidents.length === 0 ? (
                      <EmptyState
                        size="sm"
                        icon="✅"
                        title="No active incidents"
                        description="All clear for now. Report an incident if you observe one."
                      />
                    ) : (
                      allActiveIncidents.map((incident) => (
                        <div key={incident.id} className="incident-item">
                          <div className="incident-type">
                            <Badge variant="severity" severity={incident.severity} size="sm" />
                            <span className="incident-name">{incident.type}</span>
                            {incident.source === 'Citizen Report' && (
                              <Badge variant="info" size="sm" className="ms-1">Citizen</Badge>
                            )}
                          </div>
                          <div className="incident-details">
                            <span className="incident-location">{incident.location}</span>
                            <span className="incident-affected">{incident.affected?.toLocaleString() || 0} affected</span>
                          </div>
                          <div className="incident-meta">
                            <span className="incident-updated">{incident.updated}</span>
                            <Button variant="ghost" size="sm" as={Link} to={`/map?incident=${incident.id}`}>
                              Details
                            </Button>
                          </div>
</div>
                      ))
                    )}
                  </div>
                  <div className="incident-footer">
                    <Button variant="outline" size="sm" as={Link} to="/map" fullWidth>
                      View All Incidents →
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* What may happen next */}
            <div className="col-12 col-lg-4">
              <Card variant="elevated" hoverable className="h-100 key-question-card">
                <CardHeader 
                  title="What May Happen Next" 
                  subtitle="Risk forecast based on current data"
                  action={<Badge variant="warning" size="sm">{riskForecast.length} Forecasts</Badge>}
                />
                <CardBody>
                  <div className="forecast-list">
                    {riskForecast.map((forecast) => (
                      <div key={forecast.hazard} className="forecast-item">
                        <div className="forecast-header">
                          <Badge severity={forecast.risk} size="sm" />
                          <span className="forecast-hazard">{forecast.hazard}</span>
                        </div>
                        <div className="forecast-details">
                          <span className="forecast-area">{forecast.area}</span>
                          <span className="forecast-timeframe">{forecast.timeframe}</span>
                        </div>
                        <div className="forecast-confidence">
                          <span className="confidence-label">Confidence</span>
                          <span className="confidence-value">{forecast.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="forecast-footer">
                    <Button variant="outline" size="sm" as={Link} to="/alerts" fullWidth>
                      View All Alerts →
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Where help should go first */}
            <div className="col-12 col-lg-4">
              <Card variant="elevated" hoverable className="h-100 key-question-card priority-card">
                <CardHeader 
                  title="Where Help Should Go First" 
                  subtitle="Priority areas for resource deployment"
                  action={<Badge variant="primary" size="sm">{priorityAreas.length} Zones</Badge>}
                />
                <CardBody>
                  <div className="priority-list">
                    {priorityAreas.map((area) => (
                      <div key={area.rank} className="priority-item">
                        <div className="priority-rank">{area.rank}</div>
                        <div className="priority-info">
                          <h4 className="priority-area">{area.area}</h4>
                          <p className="priority-reason">{area.reason}</p>
                        </div>
                        <div className="priority-resources">
                          <span className="resources-label">Resources needed:</span>
                          <span className="resources-list">{area.resources}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="priority-footer">
                    <Button variant="outline" size="sm" as={Link} to="/safety" fullWidth>
                      View Resource Guidelines →
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="capabilities-section" aria-labelledby="capabilities-title">
        <div className="container-fluid px-3 px-md-4">
          <header className="section-header text-center">
            <h2 id="capabilities-title" className="section-title">Platform Capabilities</h2>
            <p className="section-subtitle">Integrated tools for comprehensive disaster management</p>
          </header>
          
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 capability-card">
                <CardBody className="text-center p-4">
                  <div className="capability-icon" aria-hidden="true">🗺️</div>
                  <h3 className="capability-title">Incident Map</h3>
                  <p className="capability-description">Real-time visualization of active incidents with severity layers, clustering, and detailed popups.</p>
                  <Button variant="outline" size="sm" as={Link} to="/map">
                    Explore Map
                  </Button>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 capability-card">
                <CardBody className="text-center p-4">
                  <div className="capability-icon" aria-hidden="true">📝</div>
                  <h3 className="capability-title">Report Incident</h3>
                  <p className="capability-description">Structured incident reporting with geolocation, media attachments, and automated validation workflows.</p>
                  <Button variant="outline" size="sm" as={Link} to="/report">
                    Submit Report
                  </Button>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 capability-card">
                <CardBody className="text-center p-4">
                  <div className="capability-icon" aria-hidden="true">🚨</div>
                  <h3 className="capability-title">Emergency Alerts</h3>
                  <p className="capability-description">Multi-channel alert distribution with severity-based routing, acknowledgment tracking, and public feeds.</p>
                  <Button variant="outline" size="sm" as={Link} to="/alerts">
                    View Alerts
                  </Button>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 capability-card">
                <CardBody className="text-center p-4">
                  <div className="capability-icon" aria-hidden="true">📚</div>
                  <h3 className="capability-title">Safety Guidelines</h3>
                  <p className="capability-description">Hazard-specific protocols, evacuation routes, shelter locations, and preparedness checklists.</p>
                  <Button variant="outline" size="sm" as={Link} to="/safety">
                    Browse Safety Info
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon / Placeholder */}
      <section className="coming-soon-section" aria-labelledby="coming-soon-title">
        <div className="container-fluid px-3 px-md-4">
          <header className="section-header text-center">
            <h2 id="coming-soon-title" className="section-title">Coming Soon</h2>
            <p className="section-subtitle">Features planned for future phases</p>
          </header>
          
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <PlaceholderCard
                title="AI Risk Analysis"
                description="Predictive modeling for incident progression and resource optimization"
                icon="🤖"
                features={[
                  'Incident trajectory prediction',
                  'Resource allocation optimization',
                  'Vulnerability assessment',
                  'Automated situation reports',
                ]}
              />
            </div>
            <div className="col-12 col-md-4">
              <PlaceholderCard
                title="Community Network"
                description="Verified volunteer coordination and mutual aid matching"
                icon="🤝"
                features={[
                  'Volunteer registration & verification',
                  'Skill-based task matching',
                  'Resource sharing marketplace',
                  'Community resilience scoring',
                ]}
              />
            </div>
            <div className="col-12 col-md-4">
              <PlaceholderCard
                title="Recovery Tracking"
                description="Post-disaster damage assessment and reconstruction monitoring"
                icon="🏗️"
                features={[
                  'Damage assessment workflows',
                  'Insurance claim integration',
                  'Reconstruction progress tracking',
                  'Long-term recovery metrics',
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default Home;