import React from 'react';
import { Box, Typography } from '@mui/material';

const Speaker: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#D1D1D1',
        display: 'flex',
        alignItems: 'center',
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
    </Box>
  );
};

export default Speaker;

