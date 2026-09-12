import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, CardBody, Badge } from '../components/ui';
import { useIncidents } from '../context/IncidentContext';
import './EmergencySOS.css';

const SATELLITE_NOTE = 'Future scope: integration with authorized government satellite/emergency communication infrastructure for areas without terrestrial connectivity.';

function EmergencySOS() {
  const { addIncident } = useIncidents();
  const [stage, setStage] = useState('idle'); // idle, countdown, activated, optional-info
  const [countdown, setCountdown] = useState(3);
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [incident, setIncident] = useState(null);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [optionalInfo, setOptionalInfo] = useState({
    name: '',
    description: '',
    contact: '',
  });
  const countdownRef = useRef(null);
  const holdTimerRef = useRef(null);
  const sosButtonRef = useRef(null);
  const activateSOSRef = useRef(null);

  // Online/offline detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load pending incidents from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('disaster-intel-pending-sos');
    if (stored) {
      try {
        setPendingIncidents(JSON.parse(stored));
      } catch {
        localStorage.removeItem('disaster-intel-pending-sos');
      }
    }
  }, []);

  // Save pending incidents to localStorage
  useEffect(() => {
    localStorage.setItem('disaster-intel-pending-sos', JSON.stringify(pendingIncidents));
  }, [pendingIncidents]);

  // Sync pending incidents when coming online
  useEffect(() => {
    if (isOnline && pendingIncidents.length > 0) {
      pendingIncidents.forEach((pendingInc) => {
        addIncident(pendingInc);
      });
      setPendingIncidents([]);
    }
  }, [isOnline, pendingIncidents, addIncident]);

  // Generate unique incident ID
  const generateIncidentId = useCallback(() => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SOS-${timestamp}-${random}`;
  }, []);

  // Get current GPS location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported by this browser');
        resolve({ latitude: null, longitude: null, locationName: 'Unknown (GPS not supported)' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocationError(null);
          resolve({ latitude, longitude, locationName });
        },
        (error) => {
          let errorMsg = 'Unable to retrieve location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission denied. Enable in browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location unavailable. GPS signal may be weak.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out.';
          }
          setLocationError(errorMsg);
          resolve({ latitude: null, longitude: null, locationName: 'Unknown (location unavailable)' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  // Activate SOS - defined first so it can be used by startCountdown
  const activateSOS = useCallback(async () => {
    const loc = await getCurrentLocation();
    const incidentId = generateIncidentId();
    const timestamp = new Date().toISOString();

    const newIncident = {
      incidentId,
      source: 'Emergency SOS',
      disasterType: 'Emergency SOS',
      severity: 'critical',
      location: loc.locationName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      description: 'Emergency SOS activated by user. No additional details provided at activation.',
      affectedPeople: 0,
      timestamp,
      status: 'ACTIVE',
      isPendingSync: !isOnline,
    };

    if (isOnline) {
      addIncident(newIncident);
      newIncident.isPendingSync = false;
    } else {
      setPendingIncidents((prev) => [...prev, newIncident]);
    }

    setIncident(newIncident);
    setStage('activated');
  }, [isOnline, addIncident, getCurrentLocation, generateIncidentId]);

  // Store activateSOS in ref for use in startCountdown
  useEffect(() => {
    activateSOSRef.current = activateSOS;
  }, [activateSOS]);

  const startCountdown = useCallback(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          if (activateSOSRef.current) activateSOSRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  // Handle mouse/touch down - start hold timer
  const handleSOSPress = useCallback(() => {
    if (stage !== 'idle') return;
    holdTimerRef.current = setTimeout(() => {
      setStage('countdown');
      setCountdown(3);
      startCountdown();
    }, 500); // 500ms hold to prevent accidental activation
  }, [stage, startCountdown]);

  // Handle mouse/touch up - cancel hold timer
  const handleSOSRelease = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const cancelSOS = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setStage('idle');
    setCountdown(3);
    setLocationError(null);
    setIncident(null);
  }, []);

  const handleOptionalInfoSubmit = useCallback(() => {
    if (incident) {
      const updatedIncident = {
        ...incident,
        description: optionalInfo.description || incident.description,
        // Store optional info in a way that doesn't break the existing schema
        _optional: {
          name: optionalInfo.name,
          contact: optionalInfo.contact,
        },
      };
      if (isOnline) {
        addIncident(updatedIncident);
      } else {
        setPendingIncidents((prev) => [...prev, updatedIncident]);
      }
    }
    setStage('idle');
    setIncident(null);
    setOptionalInfo({ name: '', description: '', contact: '' });
  }, [incident, optionalInfo, isOnline, addIncident]);

  const skipOptionalInfo = useCallback(() => {
    setStage('idle');
    setIncident(null);
  }, []);

  return (
    <div className="page sos-page">
      <div className="container-fluid px-3 px-md-4">
        <header className="page-header mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="page-header-icon" aria-hidden="true">🆘</div>
            <div>
              <h1 className="h2 fw-bold mb-1">Emergency SOS</h1>
              <p className="text-muted mb-0">
                Hold the button below for 3 seconds to activate Emergency SOS.
                Automatically captures your location and creates a CRITICAL incident.
              </p>
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="prototype-notice">
            <div className="prototype-badge">PROTOTYPE</div>
            <div className="prototype-text">
              <strong>Important:</strong> This creates an emergency incident in local storage only.
              It does NOT contact 112 or any emergency service. <strong>Call 112 directly for real emergencies.</strong>
            </div>
          </div>

          {/* Connectivity Status */}
          <div className={`connectivity-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="connectivity-indicator" aria-hidden="true"></span>
            <span>
              {isOnline ? 'Online — SOS incident will be stored immediately' : '⚠️ Offline — SOS incident will be saved locally and synced when connection returns'}
            </span>
          </div>
        </header>

        {/* Main SOS Interface */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-7">
            {/* Stage: Idle - Show SOS Button */}
            {stage === 'idle' && (
              <Card variant="elevated" className="sos-main-card">
                <CardBody className="p-5 text-center">
                  <div className="sos-button-wrapper mb-4">
                    <button
                      ref={sosButtonRef}
                      className="sos-button"
                      onMouseDown={handleSOSPress}
                      onMouseUp={handleSOSRelease}
                      onMouseLeave={handleSOSRelease}
                      onTouchStart={(e) => { e.preventDefault(); handleSOSPress(); }}
                      onTouchEnd={handleSOSRelease}
                      onTouchCancel={handleSOSRelease}
                      aria-label="Hold for 3 seconds to activate Emergency SOS"
                    >
                      <span className="sos-icon" aria-hidden="true">🆘</span>
                      <span className="sos-text">Hold for Emergency SOS</span>
                    </button>
                    <p className="mt-3 text-muted small">
                      Hold for ~0.5s to start 3-second countdown. Release anytime to cancel.
                    </p>
                  </div>

                  <div className="sos-features row g-3 mt-4">
                    <div className="col-12 col-md-4">
                      <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">📍</div>
                        <div className="fw-medium small">Auto GPS Location</div>
                        <div className="text-muted small">Captures coordinates automatically</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">⚡</div>
                        <div className="fw-medium small">CRITICAL Severity</div>
                        <div className="text-muted small">Highest priority for responders</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">💾</div>
                        <div className="fw-medium small">Works Offline</div>
                        <div className="text-muted small">Queued for sync when online</div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Stage: Countdown */}
            {stage === 'countdown' && (
              <Card variant="elevated" className="sos-main-card border-danger">
                <CardBody className="p-5 text-center">
                  <div className="sos-countdown mb-4">
                    <div className="countdown-circle" role="timer" aria-live="polite" aria-label={`${countdown} seconds remaining`}>
                      <span className="countdown-number">{countdown}</span>
                    </div>
                    <p className="mt-3 fw-semibold text-danger">
                      Emergency SOS activating in {countdown}...
                    </p>
                    <Button variant="outlineDanger" size="lg" onClick={cancelSOS} className="mt-3">
                      Cancel
                    </Button>
                  </div>
                  <div className="sos-info mt-4 p-3 rounded bg-danger bg-opacity-10 border border-danger">
                    <h5 className="fw-semibold mb-2">What happens next:</h5>
                    <ul className="text-start small mb-0">
                      <li>GPS location captured automatically</li>
                      <li>CRITICAL Emergency SOS incident created</li>
                      <li>Unique reference ID generated</li>
                      <li>Stored locally & synced when online</li>
                      <li><strong>Does NOT call 112 automatically</strong></li>
                    </ul>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Stage: Activated - Show Result */}
            {stage === 'activated' && incident && (
              <Card variant="elevated" className="sos-main-card">
                <CardBody className="p-5 text-center">
                  <div className="success-icon mb-3" aria-hidden="true">
                    <span className="success-icon-inner">✅</span>
                  </div>
                  <h2 className="mb-2">SOS Activated</h2>
                  <p className="lead text-muted mb-4">
                    Emergency incident created with CRITICAL severity.
                  </p>

                  <div className="reference-code mb-3">
                    <strong>Reference ID:</strong>{' '}
                    <code>{incident.incidentId}</code>
                  </div>

                  <div className="incident-details mb-4 p-3 rounded bg-surface-hover border">
                    <div className="row g-2 small text-start">
                      <div className="col-6"><strong>Timestamp:</strong> {new Date(incident.timestamp).toLocaleString()}</div>
                      <div className="col-6"><strong>Severity:</strong> <Badge severity="critical" size="sm" /> CRITICAL</div>
                      <div className="col-6"><strong>Type:</strong> {incident.disasterType}</div>
                      <div className="col-6"><strong>Source:</strong> {incident.source}</div>
                      <div className="col-6"><strong>Location:</strong> {incident.location || 'Unknown'}</div>
                      <div className="col-6">
                        <strong>Coordinates:</strong>{' '}
                        {incident.latitude && incident.longitude ? (
                          <>
                            {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                          </>
                        ) : (
                          <span className="text-danger">Unavailable</span>
                        )}
                      </div>
                      <div className="col-12">
                        <strong>Sync Status:</strong>{' '}
                        {incident.isPendingSync ? (
                          <Badge variant="warning" size="sm">Pending Sync (Offline)</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Stored Successfully</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {locationError && (
                    <div className="alert alert-warning mb-3 p-3">
                      <strong>⚠️ Location Notice:</strong> {locationError}
                    </div>
                  )}

                  {!isOnline && (
                    <div className="alert alert-warning mb-3 p-3">
                      <strong>⚠️ Offline:</strong> Incident saved locally. Will sync when connection returns.
                    </div>
                  )}

                  <div className="d-flex gap-3 justify-content-center flex-wrap mb-4">
                    <Button variant="primary" size="lg" onClick={() => setStage('optional-info')} rightIcon="📝">
                      Add Optional Details
                    </Button>
                    <Button variant="outline" size="lg" onClick={skipOptionalInfo}>
                      Done
                    </Button>
                  </div>

                  {/* Call 112 Button - Prominent */}
                  <a
                    href="tel:112"
                    className="btn btn-call-112 btn-lg px-5 d-inline-flex align-items-center gap-2"
                    aria-label="Call Emergency Services 112"
                  >
                    <span aria-hidden="true">📞</span>
                    <span>Call 112</span>
                  </a>
                  <p className="mt-2 text-muted small">
                    Calling 112 is separate from this SOS incident. This app does not auto-dial.
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Stage: Optional Info */}
            {stage === 'optional-info' && incident && (
              <Card variant="elevated" className="sos-main-card">
                <CardBody className="p-5">
                  <h3 className="mb-4 text-center">Add Optional Details (Not Required)</h3>
                  <p className="text-muted text-center mb-4">
                    This information helps responders but is not required. Your SOS incident is already recorded.
                  </p>

                  <div className="mb-3">
                    <label htmlFor="sos-name" className="form-label">Your Name</label>
                    <input
                      type="text"
                      id="sos-name"
                      className="form-control"
                      placeholder="Optional"
                      value={optionalInfo.name}
                      onChange={(e) => setOptionalInfo({...optionalInfo, name: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="sos-contact" className="form-label">Contact (Phone/Email)</label>
                    <input
                      type="tel"
                      id="sos-contact"
                      className="form-control"
                      placeholder="Optional - for follow-up"
                      value={optionalInfo.contact}
                      onChange={(e) => setOptionalInfo({...optionalInfo, contact: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="sos-desc" className="form-label">Additional Details</label>
                    <textarea
                      id="sos-desc"
                      className="form-control"
                      rows={4}
                      placeholder="What happened? Injuries? Hazards? (Optional)"
                      value={optionalInfo.description}
                      onChange={(e) => setOptionalInfo({...optionalInfo, description: e.target.value})}
                    />
                  </div>

                  <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <Button variant="primary" size="lg" onClick={handleOptionalInfoSubmit} rightIcon="💾">
                      Save & Finish
                    </Button>
                    <Button variant="outline" size="lg" onClick={skipOptionalInfo}>
                      Skip & Finish
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* Call 112 Section - Always Visible */}
        <section className="call-112-section mt-4" aria-labelledby="call-title">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h3 id="call-title" className="h4 fw-bold text-danger mb-3 d-flex align-items-center justify-content-center gap-2">
                <span aria-hidden="true">🚨</span>
                Real Emergency — Call 112
              </h3>
              <p className="text-muted mb-3">
                This application does <strong>not</strong> automatically contact emergency services.
                For any real emergency, call 112 immediately.
              </p>
              <a
                href="tel:112"
                className="btn btn-call-112 btn-lg px-5 d-inline-flex align-items-center gap-2 mb-3"
                aria-label="Call Emergency Services 112"
              >
                <span aria-hidden="true" style={{fontSize: '1.5rem'}}>📞</span>
                <span style={{fontSize: '1.25rem'}}>Call 112 Now</span>
              </a>
              <p className="text-muted small mb-0">
                Single number for Police, Fire, Medical & Disaster (India). Works on all mobile networks.
              </p>
            </div>
          </div>
        </section>

        {/* Future Scope Note */}
        <section className="future-scope mt-4" aria-labelledby="future-title">
          <div className="card border-info">
            <div className="card-body">
              <h4 id="future-title" className="h5 fw-bold text-info mb-2 d-flex align-items-center gap-2">
                <span aria-hidden="true">🛰️</span>
                Future Scope
              </h4>
              <p className="text-muted small mb-0">
                {SATELLITE_NOTE}
              </p>
            </div>
          </div>
        </section>

        {/* Pending Incidents Notice */}
        {pendingIncidents.length > 0 && (
          <section className="pending-incidents mt-4" aria-labelledby="pending-title">
            <div className="card border-warning">
              <div className="card-body">
                <h4 id="pending-title" className="h5 fw-bold text-warning mb-2 d-flex align-items-center gap-2">
                  <span aria-hidden="true">⏳</span>
                  Pending SOS Incidents ({pendingIncidents.length})
                </h4>
                <p className="text-muted small mb-2">
                  These incidents were created while offline and will sync automatically when connection returns.
                </p>
                <div className="row g-2">
                  {pendingIncidents.slice(0, 3).map((p) => (
                    <div key={p.incidentId} className="col-12 col-md-4">
                      <div className="pending-item p-2 rounded bg-warning bg-opacity-10 border border-warning">
                        <code className="d-block small">{p.incidentId}</code>
                        <span className="small text-muted">{new Date(p.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {pendingIncidents.length > 3 && (
                    <div className="col-12">
                      <small className="text-muted">...and {pendingIncidents.length - 3} more</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Emergency Preparedness Info */}
        <section className="emergency-info mt-5" aria-labelledby="info-title">
          <h2 id="info-title" className="h4 fw-bold text-center mb-4">Emergency Preparedness</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 info-card">
                <CardBody>
                  <h3 className="h6 fw-semibold mb-2">Before an Emergency</h3>
                  <ul className="small text-muted mb-0">
                    <li>Save 112 in phone favorites</li>
                    <li>Enable location permissions for apps</li>
                    <li>Complete medical info in health app</li>
                    <li>Share location with trusted contacts</li>
                    <li>Know your address and landmarks</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 info-card">
                <CardBody>
                  <h3 className="h6 fw-semibold mb-2">During an Emergency</h3>
                  <ul className="small text-muted mb-0">
                    <li><strong>Call 112 FIRST</strong></li>
                    <li>Stay calm, speak clearly</li>
                    <li>Give exact location first</li>
                    <li>Describe emergency & injuries</li>
                    <li>Follow dispatcher instructions</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 info-card">
                <CardBody>
                  <h3 className="h6 fw-semibold mb-2">After an Emergency</h3>
                  <ul className="small text-muted mb-0">
                    <li>Check for injuries</li>
                    <li>Contact emergency contacts</li>
                    <li>Document damage for insurance</li>
                    <li>Follow official instructions</li>
                    <li>Access recovery resources</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <Card variant="outlined" hoverable className="h-100 info-card">
                <CardBody>
                  <h3 className="h6 fw-semibold mb-2">Accessibility</h3>
                  <ul className="small text-muted mb-0">
                    <li>Voice activation (planned)</li>
                    <li>Screen reader compatible</li>
                    <li>High contrast mode</li>
                    <li>Large touch targets</li>
                    <li>Haptic feedback (mobile)</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EmergencySOS;