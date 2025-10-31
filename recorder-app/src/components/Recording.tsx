import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useRecorder } from '../hooks/useRecorder';
import { saveRecording } from '../lib/localStorage';
import Timestamp from './Timestamp';

const Recording: React.FC = () => {
  const navigate = useNavigate();
  const { addRecording, setIsRecording, setIsPaused } = useStore();
  const [showError, setShowError] = useState(false);
  const [recordBackData, setRecordBackData] = useState<{ currentPosition: number } | null>(null);

  const handleRecordBack = useCallback((data: { currentPosition: number }) => {
    setRecordBackData(data);
  }, []);

  const {
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
    getFinalDuration,
    isLoading,
  } = useRecorder(handleRecordBack);

  // Update global recording state
  useEffect(() => {
    setIsRecording(isRecording);
  }, [isRecording, setIsRecording]);

  // Update global paused state
  useEffect(() => {
    setIsPaused(isPaused);
  }, [isPaused, setIsPaused]);

  // Reset paused state when recording stops or component unmounts
  useEffect(() => {
    if (!isRecording) {
      setIsPaused(false);
    }
    return () => {
      setIsPaused(false);
    };
  }, [isRecording, setIsPaused]);

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
      // Error handling done via error state and snackbar
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecorder();
    } else {
      pauseRecorder();
    }
  };

  /**
   * Calculate duration from audio blob (primary method - most reliable)
   */
  const getDurationFromBlob = (blob: Blob, audioUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      let resolved = false;
      
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', handleMetadata);
        audio.removeEventListener('error', handleError);
        // Don't revoke URL - it's needed for the recording
        // The audio element will be garbage collected
      };
      
      const handleMetadata = () => {
        if (resolved) return;
        resolved = true;
        const duration = audio.duration;
        console.log('🎵 Blob metadata loaded:', {
          rawDuration: duration,
          isFinite: isFinite(duration),
          isValid: isFinite(duration) && duration > 0,
          durationSeconds: isFinite(duration) && duration > 0 ? Math.floor(duration) : 0,
        });
        // Check if duration is valid (not NaN, Infinity, or <= 0)
        if (isFinite(duration) && duration > 0) {
          cleanup();
          resolve(Math.floor(duration));
        } else {
          cleanup();
          resolve(0);
        }
      };
      
      const handleError = (e: Event) => {
        if (resolved) return;
        resolved = true;
        console.error('❌ Error loading audio blob metadata:', e);
        cleanup();
        resolve(0);
      };
      
      audio.addEventListener('loadedmetadata', handleMetadata);
      audio.addEventListener('error', handleError);
      
      // Load the audio to trigger metadata loading
      audio.load();
      
      // Timeout fallback after 5 seconds (increased from 2 for longer recordings)
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('⏱️ Timeout waiting for audio metadata');
          cleanup();
          resolve(0);
        }
      }, 5000);
    });
  };

  const handleStopRecording = async () => {
    try {
      // Get final duration from recorder hook BEFORE stopping (uses refs, most accurate)
      const recordedDurationMs = getFinalDuration();
      console.log('🔴 Stopping recording - initial duration:', {
        durationMs: recordedDurationMs,
        durationSeconds: Math.floor(recordedDurationMs / 1000),
        currentPositionState: currentPosition, // For comparison
      });
      
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

      // Primary method: Use duration from recorder hook (most reliable for WebM)
      let duration = Math.floor(recordedDurationMs / 1000);
      
      // Fallback: Try blob duration if recorder duration is 0 or invalid
      if (duration === 0 || !isFinite(duration)) {
        console.log('⚠️ Recorder duration is 0 or invalid, attempting blob fallback...');
        const blobDuration = await getDurationFromBlob(audioBlob, audioUrl);
        console.log('🔵 Blob fallback duration:', blobDuration);
        if (blobDuration > 0 && isFinite(blobDuration)) {
          duration = blobDuration;
        }
      }
      
      console.log('🔴 Final duration calculation:', {
        recorderDurationMs: recordedDurationMs,
        recorderDurationSeconds: Math.floor(recordedDurationMs / 1000),
        finalDurationSeconds: duration,
        blobSizeMB: (audioBlob.size / (1024 * 1024)).toFixed(2),
      });

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
      
      console.log('💾 Saving recording with duration:', {
        id: newRecording.id,
        fileName: newRecording.fileName,
        duration: newRecording.duration,
        durationSeconds: newRecording.duration,
        durationMs: newRecording.duration * 1000,
        blobSize: audioBlob.size,
        blobSizeMB: (audioBlob.size / (1024 * 1024)).toFixed(2),
      });

      // Save to local storage
      await saveRecording(newRecording);

      // Add to store
      addRecording(newRecording);

      // Clean up
      resetRecorder();
      navigate('/dashboard');
    } catch (err) {
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
      {/* Top Section: Header with "New recording" and "32kbps" */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          py: 2,
        }}
      >
        {/* Left: Red dot + "New recording" */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#f44336',
            }}
          />
          <Typography
            sx={{
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 400,
            }}
          >
            New recording
          </Typography>
        </Box>

        {/* Right: "32kbps" */}
        <Typography
          sx={{
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          32kbps
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
        }}
      >
        {/* Waveform placeholder - empty for now */}
      </Box>

      {/* Bottom Section: Large timestamp */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          px: '16px',
          py: 3,
        }}
      >
        <Timestamp time={recordTime} />
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
