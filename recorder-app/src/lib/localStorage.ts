import { Recording } from '../store/useStore';

const STORAGE_KEY = 'recorder_app_recordings';

/**
 * Save recordings to localStorage
 */
export const saveRecordings = (recordings: Recording[]): void => {
  try {
    // Convert Blobs to base64 for storage
    const recordingsToSave = recordings.map((recording) => {
      const { audioBlob, audioUrl, ...record } = recording;
      return record;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordingsToSave));
  } catch (error) {
    console.error('Error saving recordings to localStorage:', error);
    throw new Error('Failed to save recordings');
  }
};

/**
 * Load recordings from localStorage
 */
export const loadRecordings = async (): Promise<Recording[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const recordings = JSON.parse(stored) as Omit<Recording, 'audioBlob' | 'audioUrl'>[];
    
    // Reconstruct recordings with blob URLs if we have blob data stored separately
    // For now, we'll return the basic recording data
    // Audio blobs will be recreated when recordings are loaded
    return recordings.map((rec) => ({
      ...rec,
      audioBlob: undefined,
      audioUrl: undefined,
    }));
  } catch (error) {
    console.error('Error loading recordings from localStorage:', error);
    return [];
  }
};

/**
 * Save a single recording (both metadata and blob)
 */
export const saveRecording = async (recording: Recording): Promise<void> => {
  try {
    const recordings = await loadRecordings();
    
    // Check if recording already exists (update) or add new
    const existingIndex = recordings.findIndex((r) => r.id === recording.id);
    
    // Store blob separately in IndexedDB for larger files
    if (recording.audioBlob) {
      await saveBlobToIndexedDB(recording.id, recording.audioBlob);
    }

    // Create recording metadata (without blob/url)
    const { audioBlob, audioUrl, ...recordingMetadata } = recording;
    
    if (existingIndex >= 0) {
      recordings[existingIndex] = recordingMetadata;
    } else {
      recordings.unshift(recordingMetadata); // Add to beginning
    }

    // Save metadata to localStorage
    saveRecordings(recordings);
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

/**
 * Load a recording with its blob
 */
export const loadRecording = async (id: string): Promise<Recording | null> => {
  try {
    const recordings = await loadRecordings();
    const recording = recordings.find((r) => r.id === id);
    
    if (!recording) {
      return null;
    }

    // Load blob from IndexedDB if available
    const blob = await loadBlobFromIndexedDB(id);
    const audioUrl = blob ? URL.createObjectURL(blob) : undefined;

    return {
      ...recording,
      audioBlob: blob || undefined,
      audioUrl,
    };
  } catch (error) {
    console.error('Error loading recording:', error);
    return null;
  }
};

/**
 * Delete a recording
 */
export const deleteRecording = async (id: string): Promise<void> => {
  try {
    const recordings = await loadRecordings();
    const filtered = recordings.filter((r) => r.id !== id);
    saveRecordings(filtered);
    
    // Delete blob from IndexedDB
    await deleteBlobFromIndexedDB(id);
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw error;
  }
};

// IndexedDB helpers for storing audio blobs
const DB_NAME = 'recorder_app_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
};

const saveBlobToIndexedDB = async (id: string, blob: Blob): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put(blob, id);
  } catch (error) {
    console.error('Error saving blob to IndexedDB:', error);
    // Fallback: store in memory or skip
  }
};

const loadBlobFromIndexedDB = async (id: string): Promise<Blob | null> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading blob from IndexedDB:', error);
    return null;
  }
};

const deleteBlobFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(id);
  } catch (error) {
    console.error('Error deleting blob from IndexedDB:', error);
  }
};


