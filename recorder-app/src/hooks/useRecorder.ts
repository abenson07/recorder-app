import { useState, useRef, useCallback, useEffect } from 'react';

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resultPathRef = useRef<string | null>(null);

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

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder with browser-compatible format
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000, // 128 kbps
      };

      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        resultPathRef.current = url;
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      startTimeRef.current = Date.now();
      totalPausedTimeRef.current = 0;
      pausedTimeRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      setCurrentPosition(0);
      setRecordTime('00:00:00');

      return null; // On web, path is returned via stopRecorder
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Error starting recorder:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopRecorder = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);

      const mediaRecorder = mediaRecorderRef.current;
      if (mediaRecorder && isRecording) {
        return new Promise((resolve) => {
          const handleStop = () => {
            setIsRecording(false);
            setIsPaused(false);
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // Wait a bit for blob to be ready
            setTimeout(() => {
              resolve(resultPathRef.current);
            }, 100);
          };

          mediaRecorder.addEventListener('stop', handleStop, { once: true });
          mediaRecorder.stop();
        });
      }

      return resultPathRef.current;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      console.error('Error stopping recorder:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isRecording]);

  const pauseRecorder = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current = Date.now();
      setIsPaused(true);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecorder = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      
      // Update total paused time
      totalPausedTimeRef.current += Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  const resetRecorder = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clean up blob URL
    if (resultPathRef.current) {
      URL.revokeObjectURL(resultPathRef.current);
      resultPathRef.current = null;
    }

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setRecordTime('00:00:00');
    setCurrentPosition(0);
    setError(null);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
  }, [isRecording]);

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
    isLoading,
  };
};

