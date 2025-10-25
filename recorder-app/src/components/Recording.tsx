import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  LinearProgress,
  Fade,
  Slide,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Delete,
  ArrowBack,
  Mic,
  MicOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';

const Recording: React.FC = () => {
  const navigate = useNavigate();
  const { addRecording, setIsRecording } = useStore();
  const [showError, setShowError] = useState(false);

  // Use real audio recording hook
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    stream,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    getCurrentBlob,
  } = useAudioRecorder();

  // Use real audio visualization hook
  const { audioLevel, waveformData, isAnalyzing } = useAudioVisualizer(
    stream, // Pass the actual stream
    isRecording,
    isPaused
  );

  // Update global recording state
  useEffect(() => {
    setIsRecording(isRecording);
  }, [isRecording, setIsRecording]);

  // Show error if recording fails
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Auto-start recording when component mounts
  useEffect(() => {
    const autoStart = async () => {
      try {
        await startRecording();
      } catch (err) {
        console.error('Auto-start recording failed:', err);
      }
    };
    
    autoStart();
  }, []); // Only run once on mount

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
    
    // Use the ref directly since state might not be updated yet
    const currentBlob = getCurrentBlob();
    
    // Save the recording even if it's empty
    if (currentBlob) {
      try {
        // Check file size (Whisper limit is 25MB)
        const fileSizeMB = currentBlob.size / (1024 * 1024);
        if (fileSizeMB > 25) {
          alert('Recording is too large. Please keep recordings under 25MB.');
          resetRecording();
          navigate('/dashboard');
          return;
        }

        const newRecording = {
          id: Date.now().toString(),
          fileName: `Recording - ${new Date().toLocaleString()}`,
          duration: recordingTime,
          status: 'done' as const, // Set to done immediately since we don't have transcription yet
          createdAt: new Date().toISOString(),
          audioBlob: currentBlob, // Store the actual audio blob
          audioUrl: URL.createObjectURL(currentBlob), // Create URL from the blob
        };
        
        addRecording(newRecording);
      } catch (err) {
        console.error('Failed to save recording:', err);
        alert('Failed to save recording. Please try again.');
      }
    }
    
    resetRecording();
    navigate('/dashboard');
  };

  const handleDeleteRecording = () => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      resetRecording();
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (isRecording) {
      if (window.confirm('You have an active recording. Are you sure you want to go back?')) {
        resetRecording();
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" component="h1">
          Recording
        </Typography>
      </Box>

      {/* Recording Status */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Fade in timeout={500}>
          <Box>
            <Typography 
              variant="h4" 
              component="div" 
              gutterBottom
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: isRecording ? 'primary.main' : 'text.primary',
                transition: 'color 0.3s ease',
              }}
            >
              {formatTime(recordingTime)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {isRecording ? (
                <Mic sx={{ color: 'error.main', animation: 'pulse 1.5s infinite' }} />
              ) : (
                <MicOff sx={{ color: 'text.secondary' }} />
              )}
              <Typography variant="body2" color="text.secondary">
                {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* Waveform Visualization */}
      <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Slide direction="up" in timeout={600}>
          <Paper
            sx={{
              width: '100%',
              height: '200px',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f8f8',
              borderRadius: 2,
              boxShadow: isRecording ? '0 4px 12px rgba(25, 118, 210, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            {waveformData.length > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
                {waveformData.map((value, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: '4px',
                      height: `${Math.max(value, 5)}%`,
                      backgroundColor: isRecording && !isPaused ? '#1976d2' : '#ccc',
                      borderRadius: '2px',
                      transition: 'all 0.1s ease',
                      animation: isRecording && !isPaused ? 'waveformPulse 0.5s ease-in-out infinite alternate' : 'none',
                      animationDelay: `${index * 0.01}s`,
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Fade in timeout={800}>
                <Box sx={{ textAlign: 'center' }}>
                  <Mic sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2" color="text.secondary">
                    {isRecording ? 'Waveform will appear here' : 'Start recording to see waveform'}
                  </Typography>
                  {isAnalyzing && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      Audio Level: {Math.round(audioLevel)}%
                    </Typography>
                  )}
                </Box>
              </Fade>
            )}
          </Paper>
        </Slide>
      </Box>

      {/* Recording Controls */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton
          onClick={handleDeleteRecording}
          disabled={!isRecording}
          color="error"
          size="large"
        >
          <Delete />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isRecording ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartRecording}
              size="large"
            >
              Start Recording
            </Button>
          ) : (
            <>
              <IconButton
                onClick={handlePauseRecording}
                color="primary"
                size="large"
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
            </>
          )}
        </Box>

        <IconButton
          onClick={handleStopRecording}
          disabled={!isRecording}
          color="error"
          size="large"
        >
          <Stop />
        </IconButton>
      </Box>

      {/* Progress indicator for transcribing status */}
      {isRecording && (
        <Box sx={{ p: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Recording in progress...
          </Typography>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error || 'Recording failed. Please check your microphone permissions.'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Recording;
