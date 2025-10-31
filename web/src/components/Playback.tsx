import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { loadRecording } from '../lib/localStorage';
import { usePlayer } from '../hooks/usePlayer';
import { Recording } from '../store/useStore';
import Timestamp from './Timestamp';
import PlaybackWaveform from './PlaybackWaveform';
import { generatePeaksForDuration } from '../lib/audioUtils';

const Playback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteRecording, setIsPlaying } = useStore();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [durationUpdated, setDurationUpdated] = useState(false); // Track if we've updated duration
  const [peaks, setPeaks] = useState<number[]>([]);
  const [peaksLoading, setPeaksLoading] = useState(false);

  const handlePlayBack = ({ currentPosition, duration }: { currentPosition: number; duration: number }) => {
    // This is called during playback to update UI
  };

  const handlePlaybackEnd = () => {
    // Playback finished
  };

  // Calculate maxDurationMs for player (will be undefined until recording loads)
  const maxDurationMsForPlayer = recording && recording.duration && recording.duration > 0 && isFinite(recording.duration) 
    ? recording.duration * 1000 
    : undefined;

  const {
    isPlaying,
    playTime,
    duration,
    currentPosition,
    durationMs,
    error: playerError,
    startPlayer,
    stopPlayer,
    pausePlayer,
    resumePlayer,
    seekTo,
    setPlaybackRate,
    isLoading: playerLoading,
  } = usePlayer(handlePlayBack, handlePlaybackEnd, maxDurationMsForPlayer);

  // Load recording on mount
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setDurationUpdated(false); // Reset update flag when loading new recording
      try {
        const loaded = await loadRecording(id);
        if (loaded) {
          console.log('📹 Recording loaded:', {
            id: loaded.id,
            fileName: loaded.fileName,
            storedDuration: loaded.duration,
            storedDurationSeconds: loaded.duration,
            storedDurationMs: loaded.duration * 1000,
            audioUrl: loaded.audioUrl ? 'present' : 'missing',
            createdAt: loaded.createdAt,
          });
          setRecording(loaded);
          
          // Generate peaks for waveform visualization
          if (loaded.audioUrl && loaded.duration > 0) {
            setPeaksLoading(true);
            try {
              const generatedPeaks = await generatePeaksForDuration(
                loaded.audioUrl,
                loaded.duration
              );
              setPeaks(generatedPeaks);
              console.log('📊 Generated peaks for waveform:', {
                peakCount: generatedPeaks.length,
                durationSeconds: loaded.duration,
              });
            } catch (error) {
              console.error('Error generating peaks:', error);
              setPeaks([]);
            } finally {
              setPeaksLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error loading recording:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  // Start/stop playback when recording audioUrl is available
  useEffect(() => {
    if (recording?.audioUrl && !isPlaying && !playerLoading) {
      // Don't auto-play, wait for user interaction
    }
  }, [recording, isPlaying, playerLoading]);

  const formatTime = (milliseconds: number): string => {
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

  const formatRecordedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes}${ampm}`;
  };

  const handlePlayPause = async () => {
    if (!recording?.audioUrl) return;

    if (isPlaying) {
      pausePlayer();
    } else {
      try {
        await startPlayer(recording.audioUrl);
      } catch (error) {
        console.error('Failed to start playback:', error);
        alert('Failed to start playback. Please try again.');
      }
    }
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    if (typeof value === 'number' && isFinite(value) && value >= 0) {
      seekTo(value);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
  };

  // Sync playback state with global store
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Listen for playback control events from Controls component
  useEffect(() => {
    const handlePlayPauseEvent = () => {
      handlePlayPause();
    };

    const handleStopEvent = () => {
      stopPlayer();
      navigate('/dashboard');
    };

    window.addEventListener('playback:play-pause', handlePlayPauseEvent);
    window.addEventListener('playback:stop', handleStopEvent);

    return () => {
      window.removeEventListener('playback:play-pause', handlePlayPauseEvent);
      window.removeEventListener('playback:stop', handleStopEvent);
      // Reset isPlaying when component unmounts
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, recording]);

  // Monitor playback progress to update stored duration if it was missing
  useEffect(() => {
    // Only update once, and only if duration is substantial (> 1 second)
    if (!durationUpdated && isPlaying && recording && recording.duration === 0 && durationMs > 1000) {
      // If we detect a valid duration during playback for a recording with 0 duration,
      // update the recording duration (only if duration is substantial, > 1 second to avoid false positives)
      console.log('🔍 Detected playback duration for recording with missing duration:', {
        recordingId: recording.id,
        detectedDurationMs: durationMs,
        detectedDurationSeconds: Math.floor(durationMs / 1000),
      });
      // Update the recording duration in storage
      const { updateRecording } = useStore.getState();
      updateRecording(recording.id, {
        duration: Math.floor(durationMs / 1000), // Convert to seconds
      });
      // Update local state to reflect the change
      setRecording((prev) => {
        if (prev) {
          return { ...prev, duration: Math.floor(durationMs / 1000) };
        }
        return prev;
      });
      setDurationUpdated(true); // Mark as updated to prevent repeated updates
      console.log('✅ Updated recording duration in storage');
    }
  }, [isPlaying, recording, durationMs, durationUpdated]);

  if (isLoading) {
    return (
      <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#101010', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
      </Box>
    );
  }

  if (!recording) {
    return (
      <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#101010', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          The requested recording could not be found.
        </Typography>
      </Box>
    );
  }

  // Safely calculate durations with fallbacks
  // Priority: stored recording.duration > player durationMs
  // Only use player durationMs if it's substantial (> 2 seconds) and stored duration is missing
  const storedDurationMs = recording?.duration > 0 && isFinite(recording.duration) 
    ? recording.duration * 1000 
    : 0;
  
  const durationMsValue = storedDurationMs > 0 
    ? storedDurationMs  // Always prefer stored duration when available
    : (durationMs > 2000 && isFinite(durationMs) 
        ? durationMs  // Only use player duration if substantial (> 2 seconds) and stored is missing
        : 0);
  
  // Debug logging for duration calculation
  if (recording) {
    console.log('⏱️ Duration calculation:', {
      fromPlayer: durationMs,
      fromRecording: recording.duration,
      recordingDurationSeconds: recording.duration,
      recordingDurationMs: storedDurationMs,
      finalDurationMs: durationMsValue,
      finalDurationFormatted: formatTime(durationMsValue),
      currentPosition,
      maxDuration: durationMsValue > 0 ? durationMsValue : 100,
      usingStored: storedDurationMs > 0,
    });
  }
  
  const recordingDuration = formatTime(durationMsValue);
  const currentPlayTime = formatTime(currentPosition || 0);
  const maxDuration = durationMsValue > 0 ? durationMsValue : 100;
  const progressPercentage = maxDuration > 0 ? Math.min((currentPosition / maxDuration) * 100, 100) : 0;

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#101010' }}>
      {/* Top Section: Header with play icon + recording name and duration */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          py: 2,
        }}
      >
        {/* Left: Play icon + Recording name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayArrow sx={{ color: '#E6E6E6', fontSize: '20px' }} />
          <Typography
            sx={{
              color: '#E6E6E6',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            {recording.fileName.replace('Recording - ', '').split(',')[0] || recording.fileName}
          </Typography>
        </Box>

        {/* Right: Recording duration */}
        <Typography
          sx={{
            color: '#E6E6E6',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          {recordingDuration}
        </Typography>
      </Box>

      {/* Middle Section: Waveform area (fills remaining space) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          backgroundColor: '#101010',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        {peaksLoading ? (
          <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.5)' }} size={24} />
        ) : peaks.length > 0 && durationMsValue > 0 ? (
          <PlaybackWaveform
            peaks={peaks}
            height={300}
            currentPosition={currentPosition}
            duration={durationMsValue}
            color="rgba(255, 255, 255, 0.5)" // Unplayed portion: 50% opacity (gray)
            progressColor="#FFFFFF" // Played portion: full opacity (white)
            barWidth={2}
            onClick={(seconds) => {
              // Seek to clicked position
              seekTo(seconds * 1000); // Convert to milliseconds
            }}
          />
        ) : (
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            {peaks.length === 0 ? 'No waveform data' : `Duration: ${durationMsValue}ms`}
          </Typography>
        )}
      </Box>

      {/* Bottom Section: Recorded date, timestamp, and progress bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          px: '16px',
          py: 3,
        }}
      >
        {/* Recorded date/time */}
        <Typography
          sx={{
            fontSize: '12px',
            color: 'rgba(230, 230, 230, 0.5)',
            mb: 1,
          }}
        >
          Recorded {formatRecordedDate(recording.createdAt)}
        </Typography>

        {/* Large timestamp */}
        <Box sx={{ mb: 2 }}>
          <Timestamp time={currentPlayTime} />
        </Box>

        {/* Playback progress bar */}
        <Box sx={{ position: 'relative', width: '100%' }}>
          {/* Base line (full width) */}
          <Box
            sx={{
              width: '100%',
              height: '1px',
              backgroundColor: 'rgba(230, 230, 230, 0.3)',
            }}
          />
          {/* Progress line (on top) */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${progressPercentage}%`,
              height: '2px',
              backgroundColor: 'rgba(230, 230, 230, 0.7)',
              transition: 'width 0.1s linear',
            }}
          />
        </Box>
      </Box>

      {/* Error Display */}
      {playerError && (
        <Box sx={{ px: '16px', pb: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#f44336' }}>
            {playerError}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Playback;
