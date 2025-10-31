import React from 'react';
import { Box } from '@mui/material';

interface LightProps {
  light: 'red' | 'green';
  status: 'processing' | 'ready';
}

const Light: React.FC<LightProps> = ({ light, status }) => {
  return (
    <Box
      sx={{
        width: '5px',
        height: '5px',
        borderRadius: '100%',
        backgroundColor: light === 'red' ? '#f44336' : '#4caf50',
        opacity: status === 'processing' ? undefined : 1,
        animation: status === 'processing' ? 'blink 1s infinite' : 'none',
        '@keyframes blink': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
      }}
    />
  );
};

export default Light;

