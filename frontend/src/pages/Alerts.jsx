import { useState, useMemo } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { Button, Card, CardHeader, CardBody, Badge, EmptyState, StatsCard, DemoNotice } from '../components/ui';
import './Alerts.css';

const officialAlerts = [
  {
    id: 'alert-1',
    type: 'Flood Warning',
    severity: 'critical',
    area: 'Teesta River Basin, East Sikkim',
    issued: '2024-06-15 14:30 UTC',
    expires: '2024-06-16 06:00 UTC',
    description:
      'Major flooding expected along Teesta River. Water levels rising rapidly due to heavy rainfall. Evacuation orders in effect for low-lying areas near Rangpo and Singtam.',
    action: 'Evacuate immediately. Follow designated routes to higher ground. Do not attempt to drive through flooded roads.',
    channels: ['Emergency Broadcast', 'SMS', 'Push', 'Email'],
    source: 'Official',
  },
  {
    id: 'alert-2',
    type: 'Landslide Alert',
    severity: 'high',
    area: 'Gangtok-Nathula Highway (NH-310)',
    issued: '2024-06-15 10:15 UTC',
    expires: '2024-06-15 22:00 UTC',
    description:
      'Multiple landslides reported blocking NH-310 near 15th Mile and 17th Mile. Road clearance operations underway. Traffic diverted via alternate routes.',
    action: 'Avoid NH-310. Use alternative routes. Monitor BRO updates for road clearance status.',
    channels: ['Push', 'Email', 'SMS'],
    source: 'Official',
  },
  {
    id: 'alert-3',
    type: 'Heavy Rainfall Warning',
    severity: 'moderate',
    area: 'South & West Sikkim Districts',
    issued: '2024-06-15 08:00 UTC',
    expires: '2024-06-15 20:00 UTC',
    description:
      'Heavy to very heavy rainfall expected in South and West Sikkim. Possible flash floods and landslides in vulnerable areas.',
    action: 'Stay indoors. Avoid travel in hilly areas. Keep emergency kit ready.',
    channels: ['Push', 'Email'],
    source: 'Official',
  },
  {
    id: 'alert-4',
    type: 'Glacial Lake Monitoring',
    severity: 'low',
    area: 'Lhonak Lake, North Sikkim',
    issued: '2024-06-14 12:00 UTC',
    expires: '2024-06-21 12:00 UTC',
    description:
      'Lhonak Lake water levels being monitored. Current level stable. No immediate GLOF threat detected.',
    action: 'Continue monitoring. No action required at this time.',
    channels: ['Push'],
    source: 'Official',
  },
];

const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };

