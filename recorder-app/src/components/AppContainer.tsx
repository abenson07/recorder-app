import React from 'react';
import { Box, Container } from '@mui/material';

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 2,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          width: '500px',
          maxWidth: '500px',
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minHeight: '600px',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default AppContainer;
