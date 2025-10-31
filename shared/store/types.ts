export interface Recording {
  id: string;
  fileName: string;
  duration: number;
  status: 'recording' | 'transcribing' | 'done' | 'error';
  transcript?: string;
  createdAt: string;
  audioBlob?: Blob; // For web
  audioUrl?: string; // For playback (web: blob URL, native: file URI)
}