function Alerts() {
  const { incidents } = useIncidents();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [copiedId, setCopiedId] = useState(null);

  const shareAlert = async (alert) => {
    const text = `${alert.type} (${alert.severity}) — ${alert.area}\n${alert.description}\nRecommended: ${alert.action}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId((id) => (id === alert.id ? null : id)), 2000);
  };

  // Convert citizen incidents to alert format
  const citizenAlerts = useMemo(() => 
    incidents
      .filter(inc => inc.status === 'ACTIVE' && inc.source === 'Citizen Report')
      .map(inc => ({
        id: inc.incidentId,
        type: `${inc.disasterType.charAt(0).toUpperCase() + inc.disasterType.slice(1).replace('_', ' ')} Report`,
        severity: inc.severity,
        area: inc.location,
        issued: new Date(inc.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        expires: new Date(new Date(inc.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        description: inc.description,
        action: 'Citizen-reported incident. Verify details on ground. Coordinate with local authorities for response.',
        channels: ['Citizen Report'],
        source: 'Citizen Report',
        affectedPeople: inc.affectedPeople,
      })),
    [incidents]
  );

  // Combine official alerts with citizen reports
  const allAlerts = useMemo(() => [...officialAlerts, ...citizenAlerts], [citizenAlerts]);

  const filteredAlerts = useMemo(() => 
    allAlerts
      .filter((a) => filterSeverity === 'all' || a.severity === filterSeverity)
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    [filterSeverity, allAlerts]
  );

  const stats = useMemo(() => ({
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    high: allAlerts.filter(a => a.severity === 'high').length,
    moderate: allAlerts.filter(a => a.severity === 'moderate').length,
    low: allAlerts.filter(a => a.severity === 'low').length,
    total: allAlerts.length,
    citizen: citizenAlerts.length,
    official: officialAlerts.length,
  }), [allAlerts, citizenAlerts.length]);

  return (
    <div className="page alerts-page">
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <header className="page-header mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h2 fw-bold mb-1">Emergency Alerts</h1>
              <p className="text-muted mb-0">
                Official emergency notifications and citizen-reported incidents
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline" size="sm" leftIcon="🔔" disabled title="Alert subscriptions arrive in a future update">
                Subscribe
              </Button>
              <Button variant="primary" size="sm" leftIcon="⚙️" disabled title="Channel settings arrive in a future update">
                Channels
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <DemoNotice text={<><strong>Simulated alerts.</strong> Official alerts here are demo samples and citizen reports are stored locally — not verified by authorities. For real emergencies call <strong>112</strong>.</>} />
          </div>
        </header>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <StatsCard value={stats.total} label="Total Alerts" icon="🚨" variant="default" />
          </div>
          <div className="col-6 col-md-3">
            <StatsCard value={stats.critical} label="Critical" icon="🔴" variant="danger" />
          </div>
          <div className="col-6 col-md-3">
            <StatsCard value={stats.high} label="High" icon="🟠" variant="warning" />
          </div>
          <div className="col-6 col-md-3">
            <StatsCard value={stats.moderate + stats.low} label="Moderate/Low" icon="🟡" variant="info" />
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="row g-2 mb-4">
          <div className="col-6 col-md-3">
            <StatsCard value={stats.official} label="Official Alerts" icon="🏛️" variant="primary" />
          </div>
          <div className="col-6 col-md-3">
            <StatsCard value={stats.citizen} label="Citizen Reports" icon="👥" variant="success" />
          </div>
        </div>

        {/* Tabs */}
        <div className="alert-tabs mb-4" role="tablist">
          <Button
            variant={activeTab === 'active' ? 'primary' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
          >
            Active Alerts
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            disabled
            title="Alert history arrives in a future update"
          >
            History
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar mb-4" role="group" aria-label="Filter alerts by severity">
          <label htmlFor="severityFilter" className="visually-hidden">Filter by severity</label>
          <select
            id="severityFilter"
            className="form-select w-auto d-inline-block"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Alert List */}
        <div className="row">
          <div className="col-lg-8">
            <section aria-label="Alert list" className="alert-list">
              {filteredAlerts.length === 0 ? (
                <EmptyState
                  icon="🔍"
                  title="No alerts match current filter"
                  description="Try adjusting your severity filter"
                />
              ) : (
                filteredAlerts.map((alert) => {
                  const isExpanded = expandedId === alert.id;
                  const isCitizen = alert.source === 'Citizen Report';
                  return (
                    <article
                      key={alert.id}
                      className={`alert-card ${isExpanded ? 'expanded' : ''} ${isCitizen ? 'citizen-report' : ''}`}
                      data-severity={alert.severity}
                    >
                      <div className="alert-card-header">
                        <div className="alert-card-main">
                          <div className="alert-type-row">
                            <Badge severity={alert.severity} size="md" dot />
                            <h3 className="alert-type">{alert.type}</h3>
                            {isCitizen && (
                              <Badge variant="info" size="sm" className="ms-2">Citizen Report</Badge>
                            )}
                          </div>
                          <div className="alert-meta">
                            <span><strong>Area:</strong> {alert.area}</span>
                            <span><strong>Issued:</strong> {alert.issued}</span>
                            <span><strong>Expires:</strong> {alert.expires}</span>
                            {alert.affectedPeople !== undefined && (
                              <span><strong>Affected:</strong> {alert.affectedPeople} people</span>
                            )}
                          </div>
                        </div>
                        <div className="alert-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareAlert(alert)}
                            title="Copy alert summary to clipboard"
                          >
                            {copiedId === alert.id ? 'Copied ✓' : 'Share'}
                          </Button>
                          <Button variant="ghost" size="sm" disabled title="Acknowledgement tracking arrives in a future update">Acknowledge</Button>
                        </div>
                      </div>
                      
                      <div className="alert-card-body">
                        <p className="alert-description">{alert.description}</p>
                        
                        <div className="alert-channels">
                          <span className="channels-label">Channels:</span>
                          <div className="channels-list">
                            {alert.channels.map((channel) => (
                              <Badge key={channel} variant={isCitizen ? 'info' : 'light'} size="sm">{channel}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="alert-card-footer">
                          <h4 className="alert-action-title">Recommended Actions</h4>
                          <p className="alert-action-text">{alert.action}</p>
                          {isCitizen && (
                            <div className="prototype-notice mt-2 p-2 rounded bg-info bg-opacity-10 border border-info">
                              <small><strong>Note:</strong> This is a citizen-submitted incident stored locally in the prototype. It has not been verified by official sources.</small>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          </div>

          <aside className="col-lg-4">
            <div className="sidebar-sticky">
              <Card variant="elevated" className="alert-sidebar-card">
                <CardHeader title="Notification Channels" />
                <CardBody className="p-0">
                  <div className="channel-list">
                    {[
                      { name: 'Push Notifications', status: 'enabled', icon: '🔔', description: 'Real-time alerts on device' },
                      { name: 'SMS', status: 'disabled', icon: '📱', description: 'Text message alerts' },
                      { name: 'Email', status: 'enabled', icon: '📧', description: 'Detailed alert emails' },
                      { name: 'Emergency Broadcast (112)', status: 'system', icon: '📻', description: 'Official emergency alerts' },
                    ].map((channel) => (
                      <div key={channel.name} className="channel-item">
                        <div className="channel-info">
                          <span className="channel-icon" aria-hidden="true">{channel.icon}</span>
                          <div>
                            <span className="channel-name">{channel.name}</span>
                            <span className="channel-description">{channel.description}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={channel.status === 'enabled' ? 'success' : channel.status === 'disabled' ? 'secondary' : 'info'} 
                          size="sm"
                        >
                          {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-100 mt-3" disabled title="Notification preferences arrive in a future update">
                    Manage Preferences
                  </Button>
                </CardBody>
              </Card>

              <Card variant="elevated" className="alert-sidebar-card mt-3">
                <CardHeader title="Alert Statistics" />
                <CardBody className="p-0">
                  <div className="alert-stats-list">
                    {[
                      { label: 'Critical', count: stats.critical, color: 'danger' },
                      { label: 'High', count: stats.high, color: 'warning' },
                      { label: 'Moderate', count: stats.moderate, color: 'info' },
                      { label: 'Low', count: stats.low, color: 'success' },
                    ].map((stat) => (
                      <div key={stat.label} className="alert-stat-item">
                        <div className="alert-stat-info">
                          <Badge variant={stat.color} size="sm">{stat.label}</Badge>
                        </div>
                        <div className="alert-stat-value">{stat.count}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card variant="elevated" className="alert-sidebar-card mt-3">
                <CardHeader title="Demo / Prototype Notice" />
                <CardBody className="p-3">
                  <p className="text-muted small mb-0">
                    This prototype stores citizen reports in browser localStorage only. 
                    Official alerts are simulated. No data is sent to government authorities.
                  </p>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Alerts;