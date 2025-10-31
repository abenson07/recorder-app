// Re-export shared store and initialize with web storage
import { useStore, setStorageFunctions } from '../shared/store/useStore';
import { webStorageAdapter } from '../lib/storageAdapter';

// Initialize store with web storage adapter
setStorageFunctions(webStorageAdapter);

// Load recordings on initialization (web only)
if (typeof window !== 'undefined') {
  useStore.getState().loadRecordingsFromStorage();
}

// Re-export everything
export { useStore };
export type { Recording } from '../shared/store/types';
