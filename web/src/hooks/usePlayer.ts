import { useState, useRef, useCallback, useEffect } from 'react';

export interface PlayerState {
  isPlaying: boolean;
  playTime: string; // Formatted as "00:00:00"
  duration: string; // Formatted as "00:00:00"
  currentPosition: number; // In milliseconds
  durationMs: number; // Total duration in milliseconds
  error: string | null;
}

export interface PlayerControls {
  startPlayer: (path: string) => Promise<void>;
  stopPlayer: () => Promise<void>;
  pausePlayer: () => void;
  resumePlayer: () => void;
  seekTo: (position: number) => void;
  setPlaybackRate: (rate: number) => void;
  isLoading: boolean;
}

/**
 * Format milliseconds to MM:SS format
 */
export const formatPlayTime = (milliseconds: number): string => {
  // Validate input - handle NaN, Infinity, or negative values
  if (!isFinite(milliseconds) || milliseconds < 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const usePlayer = (
  onPlayBack?: (data: { currentPosition: number; duration: number }) => void,
  onPlaybackEnd?: () => void,
  maxDurationMs?: number // Optional max duration from stored recording
): PlayerState & PlayerControls => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const maxDurationMsRef = useRef<number | undefined>(maxDurationMs);

  // Update ref when maxDurationMs changes (allows updating from parent component)
  useEffect(() => {
    if (maxDurationMs !== undefined) {
      maxDurationMsRef.current = maxDurationMs;
    }
  }, [maxDurationMs]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update play time display
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // Don't update if audio is paused or ended
      if (audio.paused || audio.ended) {
        return;
      }
      
      // Validate currentTime to prevent NaN issues
      const currentTime = audio.currentTime;
      if (isFinite(currentTime) && currentTime >= 0) {
        const current = Math.floor(currentTime * 1000);
        
        // Check if we've reached the end (with small buffer for precision)
        // Use maxDurationMs (from stored recording) if provided, otherwise use durationMs or audio.duration
        const maxDuration = maxDurationMsRef.current && maxDurationMsRef.current > 0 
          ? maxDurationMsRef.current 
          : (durationMs > 0 
              ? durationMs 
              : (audio.duration > 0 && isFinite(audio.duration) 
                  ? audio.duration * 1000 
                  : Infinity));
        
        if (maxDuration > 0 && isFinite(maxDuration) && current >= maxDuration - 100) { // 100ms buffer
          // We've reached the end - trigger ended handler
          // But first check if audio.ended is already true to avoid duplicate calls
          if (!audio.ended) {
            handleEnded();
          }
          return;
        }
        
        setCurrentPosition(current);
        setPlayTime(formatPlayTime(current));

        // If durationMs is 0 (stored duration was missing) and we have a valid currentTime,
        // estimate duration from currentTime (this will be updated as playback progresses)
        // This is a workaround for WebM files without duration metadata
        if (durationMs === 0 && currentTime > 0) {
          // Estimate duration as slightly more than current time (will be refined as we play)
          const estimatedDuration = Math.floor((currentTime + 1) * 1000);
          if (estimatedDuration > durationMs) {
            setDurationMs(estimatedDuration);
            setDuration(formatPlayTime(estimatedDuration));
          }
        }

        if (onPlayBack) {
          onPlayBack({
            currentPosition: current,
            duration: durationMs || Math.floor((currentTime + 1) * 1000),
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      // Validate audio.duration - check for NaN, Infinity, or invalid values
      const rawDuration = audio.duration;
      console.log('🎵 Audio metadata loaded:', {
        rawDuration,
        isFinite: isFinite(rawDuration),
        isValid: isFinite(rawDuration) && rawDuration > 0,
        durationMs: isFinite(rawDuration) && rawDuration > 0 ? Math.floor(rawDuration * 1000) : 0,
      });
      
      // WebM files often don't have duration metadata (returns Infinity)
      // We should rely on the stored duration from the recording instead
      if (isFinite(rawDuration) && rawDuration > 0 && rawDuration !== Infinity) {
        const duration = Math.floor(rawDuration * 1000);
        setDurationMs(duration);
        setDuration(formatPlayTime(duration));
      } else {
        // Invalid duration (NaN, Infinity, or 0) - keep durationMs at 0
        // The Playback component will use stored recording.duration as fallback
        console.warn('⚠️ Invalid audio duration detected (likely WebM without metadata):', rawDuration);
        console.warn('⚠️ Will use stored recording.duration instead');
        setDurationMs(0); // Keep at 0 so Playback component uses recording.duration
        setDuration('00:00');
      }
    };

    const handleEnded = () => {
      // When playback ends, we now know the actual duration
      // Update durationMs to the final position if it was previously 0
      const finalPosition = audio.currentTime * 1000;
      if (durationMs === 0 && finalPosition > 0) {
        const finalDuration = Math.floor(finalPosition);
        setDurationMs(finalDuration);
        setDuration(formatPlayTime(finalDuration));
        console.log('✅ Playback ended - final duration determined:', {
          finalDurationMs: finalDuration,
          finalDurationSeconds: Math.floor(finalDuration / 1000),
        });
      }
      
      // Reset audio element to beginning and pause
      audio.pause();
      audio.currentTime = 0;
      
      // Reset state
      setIsPlaying(false);
      setCurrentPosition(0);
      setPlayTime('00:00');
      
      console.log('🛑 Playback ended - reset to beginning');
      
      if (onPlaybackEnd) {
        onPlaybackEnd();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Note: handleEnded needs to be accessible in handleTimeUpdate, so we declare it earlier
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [durationMs, onPlayBack, onPlaybackEnd]);

  const startPlayer = useCallback(async (path: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        const audio = new Audio();
        audio.preload = 'metadata';
        audioRef.current = audio;
      }

      const audio = audioRef.current;
      audio.src = path;
      audio.playbackRate = playbackRate;
      await audio.play();
      
      setIsPlaying(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start playback';
      setError(errorMessage);
      console.error('Error starting player:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [playbackRate]);

  const stopPlayer = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentPosition(0);
        setPlayTime('00:00');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop playback';
      setError(errorMessage);
      console.error('Error stopping player:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pausePlayer = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resumePlayer = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekTo = useCallback((position: number) => {
    if (audioRef.current && isFinite(position) && position >= 0) {
      const timeInSeconds = position / 1000; // Convert ms to seconds
      if (isFinite(timeInSeconds) && timeInSeconds >= 0) {
        // Ensure we don't seek beyond the duration
        const audioDuration = audioRef.current.duration;
        if (isFinite(audioDuration) && audioDuration > 0) {
          audioRef.current.currentTime = Math.min(timeInSeconds, audioDuration);
        } else {
          audioRef.current.currentTime = timeInSeconds;
        }
      }
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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

