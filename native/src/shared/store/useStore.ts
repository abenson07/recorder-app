import { create } from 'zustand';
import type { Recording } from './types';

// Re-export for convenience
export type { Recording } from './types';

interface AppState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  // Callbacks for Controls component to trigger actions in Recording/Playback
  onRecordingPauseResume?: () => void;
  onRecordingStop?: () => void;
  onPlaybackPlayPause?: () => void;
  onPlaybackStop?: () => void;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => Promise<void>;
  setCurrentRecording: (recording: Recording | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setRecordingCallbacks: (callbacks: { onPauseResume?: () => void; onStop?: () => void }) => void;
  setPlaybackCallbacks: (callbacks: { onPlayPause?: () => void; onStop?: () => void }) => void;
  clearCallbacks: () => void;
  loadRecordingsFromStorage: () => Promise<void>;
}

// Storage functions will be injected by platform-specific code
// For now, we'll create a platform-agnostic store that accepts storage functions
export interface StorageFunctions {
  saveRecordings: (recordings: Recording[]) => Promise<void>;
  loadRecordings: () => Promise<Recording[]>;
  deleteRecording: (id: string) => Promise<void>;
}

// This will be set by platform-specific code
let storageFunctions: StorageFunctions | null = null;

export const setStorageFunctions = (functions: StorageFunctions) => {
  storageFunctions = functions;
};

export const useStore = create<AppState>((set, get) => ({
  recordings: [],
  currentRecording: null,
  isRecording: false,
  isPaused: false,
  isPlaying: false,
  isLoading: false,
  onRecordingPauseResume: undefined,
  onRecordingStop: undefined,
  onPlaybackPlayPause: undefined,
  onPlaybackStop: undefined,
  
  addRecording: (recording) => {
    set((state) => {
      const newRecordings = [recording, ...state.recordings];
      // Persist to storage (async, but don't block)
      if (storageFunctions) {
        storageFunctions.saveRecordings(newRecordings).catch((error) => {
          console.error('Error saving recordings:', error);
        });
      }
      return { recordings: newRecordings };
    });
  },
  
  updateRecording: (id, updates) => {
    set((state) => {
      const newRecordings = state.recordings.map((recording) =>
        recording.id === id ? { ...recording, ...updates } : recording
      );
      // Persist to storage (async, but don't block)
      if (storageFunctions) {
        storageFunctions.saveRecordings(newRecordings).catch((error) => {
          console.error('Error saving recordings:', error);
        });
      }
      return { recordings: newRecordings };
    });
  },
  
  deleteRecording: async (id) => {
    try {
      if (storageFunctions) {
        await storageFunctions.deleteRecording(id);
      }
      
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
  
  setIsPaused: (isPaused) =>
    set({ isPaused }),
  
  setIsPlaying: (isPlaying) =>
    set({ isPlaying }),
  
  setRecordingCallbacks: (callbacks) =>
    set({
      onRecordingPauseResume: callbacks.onPauseResume,
      onRecordingStop: callbacks.onStop,
    }),
  
  setPlaybackCallbacks: (callbacks) =>
    set({
      onPlaybackPlayPause: callbacks.onPlayPause,
      onPlaybackStop: callbacks.onStop,
    }),
  
  clearCallbacks: () =>
    set({
      onRecordingPauseResume: undefined,
      onRecordingStop: undefined,
      onPlaybackPlayPause: undefined,
      onPlaybackStop: undefined,
    }),
  
  loadRecordingsFromStorage: async () => {
    set({ isLoading: true });
    try {
      if (storageFunctions) {
        const recordings = await storageFunctions.loadRecordings();
        set({ recordings, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading recordings from storage:', error);
      set({ isLoading: false });
    }
  },
}));

