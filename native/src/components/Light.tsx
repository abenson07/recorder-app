import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LightProps {
  light: 'red' | 'green';
  status: 'processing' | 'ready';
}

const Light: React.FC<LightProps> = ({ light, status }) => {
  const getLightColor = () => {
    if (light === 'red') {
      return status === 'processing' ? '#f44336' : 'rgba(244, 67, 54, 0.3)';
    }
    return status === 'processing' ? '#4caf50' : 'rgba(76, 175, 80, 0.3)';
  };

  const shouldPulse = status === 'processing';

  return (
    <View
      style={[
        styles.light,
        { backgroundColor: getLightColor() },
        shouldPulse && styles.pulsing,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  light: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulsing: {
    // For pulsing animation, we'll use opacity animation
    opacity: 1,
  },
});

export default Light;

