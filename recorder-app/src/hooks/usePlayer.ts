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
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const usePlayer = (
  onPlayBack?: (data: { currentPosition: number; duration: number }) => void,
  onPlaybackEnd?: () => void
): PlayerState & PlayerControls => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update play time display
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const current = Math.floor(audio.currentTime * 1000);
      setCurrentPosition(current);
      setPlayTime(formatPlayTime(current));

      if (onPlayBack) {
        onPlayBack({
          currentPosition: current,
          duration: durationMs,
        });
      }
    };

    const handleLoadedMetadata = () => {
      const duration = Math.floor(audio.duration * 1000);
      setDurationMs(duration);
      setDuration(formatPlayTime(duration));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPosition(0);
      setPlayTime('00:00:00');
      if (onPlaybackEnd) {
        onPlaybackEnd();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

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
        const maxTime = audioRef.current.duration || Infinity;
        audioRef.current.currentTime = Math.min(timeInSeconds, maxTime);
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

