// Re-export shared store and initialize with native storage
import { useStore, setStorageFunctions } from '../shared/store/useStore';
import { nativeStorageAdapter } from '../lib/storageAdapter';

// Initialize store with native storage adapter
setStorageFunctions(nativeStorageAdapter);

// Re-export everything
export { useStore };
export type { Recording } from '../../../shared/store/types';

