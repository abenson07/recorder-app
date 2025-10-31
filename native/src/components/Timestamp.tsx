import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface TimestampProps {
  milliseconds: number;
  fontSize?: number;
}

/**
 * Format milliseconds to HH:MM:SS format
 */
const formatTime = (ms: number): string => {
  // Handle invalid values
  if (!isFinite(ms) || ms < 0 || isNaN(ms)) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Timestamp: React.FC<TimestampProps> = ({ milliseconds, fontSize = 16 }) => {
  return (
    <Text style={[styles.timestamp, { fontSize }]}>
      {formatTime(milliseconds)}
    </Text>
  );
};

const styles = StyleSheet.create({
  timestamp: {
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default Timestamp;

