import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Fade,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  AccessTime,
  Mic,
} from '@mui/icons-material';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { loadRecording } from '../lib/localStorage';

const Dashboard: React.FC = () => {
  const { recordings, isLoading, loadRecordingsFromStorage } = useStore();
  const navigate = useNavigate();

  // Ensure recordings are loaded on mount
  useEffect(() => {
    loadRecordingsFromStorage();
  }, [loadRecordingsFromStorage]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };


  const handleRecordingClick = async (recordingId: string) => {
    // Load the full recording with blob before navigating
    const fullRecording = await loadRecording(recordingId);
    if (fullRecording) {
      navigate(`/playback/${recordingId}`);
    } else {
      alert('Recording not found or could not be loaded.');
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#101010',
        color: 'white',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="h6"
          component="h1"
          sx={{
            color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
            fontWeight: 300,
            fontSize: '12px',
          }}
        >
          My recordings
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
            fontSize: '12px',
          }}
        >
          {recordings.length} recordings
        </Typography>
      </Box>

      {/* Recordings List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          </Box>
        ) : recordings.length === 0 ? (
          <Fade in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Mic sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography
                variant="h6"
                sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}
                gutterBottom
              >
                No recordings yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Tap the record button to start your first recording
              </Typography>
            </Box>
          </Fade>
        ) : (
          <List sx={{ p: 0, gap: 0 }}>
            {recordings.map((recording, index) => (
              <Slide
                key={recording.id}
                direction="up"
                in
                timeout={300 + index * 100}
              >
                <ListItemButton
                  onClick={() => handleRecordingClick(recording.id)}
                  disabled={recording.status === 'transcribing'}
                  sx={{
                    border: 'none',
                    px: '16px',
                    py: '6px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: recording.status === 'transcribing' ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#E6E6E6', // 100% opacity
                          fontWeight: 300,
                          fontSize: '24px',
                          lineHeight: 1,
                          mb: '4px',
                        }}
                      >
                        {recording.fileName.replace('Recording - ', '').split(',')[0] || recording.fileName}
                      </Typography>
                    }
                    secondary={
                      <Box
                        component="span"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 0,
                        }}
                      >
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            color: '#E6E6E6', // 100% opacity
                            fontSize: '12px',
                          }}
                        >
                          {formatDuration(recording.duration)}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
                            fontSize: '12px',
                          }}
                        >
                          {formatRelativeTime(recording.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </Slide>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
