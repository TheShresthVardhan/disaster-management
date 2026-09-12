import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { storage, firebaseEnabled } from './firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

/**
 * Validate an image file before upload
 * @param {File} file - The file to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC/HEIF` 
    };
  }

  // Check file extension as additional validation
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { 
      valid: false, 
      error: `Unsupported file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    return { 
      valid: false, 
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum: ${maxMB} MB` 
    };
  }

  return { valid: true, error: null };
}

/**
 * Generate a unique filename for the image
 * @param {File} file - The original file
 * @returns {string} Unique filename preserving extension
 */
function generateUniqueFilename(file) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return `img_${timestamp}_${random}${ext}`;
}

/**
 * Upload an incident image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} incidentId - The incident ID for the storage path
 * @param {Function} onProgress - Optional callback(progress: 0-100)
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export async function uploadIncidentImage(file, incidentId, onProgress) {
  if (!firebaseEnabled || !storage) {
    throw new Error('Firebase Storage not available');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = generateUniqueFilename(file);
  const storagePath = `incidents/${incidentId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('[Storage] Upload failed:', error);
        let message = 'Upload failed';
        if (error.code === 'storage/unauthorized') {
          message = 'Upload failed: Permission denied. Check Storage rules.';
        } else if (error.code === 'storage/canceled') {
          message = 'Upload canceled';
        } else if (error.code === 'storage/quota-exceeded') {
          message = 'Storage quota exceeded';
        }
        reject(new Error(message));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            console.log('[Storage] Image uploaded successfully:', downloadURL);
            resolve(downloadURL);
          })
          .catch(reject);
      }
    );
  });
}

/**
 * Delete an incident image from Firebase Storage
 * @param {string} imageUrl - The download URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteIncidentImage(imageUrl) {
  if (!firebaseEnabled || !storage) {
    console.warn('[Storage] Not available, skipping delete');
    return;
  }

  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('[Storage] Image deleted:', imageUrl);
  } catch (error) {
    console.warn('[Storage] Delete failed (may not exist):', error);
  }
}

/**
 * Check if Firebase Storage is available
 * @returns {boolean}
 */
export function isStorageAvailable() {
  return firebaseEnabled && !!storage;
}