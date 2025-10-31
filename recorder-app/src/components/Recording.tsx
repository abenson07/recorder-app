import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Mic,
  MicOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useRecorder } from '../hooks/useRecorder';
import { saveRecording } from '../lib/localStorage';

const Recording: React.FC = () => {
  const navigate = useNavigate();
  const { addRecording, setIsRecording } = useStore();
  const [showError, setShowError] = useState(false);
  const [recordBackData, setRecordBackData] = useState<{ currentPosition: number } | null>(null);

  const handleRecordBack = useCallback((data: { currentPosition: number }) => {
    setRecordBackData(data);
  }, []);

  const {
    isRecording,
    isPaused,
    recordTime,
    error,
    startRecorder,
    stopRecorder,
    pauseRecorder,
    resumeRecorder,
    resetRecorder,
    isLoading,
  } = useRecorder(handleRecordBack);

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
    if (!isRecording && !isLoading) {
      handleStartRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Listen for controls events
  useEffect(() => {
    const handlePauseResume = () => {
      handlePauseRecording();
    };

    const handleStop = () => {
      handleStopRecording();
    };

    window.addEventListener('recording:pause-resume', handlePauseResume);
    window.addEventListener('recording:stop', handleStop);

    return () => {
      window.removeEventListener('recording:pause-resume', handlePauseResume);
      window.removeEventListener('recording:stop', handleStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, isRecording]); // Handlers are stable, only need isPaused and isRecording

  const handleStartRecording = async () => {
    try {
      await startRecorder();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecorder();
    } else {
      pauseRecorder();
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioUrl = await stopRecorder();
      
      if (!audioUrl) {
        throw new Error('No recording data available');
      }

      // Get the blob from the URL
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Check file size (limit to 25MB for now)
      const fileSizeMB = audioBlob.size / (1024 * 1024);
      if (fileSizeMB > 25) {
        alert('Recording is too large. Please keep recordings under 25MB.');
        resetRecorder();
        navigate('/dashboard');
        return;
      }

      // Calculate duration in seconds
      const duration = recordBackData ? Math.floor(recordBackData.currentPosition / 1000) : 0;

      // Create recording object
      const title = `Recording - ${new Date().toLocaleString()}`;
      const newRecording = {
        id: `rec_${Date.now()}`,
        fileName: title,
        duration,
        status: 'done' as const,
        createdAt: new Date().toISOString(),
        audioBlob,
        audioUrl,
      };

      // Save to local storage
      await saveRecording(newRecording);

      // Add to store
      addRecording(newRecording);

      alert('Recording saved successfully!');
      
      // Clean up
      resetRecorder();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save recording:', err);
      alert(`Failed to save recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRecording = () => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      resetRecorder();
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (isRecording) {
      if (window.confirm('You have an active recording. Are you sure you want to go back?')) {
        resetRecorder();
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#101010' }}>
      {/* Recording Status */}
      <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          variant="h3"
          component="div"
          gutterBottom
          sx={{
            fontWeight: 300,
            color: isRecording ? '#ff9800' : 'rgba(255, 255, 255, 0.7)',
            transition: 'color 0.3s ease',
            mb: 3,
          }}
        >
          {recordTime}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
          {isRecording ? (
            <Mic sx={{ color: '#f44336', fontSize: 48, animation: 'pulse 1.5s infinite' }} />
          ) : (
            <MicOff sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 48 }} />
          )}
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
          }}
          gutterBottom
        >
          {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
        </Typography>

        {isLoading && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {isRecording ? 'Stopping...' : 'Starting...'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Recording Controls will be handled by Controls component */}

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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default Recording;
