import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../store/useStore';
import Light from './Light';

const Speaker: React.FC = () => {
  const { isRecording } = useStore();

  // Generate circles for speaker grille (matching SVG pattern)
  // 3 rows, multiple columns
  const circles: { x: number; y: number }[] = [];
  const rows = 3;
  const cols = 20;
  const spacing = 8;
  const dotRadius = 2;
  const startX = 10;
  const startY = 10;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      circles.push({
        x: startX + col * spacing,
        y: startY + row * spacing,
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* LD-7 Label */}
      <Text style={styles.label}>LD-7</Text>

      {/* Speaker Grille SVG */}
      <View style={styles.grilleContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 276 36" preserveAspectRatio="none">
          {circles.map((circle, index) => (
            <Circle
              key={index}
              cx={circle.x}
              cy={circle.y}
              r={dotRadius}
              fill="#101010"
            />
          ))}
        </Svg>
      </View>

      {/* Recording Light */}
      <View style={styles.lightContainer}>
        <Light light="red" status={isRecording ? 'processing' : 'ready'} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    backgroundColor: '#D1D1D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '300',
    fontFamily: 'System',
  },
  grilleContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  lightContainer: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Speaker;

