/**
 * Web-specific storage adapter that wraps localStorage
 * Implements the storage functions interface expected by shared store
 */

import { Recording } from '../shared/store/types';
import type { StorageFunctions } from '../shared/store/useStore';
import { 
  loadRecordings as loadRecordingsFromStorage, 
  saveRecordings as saveRecordingsToStorage, 
  deleteRecording as deleteRecordingFromStorage, 
  saveRecording as saveSingleRecording, 
  loadRecording as loadSingleRecording 
} from './localStorage';

export const webStorageAdapter: StorageFunctions = {
  saveRecordings: async (recordings: Recording[]): Promise<void> => {
    saveRecordingsToStorage(recordings);
  },
  
  loadRecordings: async (): Promise<Recording[]> => {
    return await loadRecordingsFromStorage();
  },
  
  deleteRecording: async (id: string): Promise<void> => {
    await deleteRecordingFromStorage(id);
  },
};

// Additional helper functions (not part of StorageFunctions interface)
// These are used directly by components, not by the store
export const saveRecording = async (recording: Recording): Promise<void> => {
  await saveSingleRecording(recording);
};

export const loadRecording = async (id: string): Promise<Recording | null> => {
  return await loadSingleRecording(id);
};
