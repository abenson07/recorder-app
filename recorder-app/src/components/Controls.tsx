import React from 'react';
import { Box, IconButton } from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Controls: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRecording } = useStore();

  // Determine current screen state
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const isRecordingPage = location.pathname === '/recording';
  const isPlayback = location.pathname.startsWith('/playback');

  const handleRecordClick = () => {
    navigate('/recording');
  };

  const handleStopClick = () => {
    // Navigate away - Recording component will handle cleanup
    navigate('/dashboard');
  };

  // Dashboard Controls: Record button, Stop button, Additional controls area
  if (isDashboard) {
    return (
      <Box
        sx={{
          height: '150px',
          width: '100%',
          backgroundColor: '#D1D1D1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          gap: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Record Button */}
        <IconButton
          onClick={handleRecordClick}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#f44336',
            }}
          />
        </IconButton>

        {/* Stop Button */}
        <IconButton
          onClick={handleStopClick}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              border: '2px solid rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(45deg)',
                width: 2,
                height: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          />
        </IconButton>

        {/* Additional Controls Area */}
        <Box
          sx={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            py: 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          />
          <Box
            sx={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          />
        </Box>
      </Box>
    );
  }

  // Recording Controls: Pause/Resume, Stop
  // Note: Recording component handles recording logic, Controls just shows buttons
  // that trigger events which Recording component listens to
  if (isRecordingPage) {
    return (
      <Box
        sx={{
          height: '150px',
          width: '100%',
          backgroundColor: '#D1D1D1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Pause/Resume Button - Trigger custom event */}
        {isRecording && (
          <IconButton
            onClick={() => {
              // Dispatch custom event that Recording component listens to
              window.dispatchEvent(new CustomEvent('recording:pause-resume'));
            }}
            sx={{
              width: 64,
              height: 64,
              borderRadius: 1,
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <Pause />
          </IconButton>
        )}

        {/* Stop Button */}
        <IconButton
          onClick={() => {
            // Dispatch custom event that Recording component listens to
            window.dispatchEvent(new CustomEvent('recording:stop'));
          }}
          disabled={!isRecording}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          <Stop />
        </IconButton>
      </Box>
    );
  }

  // Playback Controls: Play/Pause, Stop
  if (isPlayback) {
    return (
      <Box
        sx={{
          height: '150px',
          width: '100%',
          backgroundColor: '#D1D1D1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Play/Pause Button */}
        <IconButton
          onClick={() => {
            window.dispatchEvent(new CustomEvent('playback:play-pause'));
          }}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <PlayArrow />
        </IconButton>

        {/* Stop Button */}
        <IconButton
          onClick={() => {
            window.dispatchEvent(new CustomEvent('playback:stop'));
          }}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <Stop />
        </IconButton>
      </Box>
    );
  }

  // Default/fallback
  return (
    <Box
      sx={{
        height: '150px',
        width: '100%',
        backgroundColor: '#D1D1D1',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    />
  );
};

export default Controls;

