import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DialProps {
  isActive: boolean;
}

const Dial: React.FC<DialProps> = ({ isActive }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.dial, isActive && styles.active]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dial: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
  active: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderColor: '#f44336',
  },
});

export default Dial;

