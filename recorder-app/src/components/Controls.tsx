import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { PlayArrow, Pause, Stop, Wifi, Headset, TextFields, VolumeUp } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Dial from './Dial';
import Light from './Light';

const Controls: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRecording, isPaused, isPlaying } = useStore();
  const [wifiLightState, setWifiLightState] = useState<{ light: 'red' | 'green'; status: 'processing' | 'ready' }>({
    light: 'green',
    status: 'ready',
  });
  const prevIsRecordingRef = useRef(isRecording);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WiFi light blinking when recording stops
  useEffect(() => {
    // Detect transition from recording to not recording
    if (prevIsRecordingRef.current && !isRecording) {
      // Recording just stopped - blink WiFi light red for 5 seconds
      setWifiLightState({ light: 'red', status: 'processing' });
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout for exactly 5 seconds (5000ms)
      timeoutRef.current = setTimeout(() => {
        setWifiLightState({ light: 'green', status: 'ready' });
        timeoutRef.current = null;
      }, 5000);
    } else if (!prevIsRecordingRef.current && isRecording) {
      // If recording starts again, ensure WiFi light is green
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setWifiLightState({ light: 'green', status: 'ready' });
    }
    
    prevIsRecordingRef.current = isRecording;
    
    // Cleanup on unmount only
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isRecording]);

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

        {/* Position 2: Dial */}
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
        >
          <Dial isActive={false} />
        </Box>

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
            <Wifi />
            <Light light={wifiLightState.light} status={wifiLightState.status} />
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
        {/* Position 1: Pause/Play Dual Icons */}
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
            <Pause sx={{ fontSize: '1.2rem', opacity: isRecording && !isPaused ? 1 : 0.3, transition: 'opacity 0.3s' }} />
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>/</Typography>
            <PlayArrow sx={{ fontSize: '1.2rem', opacity: isRecording && isPaused ? 1 : 0.3, transition: 'opacity 0.3s' }} />
          </Box>
        </IconButton>

        {/* Position 2: Dial */}
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
        >
          <Dial isActive={isRecording} />
        </Box>

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

        {/* Position 2: Dial */}
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
        >
          <Dial isActive={isPlaying} />
        </Box>

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

