import { create } from 'zustand';
import { loadRecordings, saveRecordings, deleteRecording as deleteRecordingFromStorage } from '../lib/localStorage';

export interface Recording {
  id: string;
  fileName: string;
  duration: number;
  status: 'recording' | 'transcribing' | 'done' | 'error';
  transcript?: string;
  createdAt: string;
  audioBlob?: Blob; // For real audio recordings
  audioUrl?: string; // For playback
}

interface AppState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => Promise<void>;
  setCurrentRecording: (recording: Recording | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  loadRecordingsFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  recordings: [],
  currentRecording: null,
  isRecording: false,
  isPlaying: false,
  isLoading: false,
  
  addRecording: (recording) => {
    set((state) => {
      const newRecordings = [recording, ...state.recordings];
      // Persist to local storage (async, but don't block)
      try {
        saveRecordings(newRecordings);
      } catch (error) {
        console.error('Error saving recordings:', error);
      }
      return { recordings: newRecordings };
    });
  },
  
  updateRecording: (id, updates) => {
    set((state) => {
      const newRecordings = state.recordings.map((recording) =>
        recording.id === id ? { ...recording, ...updates } : recording
      );
      // Persist to local storage (async, but don't block)
      try {
        saveRecordings(newRecordings);
      } catch (error) {
        console.error('Error saving recordings:', error);
      }
      return { recordings: newRecordings };
    });
  },
  
  deleteRecording: async (id) => {
    try {
      // Delete from storage
      await deleteRecordingFromStorage(id);
      
      // Update state
      set((state) => ({
        recordings: state.recordings.filter((recording) => recording.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  },
  
  setCurrentRecording: (recording) =>
    set({ currentRecording: recording }),
  
  setIsRecording: (isRecording) =>
    set({ isRecording }),
  
  setIsPlaying: (isPlaying) =>
    set({ isPlaying }),
  
  loadRecordingsFromStorage: async () => {
    set({ isLoading: true });
    try {
      const recordings = await loadRecordings();
      set({ recordings, isLoading: false });
    } catch (error) {
      console.error('Error loading recordings from storage:', error);
      set({ isLoading: false });
    }
  },
}));

// Load recordings on store initialization
if (typeof window !== 'undefined') {
  useStore.getState().loadRecordingsFromStorage();
}
