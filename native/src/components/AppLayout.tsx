import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Outlet } from '@react-navigation/native';
import Speaker from './Speaker';
import Controls from './Controls';

/**
 * AppLayout component that wraps all screens and provides
 * the Speaker and Controls components at the bottom.
 * This ensures Controls has access to NavigationContainer context.
 */
const AppLayout: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Screen Section - Main content area (matches web #191919 background) */}
      <View style={styles.screenContainer}>
        {/* Screens will be rendered here via navigation */}
      </View>

      {/* Speaker Section - 40px fixed height */}
      <View style={styles.speakerContainer}>
        <Speaker />
      </View>

      {/* Controls Section - 150px fixed height */}
      <Controls />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D1D1D1',
    padding: 8,
    gap: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#191919',
    borderRadius: 1,
    overflow: 'hidden',
  },
  speakerContainer: {
    height: 40,
    backgroundColor: '#D1D1D1',
    borderRadius: 1,
  },
});

export default AppLayout;

