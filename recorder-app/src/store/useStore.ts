import { create } from 'zustand';

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
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  setCurrentRecording: (recording: Recording | null) => void;
  setIsRecording: (isRecording: boolean) => void;
}

// Mock data for initial development
const mockRecordings: Recording[] = [
  {
    id: '1',
    fileName: 'Walk Notes - 2024-10-24',
    duration: 120,
    status: 'done',
    transcript: 'This is a sample transcript from my walk. I had some great ideas about the project and wanted to record them.',
    createdAt: '2024-10-24T10:30:00Z',
  },
  {
    id: '2',
    fileName: 'Meeting Notes - 2024-10-23',
    duration: 300,
    status: 'transcribing',
    transcript: undefined,
    createdAt: '2024-10-23T14:15:00Z',
  },
  {
    id: '3',
    fileName: 'Quick Thought - 2024-10-22',
    duration: 45,
    status: 'done',
    transcript: 'Just a quick reminder about the grocery list.',
    createdAt: '2024-10-22T16:45:00Z',
  },
];

export const useStore = create<AppState>((set) => ({
  recordings: mockRecordings,
  currentRecording: null,
  isRecording: false,
  
  addRecording: (recording) =>
    set((state) => ({
      recordings: [recording, ...state.recordings],
    })),
    
  updateRecording: (id, updates) =>
    set((state) => ({
      recordings: state.recordings.map((recording) =>
        recording.id === id ? { ...recording, ...updates } : recording
      ),
    })),
    
  deleteRecording: (id) =>
    set((state) => ({
      recordings: state.recordings.filter((recording) => recording.id !== id),
    })),
    
  setCurrentRecording: (recording) =>
    set({ currentRecording: recording }),
    
  setIsRecording: (isRecording) =>
    set({ isRecording }),
}));
