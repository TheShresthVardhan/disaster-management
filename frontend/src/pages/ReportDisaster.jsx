import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, FormField, FormSection, StepIndicator, Badge } from '../components/ui';
import { useIncidents } from '../context/IncidentContext';
import './ReportDisaster.css';

const formSteps = [
  { id: 'type', label: 'Incident Type', description: 'What happened?' },
  { id: 'severity', label: 'Severity', description: 'How serious?' },
  { id: 'location', label: 'Location', description: 'Where did it occur?' },
  { id: 'details', label: 'Details', description: 'What did you observe?' },
  { id: 'contact', label: 'Contact', description: 'Optional follow-up' },
];

const disasterTypes = [
  { value: 'flood', label: 'Flood', icon: '🌊', description: 'Rising water, flash floods, river overflow' },
  { value: 'earthquake', label: 'Earthquake', icon: '🌍', description: 'Ground shaking, structural damage' },
  { value: 'wildfire', label: 'Wildfire', icon: '🔥', description: 'Forest fire, brush fire, uncontrolled burn' },
  { value: 'cyclone', label: 'Cyclone / Hurricane', icon: '🌀', description: 'Tropical storm, high winds, storm surge' },
  { value: 'tornado', label: 'Tornado', icon: '🌪️', description: 'Funnel cloud, rotating winds, debris' },
  { value: 'landslide', label: 'Landslide', icon: '🏔️', description: 'Mudslide, rockfall, slope failure' },
  { value: 'tsunami', label: 'Tsunami', icon: '🌊', description: 'Seismic sea wave, coastal flooding' },
  { value: 'volcanic', label: 'Volcanic Eruption', icon: '🌋', description: 'Ash, lava, pyroclastic flows' },
  { value: 'extreme_heat', label: 'Extreme Heat', icon: '☀️', description: 'Heat wave, dangerous temperatures' },
  { value: 'extreme_cold', label: 'Extreme Cold', icon: '❄️', description: 'Blizzard, freezing temperatures' },
  { value: 'drought', label: 'Drought', icon: '🏜️', description: 'Prolonged dry period, water shortage' },
  { value: 'other', label: 'Other', icon: '❓', description: 'Other disaster or emergency type' },
];

const severityLevels = [
  { value: 'low', label: 'Low', description: 'Localized impact, minimal damage, no immediate threat to life' },
  { value: 'moderate', label: 'Moderate', description: 'Significant local impact, some infrastructure damage, potential injuries' },
  { value: 'high', label: 'High', description: 'Widespread impact, major damage, injuries likely, evacuations possible' },
  { value: 'critical', label: 'Critical', description: 'Catastrophic, life-threatening, mass casualties, major infrastructure loss' },
];

const sikkimLocations = [
  { label: 'Gangtok, East Sikkim', lat: 27.3389, lng: 88.6065 },
  { label: 'Rangpo, East Sikkim', lat: 27.1767, lng: 88.5333 },
  { label: 'Mangan, North Sikkim', lat: 27.5167, lng: 88.5333 },
  { label: 'Namchi, South Sikkim', lat: 27.1667, lng: 88.3500 },
  { label: 'Gyalshing, West Sikkim', lat: 27.2833, lng: 88.2667 },
  { label: 'Pakyong, East Sikkim', lat: 27.2333, lng: 88.5833 },
  { label: 'Singtam, East Sikkim', lat: 27.2333, lng: 88.5000 },
  { label: 'Jorethang, South Sikkim', lat: 27.0333, lng: 88.2833 },
  { label: 'Ravangla, South Sikkim', lat: 27.3000, lng: 88.3667 },
  { label: 'Lachung, North Sikkim', lat: 27.7000, lng: 88.7500 },
];

function parseCoordinates(coordString) {
  if (!coordString.trim()) return { lat: null, lng: null };
  const parts = coordString.split(',').map((p) => p.trim());
  if (parts.length !== 2) return { lat: null, lng: null };
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return { lat: null, lng: null };
  return { lat, lng };
}

