import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordTime: string; // Formatted as "00:00:00"
  currentPosition: number; // In milliseconds
  error: string | null;
}

export interface RecorderControls {
  startRecorder: () => Promise<string | null>;
  stopRecorder: () => Promise<string | null>;
  pauseRecorder: () => void;
  resumeRecorder: () => void;
  resetRecorder: () => void;
  getFinalDuration: () => number; // Get final duration in milliseconds before stopping
  getStream: () => MediaStream | null; // Not applicable for native, returns null
  getRecording: () => Audio.Recording | null; // Get current recording reference for waveform
  isLoading: boolean;
}

/**
 * Format milliseconds to HH:MM:SS format
 */
export const formatRecordTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const useRecorder = (
  onRecordBack?: (data: { currentPosition: number }) => void
): RecorderState & RecorderControls => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioChunksRef = useRef<string | null>(null); // Store URI instead of chunks
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resultUriRef = useRef<string | null>(null);

  // Update record time display
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        setCurrentPosition(elapsed);
        setRecordTime(formatRecordTime(elapsed));
        
        if (onRecordBack) {
          onRecordBack({ currentPosition: elapsed });
        }
      }, 100); // Update every 100ms for smooth display
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused, onRecordBack]);

  const startRecorder = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request audio recording permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create new recording instance
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined, // onRecordingStatusUpdate callback (not used, we track time manually)
        undefined // progressUpdateIntervalMillis (not needed)
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pausedTimeRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      setIsLoading(false);

      return null; // Return null for success (URI available after stop)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setIsLoading(false);
      setIsRecording(false);
      console.error('Error starting recording:', err);
      throw err;
    }
  }, []);

  const pauseRecorder = useCallback(() => {
    if (recordingRef.current && isRecording && !isPaused) {
      recordingRef.current.pauseAsync();
      pausedTimeRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecorder = useCallback(() => {
    if (recordingRef.current && isRecording && isPaused) {
      recordingRef.current.startAsync();
      totalPausedTimeRef.current += Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  const stopRecorder = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) {
      return null;
    }

    try {
      setIsLoading(true);
      
      // Stop the recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get the URI
      const uri = recordingRef.current.getURI();
      resultUriRef.current = uri || null;
      
      // Clean up
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsLoading(false);
      
      return uri || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Error stopping recording:', err);
      throw err;
    }
  }, []);

  const resetRecorder = useCallback(() => {
    // Clean up recording if it exists
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {
        // Ignore errors during cleanup
      });
      recordingRef.current = null;
    }

    // Reset all state
    setIsRecording(false);
    setIsPaused(false);
    setRecordTime('00:00:00');
    setCurrentPosition(0);
    setError(null);
    setIsLoading(false);
    
    // Clear refs
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    resultUriRef.current = null;
    audioChunksRef.current = null;

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getFinalDuration = useCallback((): number => {
    if (!isRecording) {
      return 0;
    }
    const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
    return elapsed;
  }, [isRecording]);

  const getStream = useCallback((): MediaStream | null => {
    // Not applicable for React Native - MediaStream is web-only
    // Waveform will need different approach for native
    return null;
  }, []);

  const getRecording = useCallback((): Audio.Recording | null => {
    return recordingRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetRecorder();
    };
  }, [resetRecorder]);

  return {
    isRecording,
    isPaused,
    recordTime,
    currentPosition,
    error,
    startRecorder,
    stopRecorder,
    pauseRecorder,
    resumeRecorder,
    resetRecorder,
    getFinalDuration,
    getStream,
    getRecording,
    isLoading,
  };
};

