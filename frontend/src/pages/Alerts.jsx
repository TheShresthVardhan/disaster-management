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

function incidentToAlert(inc) {
  return {
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
  };
}

function Alerts() {
  const { incidents } = useIncidents();
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [copiedId, setCopiedId] = useState(null);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subError, setSubError] = useState(null);
  const [subscription, setSubscription] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('disastell-alert-subscription')) || null;
    } catch {
      return null;
    }
  });
  const [subForm, setSubForm] = useState({
    phone: subscription?.phone || '',
    email: subscription?.email || '',
    push: subscription?.push ?? true,
    sms: subscription?.sms ?? false,
    emailCh: subscription?.emailCh ?? false,
  });
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('disastell-ack-alerts')) || [];
    } catch {
      return [];
    }
  });

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

  const saveSubscription = (e) => {
    e.preventDefault();
    if (subForm.sms && !subForm.phone.trim()) {
      setSubError('Enter a phone number for SMS alerts, or uncheck SMS.');
      return;
    }
    if (subForm.emailCh && !subForm.email.trim()) {
      setSubError('Enter an email address for email alerts, or uncheck Email.');
      return;
    }
    if (!subForm.push && !subForm.sms && !subForm.emailCh) {
      setSubError('Pick at least one channel (Push, SMS, or Email).');
      return;
    }
    const data = {
      phone: subForm.phone.trim(),
      email: subForm.email.trim(),
      push: subForm.push,
      sms: subForm.sms,
      emailCh: subForm.emailCh,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('disastell-alert-subscription', JSON.stringify(data));
    setSubscription(data);
    setSubError(null);
  };

  const unsubscribe = () => {
    localStorage.removeItem('disastell-alert-subscription');
    setSubscription(null);
    setSubForm({ phone: '', email: '', push: true, sms: false, emailCh: false });
  };

  const toggleAcknowledge = (alertId) => {
    setAcknowledgedIds((prev) => {
      const next = prev.includes(alertId) ? prev.filter((id) => id !== alertId) : [...prev, alertId];
      localStorage.setItem('disastell-ack-alerts', JSON.stringify(next));
      return next;
    });
  };

  // Convert citizen incidents to alert format
  const citizenAlerts = useMemo(() =>
    incidents
      .filter(inc => inc.status === 'ACTIVE' && inc.source === 'Citizen Report')
      .map(incidentToAlert),
    [incidents]
  );

  // Resolved / inactive citizen reports power the History tab
  const pastAlerts = useMemo(() =>
    incidents
      .filter(inc => inc.status !== 'ACTIVE' && inc.source === 'Citizen Report')
      .map(incidentToAlert),
    [incidents]
  );

  // Combine official alerts with citizen reports
  const allAlerts = useMemo(() => [...officialAlerts, ...citizenAlerts], [citizenAlerts]);

  const tabAlerts = activeTab === 'history' ? pastAlerts : allAlerts;

  const filteredAlerts = useMemo(() =>
    tabAlerts
      .filter((a) => filterSeverity === 'all' || a.severity === filterSeverity)
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    [filterSeverity, tabAlerts]
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
              <Button
                variant={subscription ? 'primary' : 'outline'}
                size="sm"
                leftIcon="🔔"
                onClick={() => setShowSubscribe((s) => !s)}
                aria-expanded={showSubscribe}
                title={subscription ? 'View your alert subscription' : 'Subscribe to demo alerts'}
              >
                {subscription ? 'Subscribed ✓' : 'Subscribe'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon="⚙️"
                onClick={() => document.getElementById('notification-channels')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                title="Jump to notification channels"
              >
                Channels
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <DemoNotice text={<><strong>Simulated alerts.</strong> Official alerts here are demo samples and citizen reports are stored locally — not verified by authorities. For real emergencies call <strong>112</strong>.</>} />
          </div>
        </header>

        {/* Subscribe panel (demo: stored in this browser only) */}
        {showSubscribe && (
          <Card variant="elevated" className="mb-4">
            <CardHeader title="Alert Subscription" subtitle="Demo only — saved in this browser, no messages are actually sent" />
            <CardBody>
              {subscription ? (
                <div>
                  <p className="mb-2">
                    Subscribed via{' '}
                    <strong>
                      {[subscription.push && 'Push', subscription.sms && 'SMS', subscription.emailCh && 'Email'].filter(Boolean).join(', ')}
                    </strong>
                    {subscription.phone && <> · SMS: {subscription.phone}</>}
                    {subscription.email && <> · Email: {subscription.email}</>}
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => { setSubscription(null); setSubForm({ phone: subscription.phone || '', email: subscription.email || '', push: !!subscription.push, sms: !!subscription.sms, emailCh: !!subscription.emailCh }); }}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={unsubscribe}>
                      Unsubscribe
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={saveSubscription}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="sub-phone" className="form-label">Phone (for SMS)</label>
                      <input
                        type="tel"
                        id="sub-phone"
                        className="form-control"
                        placeholder="e.g. 98765 43210"
                        value={subForm.phone}
                        onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="sub-email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="sub-email"
                        className="form-control"
                        placeholder="you@example.com"
                        value={subForm.email}
                        onChange={(e) => setSubForm({ ...subForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3 flex-wrap mt-3">
                    {[
                      ['push', 'Push notifications'],
                      ['sms', 'SMS'],
                      ['emailCh', 'Email'],
                    ].map(([key, label]) => (
                      <label key={key} className="form-check d-flex align-items-center gap-2 mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={subForm[key]}
                          onChange={(e) => setSubForm({ ...subForm, [key]: e.target.checked })}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  {subError && <div className="alert alert-danger mt-3 mb-0 py-2 small">{subError}</div>}
                  <Button variant="primary" size="sm" type="submit" className="mt-3">
                    Save Subscription
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>
        )}

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
            title="Resolved citizen reports"
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
                  icon={activeTab === 'history' ? '📜' : '🔍'}
                  title={activeTab === 'history' ? 'No past alerts yet' : 'No alerts match current filter'}
                  description={activeTab === 'history' ? 'Resolved citizen reports will appear here' : 'Try adjusting your severity filter'}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAcknowledge(alert.id)}
                            aria-pressed={acknowledgedIds.includes(alert.id)}
                            title={acknowledgedIds.includes(alert.id) ? 'Marked as seen — click to undo' : 'Mark this alert as seen'}
                          >
                            {acknowledgedIds.includes(alert.id) ? 'Acknowledged ✓' : 'Acknowledge'}
                          </Button>
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
              <div id="notification-channels">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-100 mt-3"
                    onClick={() => { setShowSubscribe(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    title="Open subscription preferences"
                  >
                    Manage Preferences
                  </Button>
                </CardBody>
              </Card>
              </div>

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