import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Chip,
  Fade,
  Slide,
} from '@mui/material';
import {
  PlayArrow,
  Delete,
  Add,
  AccessTime,
  Mic,
} from '@mui/icons-material';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { recordings, deleteRecording } = useStore();
  const navigate = useNavigate();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'transcribing':
        return 'warning';
      case 'recording':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const handlePlayRecording = (recordingId: string) => {
    navigate(`/playback/${recordingId}`);
  };

  const handleDeleteRecording = (recordingId: string) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      deleteRecording(recordingId);
    }
  };

  const handleStartRecording = () => {
    navigate('/recording');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Voice Recordings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {recordings.length} recordings
        </Typography>
      </Box>

      {/* Recordings List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {recordings.length === 0 ? (
          <Fade in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Mic sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No recordings yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tap the record button to start your first recording
              </Typography>
            </Box>
          </Fade>
        ) : (
          <List sx={{ p: 0 }}>
            {recordings.map((recording, index) => (
              <Slide
                key={recording.id}
                direction="up"
                in
                timeout={300 + index * 100}
              >
                <ListItem
                  sx={{
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: '#f8f8f8',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" noWrap>
                          {recording.fileName}
                        </Typography>
                        <Chip
                          label={recording.status}
                          size="small"
                          color={getStatusColor(recording.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDuration(recording.duration)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {new Date(recording.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handlePlayRecording(recording.id)}
                      disabled={recording.status === 'transcribing'}
                    >
                      <PlayArrow />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteRecording(recording.id)}
                      sx={{ ml: 1 }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Slide>
            ))}
          </List>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="record"
        onClick={handleStartRecording}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Dashboard;