function ReportDisaster() {
  const { addIncident } = useIncidents();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    disasterType: '',
    severity: '',
    location: '',
    coordinates: '',
    latitude: '',
    longitude: '',
    description: '',
    affectedPeople: '',
    contactInfo: '',
    mediaFiles: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Auto-parse coordinates into lat/lng fields
    if (name === 'coordinates') {
      const { lat, lng } = parseCoordinates(value);
      setFormData((prev) => ({
        ...prev,
        latitude: lat !== null ? lat.toFixed(6) : '',
        longitude: lng !== null ? lng.toFixed(6) : '',
      }));
    }
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      location: loc.label,
      latitude: loc.lat.toFixed(6),
      longitude: loc.lng.toFixed(6),
      coordinates: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.disasterType) newErrors.disasterType = 'Please select an incident type';
        break;
      case 1:
        if (!formData.severity) newErrors.severity = 'Please select a severity level';
        break;
      case 2:
        if (!formData.location.trim()) newErrors.location = 'Please enter a location';
        break;
      case 3:
        if (!formData.description.trim()) newErrors.description = 'Please describe what you observed';
        else if (formData.description.trim().length < 20) newErrors.description = 'Please provide more detail (at least 20 characters)';
        if (formData.affectedPeople === '' || isNaN(Number(formData.affectedPeople))) {
          newErrors.affectedPeople = 'Please enter number of affected people (use 0 if none)';
        } else if (Number(formData.affectedPeople) < 0) {
          newErrors.affectedPeople = 'Number of affected people cannot be negative';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, formSteps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      const { lat, lng } = parseCoordinates(formData.coordinates);
      const incidentData = {
        disasterType: formData.disasterType,
        severity: formData.severity,
        location: formData.location,
        latitude: lat !== null ? lat : (formData.latitude ? parseFloat(formData.latitude) : null),
        longitude: lng !== null ? lng : (formData.longitude ? parseFloat(formData.longitude) : null),
        description: formData.description,
        affectedPeople: Number(formData.affectedPeople) || 0,
      };
      const newIncident = addIncident(incidentData);
      setReferenceId(newIncident.incidentId);
      setSubmittedIncident(newIncident);
      setSubmitted(true);
    }
  };

  const stepFields = {
    0: 'disasterType',
    1: 'severity',
    2: 'location',
    3: 'description',
  };

  const currentField = stepFields[currentStep];
  const currentError = errors[currentField];

  if (submitted) {
    return (
      <div className="page report-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <Card variant="elevated" className="success-card">
                <CardBody className="text-center p-5">
                  <div className="success-icon mb-3" aria-hidden="true">
                    <span className="success-icon-inner">✅</span>
                  </div>
                  <h2 className="mb-3">Incident Report Submitted</h2>
                  <p className="lead text-muted mb-4">
                    Thank you for reporting this incident. Your submission has been
                    recorded in the local system for demonstration purposes.
                  </p>
                  <div className="prototype-notice mb-4 p-3 rounded bg-warning bg-opacity-10 border border-warning">
                    <strong>Prototype Notice:</strong> This incident is stored in browser localStorage only.
                    It has NOT been sent to any government authority or emergency service.
                  </div>
                  <div className="reference-code mb-4">
                    <strong>Reference ID:</strong>{' '}
                    <code>{referenceId}</code>
                  </div>
                  {submittedIncident && (
                    <div className="submitted-summary mb-4 p-3 rounded bg-light border text-start">
                      <h6 className="fw-semibold mb-2">Submitted Incident Summary</h6>
                      <div className="row g-2 small">
                        <div className="col-6"><strong>Type:</strong> {submittedIncident.disasterType}</div>
                        <div className="col-6"><strong>Severity:</strong> <Badge severity={submittedIncident.severity} size="sm" /></div>
                        <div className="col-6"><strong>Location:</strong> {submittedIncident.location}</div>
                        <div className="col-6"><strong>Affected:</strong> {submittedIncident.affectedPeople} people</div>
                        <div className="col-6"><strong>Status:</strong> <Badge variant="success" size="sm">{submittedIncident.status}</Badge></div>
                        <div className="col-6"><strong>Source:</strong> {submittedIncident.source}</div>
                      </div>
                    </div>
                  )}
                  <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        setSubmitted(false);
                        setSubmittedIncident(null);
                        setReferenceId(null);
                        setCurrentStep(0);
                        setFormData({
                          disasterType: '',
                          severity: '',
                          location: '',
                          coordinates: '',
                          latitude: '',
                          longitude: '',
                          description: '',
                          affectedPeople: '',
                          contactInfo: '',
                          mediaFiles: [],
                        });
                      }}
                    >
                      Submit Another Report
                    </Button>
                    <Button variant="outline" size="lg" as={Link} to="/map">
                      View on Map
                    </Button>
                    <Button variant="outline" size="lg" as={Link} to="/">
                      View Dashboard
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page report-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <header className="page-header mb-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="page-header-icon" aria-hidden="true">📝</div>
                <div>
                  <h1 className="h2 fw-bold mb-1">Report an Incident</h1>
                  <p className="text-muted mb-0">
                    Help your community by reporting incidents accurately. All reports
                    are stored locally in this prototype and verified before appearing on the public map.
                  </p>
                </div>
              </div>
              <StepIndicator steps={formSteps} currentStep={currentStep} />
            </header>

            <form onSubmit={handleSubmit} className="report-form" noValidate>
              <Card variant="elevated">
                <CardBody className="p-4 p-md-5">
                  {/* Step 0: Incident Type */}
                  {currentStep === 0 && (
                    <FormSection title="Incident Type" subtitle="Select the type of disaster or emergency you are reporting">
                      <div className="disaster-type-grid" role="radiogroup" aria-label="Disaster type" aria-required="true">
                        {disasterTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            className={`disaster-type-option ${formData.disasterType === type.value ? 'selected' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, disasterType: type.value }))}
                            role="radio"
                            aria-checked={formData.disasterType === type.value}
                            aria-label={type.label}
                          >
                            <span className="disaster-type-icon" aria-hidden="true">{type.icon}</span>
                            <span className="disaster-type-label">{type.label}</span>
                            <span className="disaster-type-description">{type.description}</span>
                          </button>
                        ))}
                      </div>
                      {currentError && (
                        <div className="form-field-error" role="alert">
                          <span className="form-field-error-icon" aria-hidden="true">⚠</span>
                          <span>{currentError}</span>
                        </div>
                      )}
                    </FormSection>
                  )}

                  {/* Step 1: Severity */}
                  {currentStep === 1 && (
                    <FormSection title="Severity Level" subtitle="How serious is this incident?">
                      <div className="severity-grid" role="radiogroup" aria-label="Severity level" aria-required="true">
                        {severityLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            className={`severity-option ${formData.severity === level.value ? 'selected' : ''} severity-${level.value}`}
                            onClick={() => setFormData((prev) => ({ ...prev, severity: level.value }))}
                            role="radio"
                            aria-checked={formData.severity === level.value}
                            aria-label={`${level.label} severity`}
                          >
                            <div className="severity-indicator" aria-hidden="true"></div>
                            <div className="severity-content">
                              <span className="severity-label">{level.label}</span>
                              <span className="severity-description">{level.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {currentError && (
                        <div className="form-field-error" role="alert">
                          <span className="form-field-error-icon" aria-hidden="true">⚠</span>
                          <span>{currentError}</span>
                        </div>
                      )}
                    </FormSection>
                  )}

                  {/* Step 2: Location */}
                  {currentStep === 2 && (
                    <FormSection title="Location" subtitle="Where did the incident occur?">
                      <FormField
                        label="Address, Landmark, or Area"
                        htmlFor="location"
                        required
                        error={currentError}
                        hint="Enter a street address, landmark, neighborhood, or general area"
                      >
                        <input
                          type="text"
                          id="location"
                          name="location"
                          className="form-control"
                          placeholder="e.g., Rangpo Bazaar, NH-10, or Gangtok-Mangan Highway"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          autoComplete="address-line1"
                          list="sikkim-locations"
                        />
                        <datalist id="sikkim-locations">
                          {sikkimLocations.map((loc) => (
                            <option key={loc.label} value={loc.label} />
                          ))}
                        </datalist>
                      </FormField>

                      <div className="location-suggestions mb-3">
                        <label className="form-label small fw-medium mb-2">Quick Select (Sikkim):</label>
                        <div className="d-flex flex-wrap gap-2">
                          {sikkimLocations.slice(0, 6).map((loc) => (
                            <button
                              key={loc.label}
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleLocationSelect(loc)}
                            >
                              {loc.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <FormField
                        label="Latitude"
                        htmlFor="latitude"
                        hint="Auto-filled from coordinates or GPS. Range: 8.0 to 38.0 (India)"
                      >
                        <input
                          type="number"
                          id="latitude"
                          name="latitude"
                          className="form-control"
                          placeholder="27.338900"
                          step="0.000001"
                          min="8.0"
                          max="38.0"
                          value={formData.latitude}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Longitude"
                        htmlFor="longitude"
                        hint="Auto-filled from coordinates or GPS. Range: 68.0 to 98.0 (India)"
                      >
                        <input
                          type="number"
                          id="longitude"
                          name="longitude"
                          className="form-control"
                          placeholder="88.606500"
                          step="0.000001"
                          min="68.0"
                          max="98.0"
                          value={formData.longitude}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="GPS Coordinates"
                        htmlFor="coordinates"
                        hint="Latitude, Longitude format (e.g., 27.3389, 88.6065). Auto-updates Lat/Lng fields."
                      >
                        <input
                          type="text"
                          id="coordinates"
                          name="coordinates"
                          className="form-control"
                          placeholder="27.3389, 88.6065"
                          value={formData.coordinates}
                          onChange={handleChange}
                        />
                      </FormField>

                      <div className="location-actions">
                        <Button variant="outline" size="sm" leftIcon="📍" disabled>
                          Use Current Location
                        </Button>
                        <span className="text-muted small">GPS access requires HTTPS and user permission</span>
                      </div>
                    </FormSection>
                  )}

                  {/* Step 3: Details */}
                  {currentStep === 3 && (
                    <FormSection title="Incident Details" subtitle="Describe what you observed in detail">
                      <FormField
                        label="Description"
                        htmlFor="description"
                        required
                        error={currentError}
                        hint="Include: what happened, damage observed, injuries, hazards, people affected, immediate dangers"
                      >
                        <textarea
                          id="description"
                          name="description"
                          className="form-control"
                          rows={6}
                          placeholder="Describe what you observed: damage, injuries, hazards, people affected, immediate dangers, etc."
                          value={formData.description}
                          onChange={handleChange}
                          required
                        />
                      </FormField>

                      <FormField
                        label="Number of Affected People"
                        htmlFor="affectedPeople"
                        required
                        error={errors.affectedPeople}
                        hint="Enter 0 if no people are directly affected. This helps prioritize response."
                      >
                        <input
                          type="number"
                          id="affectedPeople"
                          name="affectedPeople"
                          className="form-control"
                          placeholder="0"
                          min="0"
                          value={formData.affectedPeople}
                          onChange={handleChange}
                          required
                        />
                      </FormField>

                      <div className="description-hints">
                        <h6 className="hint-title">Include if possible:</h6>
                        <ul className="hint-list">
                          <li>Type and extent of damage</li>
                          <li>Number of people affected or injured</li>
                          <li>Immediate hazards (fire, gas, structural, flood)</li>
                          <li>Access conditions (roads blocked, bridges out)</li>
                          <li>Utilities status (power, water, communications)</li>
                        </ul>
                      </div>
                    </FormSection>
                  )}

                  {/* Step 4: Contact */}
                  {currentStep === 4 && (
                    <FormSection title="Contact Information" subtitle="Optional - for follow-up from emergency management">
                      <FormField
                        label="Phone or Email"
                        htmlFor="contactInfo"
                        hint="Your information is kept confidential and only used for verification"
                      >
                        <input
                          type="tel"
                          id="contactInfo"
                          name="contactInfo"
                          className="form-control"
                          placeholder="Phone or email (kept confidential)"
                          value={formData.contactInfo}
                          onChange={handleChange}
                        />
                      </FormField>

                      <div className="contact-note">
                        <div className="contact-note-icon" aria-hidden="true">🔒</div>
                        <div>
                          <strong>Privacy:</strong> Your contact information is stored locally in this prototype and only shared with authorized
                          emergency management personnel for verification purposes. It is never published publicly.
                        </div>
                      </div>
                    </FormSection>
                  )}

                  {/* Navigation Buttons */}
                  <div className="form-navigation d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                    >
                      ← Back
                    </Button>
                    <div className="step-progress text-muted small">
                      Step {currentStep + 1} of {formSteps.length}
                    </div>
                    {currentStep < formSteps.length - 1 ? (
                      <Button variant="primary" size="md" onClick={handleNext} rightIcon="→">
                        Next
                      </Button>
                    ) : (
                      <Button variant="primary" size="md" type="submit" rightIcon="📤">
                        Submit Report
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDisaster;