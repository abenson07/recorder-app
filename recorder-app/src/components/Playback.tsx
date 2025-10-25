import React, { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const recording = recordings.find((r) => r.id === id);

  // Set up audio element when recording changes
  useEffect(() => {
    if (recording && recording.audioUrl && audioRef.current) {
      audioRef.current.src = recording.audioUrl;
      audioRef.current.load();
    }
  }, [recording]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [recording]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue as number;
      setCurrentTime(newValue as number);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30);
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0, 
        audioRef.current.currentTime + 30
      );
    }
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
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transcribing...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your recording is being processed. You can still listen to it below.
              </Typography>
              <Chip
                label="Transcribing"
                color="warning"
                variant="outlined"
                sx={{ mb: 2 }}
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
          <Slide direction="up" in timeout={800}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VolumeUp sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1">
                  Transcript:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6, fontStyle: 'italic', color: 'text.secondary' }}>
                {recording.status === 'error' 
                  ? 'There was an error processing this recording.'
                  : 'Transcript will appear here once processing is complete...'
                }
              </Typography>
            </Paper>
          </Slide>
        )}
      </Box>

      {/* Playback Controls */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={currentTime}
            min={0}
            max={audioRef.current?.duration || recording.duration}
            onChange={handleSeek}
            disabled={recording.status !== 'done' || !recording.audioUrl}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(audioRef.current?.duration || recording.duration)}
            </Typography>
          </Box>
        </Box>

        {/* Control Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton
            onClick={handleRewind}
            disabled={recording.status !== 'done' || !recording.audioUrl}
            size="large"
          >
            <Replay30 />
          </IconButton>

          <IconButton
            onClick={handlePlayPause}
            disabled={recording.status !== 'done' || !recording.audioUrl}
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
            disabled={recording.status !== 'done' || !recording.audioUrl}
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
      
      {/* Hidden audio element for actual playback */}
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default Playback;
