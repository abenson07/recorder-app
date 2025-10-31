import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { PlayArrow, Pause, Stop, Wifi, Headset, TextFields, VolumeUp } from '@mui/icons-material';
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
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '2px',
          gap: '2px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Position 1: Record Button */}
        <IconButton
          onClick={handleRecordClick}
          sx={{
            flex: 1,
            borderRadius: '6px 2px 2px 6px',
            backgroundColor: '#D1D1D1 !important',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#D1D1D1 !important',
            },
            '&:disabled': {
              backgroundColor: '#D1D1D1 !important',
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

        {/* Position 2: Empty Button */}
        <Box
          sx={{
            flex: 1,
            borderRadius: '2px',
            backgroundColor: '#D1D1D1',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        />

        {/* Position 3 & 4: Additional Controls Area (flex column with equal height children) */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            borderRadius: '2px 6px 6px 2px',
          }}
        >
          {/* Position 3: WiFi Icon */}
          <IconButton
            sx={{
              flex: 1,
              borderRadius: '2px 6px 2px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
            disabled
          >
            <Wifi />
          </IconButton>

          {/* Position 4: Headphones Icon */}
          <IconButton
            sx={{
              flex: 1,
              borderRadius: '2px 2px 6px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
            disabled
          >
            <Headset />
          </IconButton>
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
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '2px',
          gap: '2px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Position 1: Pause Button (always visible) */}
        <IconButton
          onClick={() => {
            if (isRecording) {
              window.dispatchEvent(new CustomEvent('recording:pause-resume'));
            }
          }}
          sx={{
            flex: 1,
            borderRadius: '6px 2px 2px 6px',
            backgroundColor: '#D1D1D1 !important',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: '#D1D1D1 !important',
            },
            '&:disabled': {
              backgroundColor: '#D1D1D1 !important',
            },
          }}
        >
          <Pause sx={{ opacity: isRecording ? 1 : 0.3, transition: 'opacity 0.3s' }} />
        </IconButton>

        {/* Position 2: Empty Button */}
        <Box
          sx={{
            flex: 1,
            borderRadius: '2px',
            backgroundColor: '#D1D1D1',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        />

        {/* Position 3 & 4: Additional Controls Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            borderRadius: '2px 6px 6px 2px',
          }}
        >
          {/* Position 3: Stop/Save Button */}
          <IconButton
            onClick={() => {
              if (isRecording) {
                window.dispatchEvent(new CustomEvent('recording:stop'));
              }
            }}
            sx={{
              flex: 1,
              borderRadius: '2px 6px 2px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
          >
            <Stop sx={{ opacity: isRecording ? 1 : 0.3, transition: 'opacity 0.3s' }} />
          </IconButton>

          {/* Position 4: Headphones Icon */}
          <IconButton
            sx={{
              flex: 1,
              borderRadius: '2px 2px 6px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
            disabled
          >
            <Headset />
          </IconButton>
        </Box>
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
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '2px',
          gap: '2px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Position 1: Pause/Play Dual Icons */}
        <IconButton
          onClick={() => {
            window.dispatchEvent(new CustomEvent('playback:play-pause'));
          }}
          sx={{
            flex: 1,
            borderRadius: '6px 2px 2px 6px',
            backgroundColor: '#D1D1D1 !important',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            '&:hover': {
              backgroundColor: '#D1D1D1 !important',
            },
            '&:disabled': {
              backgroundColor: '#D1D1D1 !important',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Pause sx={{ fontSize: '1.2rem' }} />
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>/</Typography>
            <PlayArrow sx={{ fontSize: '1.2rem' }} />
          </Box>
        </IconButton>

        {/* Position 2: Empty Button */}
        <Box
          sx={{
            flex: 1,
            borderRadius: '2px',
            backgroundColor: '#D1D1D1',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        />

        {/* Position 3 & 4: Additional Controls Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            borderRadius: '2px 6px 6px 2px',
          }}
        >
          {/* Position 3: Text/Audio Dual Icons */}
          <IconButton
            sx={{
              flex: 1,
              borderRadius: '2px 6px 2px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              gap: 0.5,
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
            disabled
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TextFields sx={{ fontSize: '1.2rem' }} />
              <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>/</Typography>
              <VolumeUp sx={{ fontSize: '1.2rem' }} />
            </Box>
          </IconButton>

          {/* Position 4: Stop Icon (back functionality) */}
          <IconButton
            onClick={() => {
              window.dispatchEvent(new CustomEvent('playback:stop'));
            }}
            sx={{
              flex: 1,
              borderRadius: '2px 2px 6px 2px',
              backgroundColor: '#D1D1D1 !important',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: '#D1D1D1 !important',
              },
              '&:disabled': {
                backgroundColor: '#D1D1D1 !important',
              },
            }}
          >
            <Stop />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // Default/fallback
  return (
    <Box
      sx={{
        height: '150px',
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: '8px',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    />
  );
};

export default Controls;

