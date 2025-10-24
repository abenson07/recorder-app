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
  PlayArrow,
  Pause,
  Replay30,
  Forward30,
  ArrowBack,
  Speed,
  VolumeUp,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Playback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recordings } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const recording = recordings.find((r) => r.id === id);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= (recording?.duration || 0)) {
            setIsPlaying(false);
            return recording?.duration || 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackSpeed, recording?.duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    setCurrentTime(newValue as number);
  };

  const handleRewind = () => {
    setCurrentTime(Math.max(0, currentTime - 30));
  };

  const handleForward = () => {
    setCurrentTime(Math.min(recording?.duration || 0, currentTime + 30));
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (!recording) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="h1">
            Recording Not Found
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            The requested recording could not be found.
          </Typography>
        </Box>
      </Box>
    );
  }

  // const progress = recording.duration > 0 ? (currentTime / recording.duration) * 100 : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" component="h1" noWrap>
          {recording.fileName}
        </Typography>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, p: 2 }}>
        {recording.status === 'transcribing' ? (
          <Fade in timeout={600}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transcribing...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your recording is being processed. This may take a few moments.
              </Typography>
              <Chip
                label="Transcribing"
                color="warning"
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </Box>
          </Fade>
        ) : recording.status === 'done' && recording.transcript ? (
          <Slide direction="up" in timeout={800}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VolumeUp sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1">
                  Transcript:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {recording.transcript}
              </Typography>
            </Paper>
          </Slide>
        ) : (
          <Fade in timeout={600}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No transcript available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {recording.status === 'error' 
                  ? 'There was an error processing this recording.'
                  : 'This recording is still being processed.'
                }
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Playback Controls */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={currentTime}
            min={0}
            max={recording.duration}
            onChange={handleSeek}
            disabled={recording.status !== 'done'}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(recording.duration)}
            </Typography>
          </Box>
        </Box>

        {/* Control Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton
            onClick={handleRewind}
            disabled={recording.status !== 'done'}
            size="large"
          >
            <Replay30 />
          </IconButton>

          <IconButton
            onClick={handlePlayPause}
            disabled={recording.status !== 'done'}
            size="large"
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.1)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:disabled': {
                backgroundColor: 'action.disabled',
                color: 'action.disabled',
                transform: 'none',
                boxShadow: 'none',
              },
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>

          <IconButton
            onClick={handleForward}
            disabled={recording.status !== 'done'}
            size="large"
          >
            <Forward30 />
          </IconButton>

          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              disabled={recording.status !== 'done'}
              size="large"
            >
              <Speed />
            </IconButton>
            {showSpeedMenu && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  minWidth: '80px',
                }}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    size="small"
                    variant={playbackSpeed === speed ? 'contained' : 'text'}
                    onClick={() => handleSpeedChange(speed)}
                    sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                  >
                    {speed}x
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Status Indicator */}
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Chip
            label={recording.status}
            color={
              recording.status === 'done' ? 'success' :
              recording.status === 'transcribing' ? 'warning' :
              recording.status === 'error' ? 'error' : 'default'
            }
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Playback;
