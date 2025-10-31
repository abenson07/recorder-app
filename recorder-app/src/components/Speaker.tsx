import React from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '../store/useStore';

const Speaker: React.FC = () => {
  const { isRecording } = useStore();

  // Create array of dots for the waveform indicator
  const dots = Array.from({ length: 20 }, (_, i) => i);

  return (
    <Box
      sx={{
        height: '40px',
        width: '100%',
        backgroundColor: '#D1D1D1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* LD-7 Label */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
          fontSize: '0.875rem',
          fontWeight: 300,
        }}
      >
        LD-7
      </Typography>

      {/* Dots Indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {dots.map((dot, index) => {
          // Make the last dot flash orange when recording
          const isActiveDot = index === dots.length - 1 && isRecording;
          
          return (
            <Box
              key={dot}
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: isActiveDot ? '#ff9800' : '#000000',
                animation: isActiveDot ? 'flash 1s ease-in-out infinite' : 'none',
                transition: 'background-color 0.3s ease',
              }}
            />
          );
        })}
      </Box>

      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
};

export default Speaker;

