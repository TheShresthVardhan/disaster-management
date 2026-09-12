import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const IncidentContext = createContext(null);

const INITIAL_MOCK_INCIDENTS = [
  {
    incidentId: 'INC-DEMO-001',
    source: 'Citizen Report',
    disasterType: 'flood',
    severity: 'high',
    location: 'Rangpo, East Sikkim',
    latitude: 27.1767,
    longitude: 88.5333,
    description: 'Flash flooding along Teesta River near Rangpo. Water levels rising rapidly. Several homes affected. Road access blocked.',
    affectedPeople: 45,
    timestamp: '2024-06-15T10:30:00Z',
    status: 'ACTIVE',
  },
  {
    incidentId: 'INC-DEMO-002',
    source: 'Citizen Report',
    disasterType: 'landslide',
    severity: 'moderate',
    location: 'Gangtok-Nathula Road, East Sikkim',
    latitude: 27.3389,
    longitude: 88.6065,
    description: 'Landslide blocking NH-310 near 15th Mile. Debris covering both lanes. Traffic diverted. No injuries reported.',
    affectedPeople: 0,
    timestamp: '2024-06-14T16:45:00Z',
    status: 'ACTIVE',
  },
  {
    incidentId: 'INC-DEMO-003',
    source: 'Citizen Report',
    disasterType: 'earthquake',
    severity: 'low',
    location: 'Mangan, North Sikkim',
    latitude: 27.5167,
    longitude: 88.5333,
    description: 'Minor tremors felt in Mangan area. No structural damage reported. Residents advised to stay alert for aftershocks.',
    affectedPeople: 0,
    timestamp: '2024-06-13T08:20:00Z',
    status: 'RESOLVED',
  },
];

function generateIncidentId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INC-${timestamp}-${random}`;
}

export function IncidentProvider({ children }) {
  const [incidents, setIncidents] = useState(() => {
    const stored = localStorage.getItem('disaster-intel-incidents');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_MOCK_INCIDENTS;
      }
    }
    return INITIAL_MOCK_INCIDENTS;
  });

  useEffect(() => {
    localStorage.setItem('disaster-intel-incidents', JSON.stringify(incidents));
  }, [incidents]);

  const addIncident = useCallback((incidentData) => {
    const newIncident = {
      incidentId: generateIncidentId(),
      source: 'Citizen Report',
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      ...incidentData,
    };
    setIncidents((prev) => [newIncident, ...prev]);
    return newIncident;
  }, []);

  const updateIncidentStatus = useCallback((incidentId, status) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.incidentId === incidentId ? { ...inc, status } : inc))
    );
  }, []);

  const getActiveIncidents = useCallback(() => {
    return incidents.filter((inc) => inc.status === 'ACTIVE');
  }, [incidents]);

  const getIncidentsByType = useCallback((type) => {
    return incidents.filter((inc) => inc.disasterType === type);
  }, [incidents]);

  const getIncidentsBySeverity = useCallback((severity) => {
    return incidents.filter((inc) => inc.severity === severity);
  }, [incidents]);

  const value = {
    incidents,
    activeIncidents: incidents.filter((inc) => inc.status === 'ACTIVE'),
    addIncident,
    updateIncidentStatus,
    getActiveIncidents,
    getIncidentsByType,
    getIncidentsBySeverity,
  };

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}

export default IncidentContext;