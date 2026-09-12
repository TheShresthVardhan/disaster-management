import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';

const COLLECTION_NAME = 'incidents';

/**
 * Create a new incident in Firestore
 * @param {Object} incidentData - Incident data to store
 * @returns {Promise<Object>} Created incident with Firestore document ID
 */
export async function createIncident(incidentData) {
  if (!firebaseEnabled || !db) {
    throw new Error('Firestore not available');
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...incidentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[Firestore] Incident created with ID:', docRef.id);
    return { ...incidentData, id: docRef.id, firestoreId: docRef.id };
  } catch (error) {
    console.error('[Firestore] Failed to create incident:', error);
    throw error;
  }
}

/**
 * Fetch all incidents from Firestore
 * @returns {Promise<Array>} Array of incidents
 */
export async function fetchIncidents() {
  if (!firebaseEnabled || !db) {
    throw new Error('Firestore not available');
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const incidents = [];
    querySnapshot.forEach((doc) => {
      incidents.push({ 
        id: doc.id, 
        firestoreId: doc.id, 
        ...doc.data() 
      });
    });
    
    console.log('[Firestore] Fetched', incidents.length, 'incidents');
    return incidents;
  } catch (error) {
    console.error('[Firestore] Failed to fetch incidents:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time incident updates
 * @param {Function} callback - Called with incidents array on each update
 * @returns {Function} Unsubscribe function
 */
export function subscribeToIncidents(callback) {
  if (!firebaseEnabled || !db) {
    console.warn('[Firestore] Not available, cannot subscribe');
    return () => {};
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const incidents = [];
      querySnapshot.forEach((doc) => {
        incidents.push({ 
          id: doc.id, 
          firestoreId: doc.id, 
          ...doc.data() 
        });
      });
      callback(incidents);
    }, (error) => {
      console.error('[Firestore] Subscription error:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('[Firestore] Failed to subscribe:', error);
    return () => {};
  }
}

/**
 * Update incident status in Firestore
 * @param {string} incidentId - Firestore document ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
export async function updateIncidentStatus(incidentId, status) {
  if (!firebaseEnabled || !db) {
    throw new Error('Firestore not available');
  }

  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    await updateDoc(incidentRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    console.log('[Firestore] Incident status updated:', incidentId);
  } catch (error) {
    console.error('[Firestore] Failed to update incident status:', error);
    throw error;
  }
}

/**
 * Check if Firestore is available
 * @returns {boolean}
 */
export function isFirestoreAvailable() {
  return firebaseEnabled && !!db;
}