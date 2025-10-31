import React from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '../store/useStore';
import Light from './Light';

const Speaker: React.FC = () => {
  const { isRecording } = useStore();

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#D1D1D1',
        display: 'flex',
        alignItems: 'center',
        px: 2,
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

      {/* Speaker Grille SVG */}
      <Box
        component="img"
        src="/speaker-grille.svg"
        alt="Speaker grille"
        sx={{
          flex: 1,
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'left',
          ml: 2,
        }}
      />

      {/* Recording Light - same width as LD-7, on the right side */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'fit-content',
          ml: 2,
        }}
      >
        <Light light="red" status={isRecording ? 'processing' : 'ready'} />
      </Box>
    </Box>
  );
};

export default Speaker;

