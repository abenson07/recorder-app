import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Slider,
  Chip,
  Fade,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  VolumeUp,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { loadRecording } from '../lib/localStorage';
import { usePlayer } from '../hooks/usePlayer';
import { Recording } from '../store/useStore';

const Playback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteRecording, setIsPlaying } = useStore();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handlePlayBack = ({ currentPosition, duration }: { currentPosition: number; duration: number }) => {
    // This is called during playback to update UI
  };

  const handlePlaybackEnd = () => {
    // Playback finished
  };

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
  } = usePlayer(handlePlayBack, handlePlaybackEnd);

  // Load recording on mount
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const loaded = await loadRecording(id);
        if (loaded) {
          setRecording(loaded);
          
          // If we have an audioUrl, start loading it
          if (loaded.audioUrl) {
            // Don't auto-play, just prepare
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
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#101010' }}>

      {/* Content Area */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {/* Recording Title */}
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            mb: 2,
            fontSize: '1rem',
            fontWeight: 300,
          }}
        >
          {recording.fileName.replace('Recording - ', '').split(',')[0] || recording.fileName}
        </Typography>

        {recording.status === 'transcribing' ? (
          <Fade in timeout={600}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.5)' }} />
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                Transcribing...
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}>
                Your recording is being processed.
              </Typography>
            </Box>
          </Fade>
        ) : recording.status === 'done' && recording.transcript ? (
          <Slide direction="up" in timeout={800}>
            <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VolumeUp sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Transcript:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.9)' }}>
                {recording.transcript}
              </Typography>
            </Paper>
          </Slide>
        ) : (
          <Slide direction="up" in timeout={800}>
            <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VolumeUp sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Transcript:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6, fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.5)' }}>
                {recording.status === 'error' 
                  ? 'There was an error processing this recording.'
                  : 'Transcript will appear here once processing is complete...'
                }
              </Typography>
            </Paper>
          </Slide>
        )}
      </Box>

      {/* Playback Controls - These will be moved to Controls component, keeping minimal UI here */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={isFinite(currentPosition) ? currentPosition : 0}
            min={0}
            max={isFinite(durationMs) && durationMs > 0 ? durationMs : (isFinite(recording.duration) && recording.duration > 0 ? recording.duration * 1000 : 100)}
            onChange={handleSeek}
            disabled={!recording.audioUrl || playerLoading}
            sx={{
              mb: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              '& .MuiSlider-thumb': {
                backgroundColor: 'white',
              },
              '& .MuiSlider-track': {
                backgroundColor: 'white',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {playTime || formatTime(0)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {duration || formatTime(recording.duration * 1000)}
            </Typography>
          </Box>
        </Box>

        {/* Error Display */}
        {playerError && (
          <Box sx={{ mb: 1, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#f44336' }}>
              {playerError}
            </Typography>
          </Box>
        )}

        {/* Playback controls will be handled by Controls component */}
      </Box>
    </Box>
  );
};

export default Playback;
