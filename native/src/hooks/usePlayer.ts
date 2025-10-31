import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface PlayerState {
  isPlaying: boolean;
  playTime: string; // Formatted as "00:00:00"
  duration: string; // Formatted as "00:00:00"
  currentPosition: number; // In milliseconds
  durationMs: number; // Total duration in milliseconds
  error: string | null;
}

export interface PlayerControls {
  startPlayer: (uri: string) => Promise<void>;
  stopPlayer: () => Promise<void>;
  pausePlayer: () => void;
  resumePlayer: () => void;
  seekTo: (position: number) => void;
  setPlaybackRate: (rate: number) => void;
  isLoading: boolean;
}

/**
 * Format milliseconds to HH:MM:SS format (for display)
 */
export const formatPlayTime = (milliseconds: number): string => {
  // Validate input - handle NaN, Infinity, or negative values
  if (!isFinite(milliseconds) || milliseconds < 0) {
    return '00:00:00';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const usePlayer = (
  onPlayBack?: (data: { currentPosition: number; duration: number }) => void,
  onPlaybackEnd?: () => void,
  maxDurationMs?: number // Optional max duration from stored recording
): PlayerState & PlayerControls => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const maxDurationMsRef = useRef<number | undefined>(maxDurationMs);

  // Update ref when maxDurationMs changes
  useEffect(() => {
    if (maxDurationMs !== undefined) {
      maxDurationMsRef.current = maxDurationMs;
    }
  }, [maxDurationMs]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up status update listener
  useEffect(() => {
    if (!soundRef.current) return;

    const updateStatus = async () => {
      try {
        const status = await soundRef.current?.getStatusAsync();
        if (!status || !status.isLoaded) return;

        // Update current position
        if (status.positionMillis !== undefined && status.durationMillis !== undefined) {
          const current = status.positionMillis;
          const maxDuration = maxDurationMsRef.current && maxDurationMsRef.current > 0
            ? maxDurationMsRef.current
            : (durationMs > 0 ? durationMs : (status.durationMillis > 0 ? status.durationMillis : Infinity));

          // Check if we've reached the end
          if (maxDuration > 0 && isFinite(maxDuration) && current >= maxDuration - 100) {
            handleEnded();
            return;
          }

          setCurrentPosition(current);
          setPlayTime(formatPlayTime(current));

          // Update duration if not set
          if (durationMs === 0 && status.durationMillis > 0) {
            setDurationMs(status.durationMillis);
            setDuration(formatPlayTime(status.durationMillis));
          }

          // Update isPlaying state
          setIsPlaying(status.isPlaying || false);

          if (onPlayBack) {
            onPlayBack({
              currentPosition: current,
              duration: durationMs || status.durationMillis || 0,
            });
          }
        }
      } catch (err) {
        console.error('Error updating playback status:', err);
      }
    };

    // Poll for status updates (Expo AV doesn't have built-in timeupdate events)
    statusUpdateIntervalRef.current = setInterval(updateStatus, 100);

    return () => {
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
        statusUpdateIntervalRef.current = null;
      }
    };
  }, [durationMs, onPlayBack]);

  const handleEnded = useCallback(async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status && status.isLoaded && status.positionMillis !== undefined) {
          const finalPosition = status.positionMillis;
          
          // Update duration if it was 0
          if (durationMs === 0 && finalPosition > 0) {
            const finalDuration = Math.floor(finalPosition);
            setDurationMs(finalDuration);
            setDuration(formatPlayTime(finalDuration));
          }

          // Reset to beginning
          await soundRef.current.setPositionAsync(0);
          await soundRef.current.pauseAsync();
          
          setIsPlaying(false);
          setCurrentPosition(0);
          setPlayTime('00:00:00');
          
          if (onPlaybackEnd) {
            onPlaybackEnd();
          }
        }
      }
    } catch (err) {
      console.error('Error handling playback end:', err);
    }
  }, [durationMs, onPlaybackEnd]);

  const startPlayer = useCallback(async (uri: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload existing sound if present
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Create and load sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          isLooping: false,
        },
        (status) => {
          // Status update callback (we also use polling, but this is useful for immediate updates)
          if (status.isLoaded) {
            if (status.durationMillis !== undefined && durationMs === 0) {
              setDurationMs(status.durationMillis);
              setDuration(formatPlayTime(status.durationMillis));
            }
            
            if (status.isPlaying !== undefined) {
              setIsPlaying(status.isPlaying);
            }
          }
          
          // Check if playback finished
          if (status.didJustFinish) {
            handleEnded();
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Get initial status
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDurationMs(status.durationMillis);
        setDuration(formatPlayTime(status.durationMillis));
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to start playback';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('file') || errorMessage.includes('not found')) {
        errorMessage = 'Audio file not found. The recording may have been deleted.';
      } else if (errorMessage.includes('format') || errorMessage.includes('codec')) {
        errorMessage = 'Audio format not supported.';
      }
      
      setError(errorMessage);
      console.error('Error starting player:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [handleEnded, durationMs]);

  const stopPlayer = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        await soundRef.current.setPositionAsync(0);
        setIsPlaying(false);
        setCurrentPosition(0);
        setPlayTime('00:00:00');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop playback';
      setError(errorMessage);
      console.error('Error stopping player:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pausePlayer = useCallback(async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Error pausing player:', err);
    }
  }, [isPlaying]);

  const resumePlayer = useCallback(async () => {
    try {
      if (soundRef.current && !isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error resuming player:', err);
    }
  }, [isPlaying]);

  const seekTo = useCallback(async (position: number) => {
    try {
      if (soundRef.current && isFinite(position) && position >= 0) {
        const positionMillis = Math.floor(position);
        await soundRef.current.setPositionAsync(positionMillis);
        setCurrentPosition(positionMillis);
        setPlayTime(formatPlayTime(positionMillis));
      }
    } catch (err) {
      console.error('Error seeking:', err);
    }
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    try {
      setPlaybackRateState(rate);
      if (soundRef.current) {
        await soundRef.current.setRateAsync(rate, true);
      }
    } catch (err) {
      console.error('Error setting playback rate:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  return {
    isPlaying,
    playTime,
    duration,
    currentPosition,
    durationMs,
    error,
    startPlayer,
    stopPlayer,
    pausePlayer,
    resumePlayer,
    seekTo,
    setPlaybackRate,
    isLoading,
  };
};

