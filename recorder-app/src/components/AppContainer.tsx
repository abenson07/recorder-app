import React from 'react';
import { Box, Container } from '@mui/material';
import Speaker from './Speaker';
import Controls from './Controls';

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  // OnePlus 13 dimensions: 3168 x 1440 pixels
  // Aspect ratio: 3168/1440 = 2.2:1 (width:height)
  const onePlus13Width = 3168;
  const onePlus13Height = 1440;
  
  // For desktop: use a fixed width that matches phone proportions
  // Scale down proportionally - using ~475px width maintains good usability
  const desktopWidth = 475;
  const desktopHeight = Math.round((desktopWidth * onePlus13Height) / onePlus13Width); // ~216px
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          width: `${desktopWidth}px`,
          maxWidth: `${desktopWidth}px`,
          height: `calc(100vh - 32px)`, // Allow full height with padding
          maxHeight: `calc(100vh - 32px)`,
          backgroundColor: '#D1D1D1',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          // Maintain OnePlus 13 aspect ratio (2.2:1)
          aspectRatio: `${onePlus13Width} / ${onePlus13Height}`,
        }}
      >
        {/* Screen Section - Main content area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Important for flex children
          }}
        >
          {children}
        </Box>

        {/* Speaker Section - 40px fixed height */}
        <Speaker />

        {/* Controls Section - 150px fixed height */}
        <Controls />
      </Container>
    </Box>
  );
};

export default AppContainer;


