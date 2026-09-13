import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  fetchIncidents, 
  createIncident, 
  subscribeToIncidents, 
  isFirestoreAvailable 
} from '../services/firestore';

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

const STORAGE_KEY = 'disaster-intel-incidents';
const DEMO_INCIDENT_IDS = ['INC-DEMO-001', 'INC-DEMO-002', 'INC-DEMO-003'];

// Helper functions (defined at module level)
function isDemoIncident(incident) {
  return DEMO_INCIDENT_IDS.includes(incident.incidentId);
}

function generateIncidentId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INC-${timestamp}-${random}`;
}

function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[IncidentContext] Failed to load from localStorage:', error);
  }
  return INITIAL_MOCK_INCIDENTS;
}

function saveToLocalStorage(incidents) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch (error) {
    console.warn('[IncidentContext] Failed to save to localStorage:', error);
  }
}

export function IncidentProvider({ children }) {
  const [incidents, setIncidents] = useState(() => loadFromLocalStorage());
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    saveToLocalStorage(incidents);
  }, [incidents]);

  // Firestore status update function - defined outside to avoid circular dependency
  const updateIncidentStatusFirestore = useCallback(async (incidentId, status) => {
    try {
      const { updateIncidentStatus } = await import('../services/firestore');
      await updateIncidentStatus(incidentId, status);
    } catch (error) {
      console.warn('[IncidentContext] Failed to sync status to Firestore:', error);
    }
  }, []);

  useEffect(() => {
    if (!isFirestoreAvailable()) {
      console.log('[IncidentContext] Firestore not available, using localStorage only');
      setFirestoreReady(true);
      return;
    }

    let unsubscribe = () => {};
    let cancelled = false;

    const mergeWithLocalOnly = (firestoreData, localIncidents) => {
      const localOnly = localIncidents.filter(inc =>
        isDemoIncident(inc) ||
        !firestoreData.some(fi => fi.incidentId === inc.incidentId)
      );
      const merged = [...firestoreData];
      localOnly.forEach(localInc => {
        if (!merged.some(m => m.incidentId === localInc.incidentId)) {
          merged.push(localInc);
        }
      });
      return merged;
    };

    const initFirestore = async () => {
      try {
        setIsSyncing(true);
        console.log('[IncidentContext] Initializing Firestore connection...');

        const firestoreIncidents = await fetchIncidents();
        if (cancelled) return;

        setIncidents((prev) => {
          const merged = mergeWithLocalOnly(firestoreIncidents, prev);
          console.log('[IncidentContext] Initial Firestore sync complete. Total incidents:', merged.length);
          return merged;
        });

        unsubscribe = subscribeToIncidents((firestoreData) => {
          if (cancelled) return;
          setIncidents((prev) => mergeWithLocalOnly(firestoreData, prev));
          console.log('[IncidentContext] Real-time Firestore update received');
        });

        setFirestoreReady(true);
        setFirestoreError(null);
      } catch (error) {
        console.error('[IncidentContext] Firestore initialization failed:', error);
        if (!cancelled) {
          setFirestoreError(error.message);
          setFirestoreReady(true);
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    initFirestore();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const addIncident = useCallback(async (incidentData) => {
    const newIncident = {
      incidentId: generateIncidentId(),
      source: incidentData.source || 'Citizen Report',
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      ...incidentData,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    if (isFirestoreAvailable() && !isDemoIncident(newIncident)) {
      try {
        console.log('[IncidentContext] Syncing new incident to Firestore...');
        await createIncident(newIncident);
        console.log('[IncidentContext] Incident synced to Firestore:', newIncident.incidentId);
      } catch (error) {
        console.warn('[IncidentContext] Firestore sync failed, incident stored locally only:', error);
      }
    } else if (!isFirestoreAvailable()) {
      console.log('[IncidentContext] Firestore unavailable, incident stored locally only');
    }

    return newIncident;
  }, []);

  const updateIncidentStatus = useCallback(async (incidentId, status) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.incidentId === incidentId ? { ...inc, status } : inc))
    );

    if (isFirestoreAvailable()) {
      try {
        await updateIncidentStatusFirestore(incidentId, status);
      } catch (error) {
        console.warn('[IncidentContext] Failed to sync status to Firestore:', error);
      }
    }
  }, [updateIncidentStatusFirestore]);

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
    firestoreReady,
    firestoreError,
    isSyncing,
    isFirestoreOnline: isFirestoreAvailable(),
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