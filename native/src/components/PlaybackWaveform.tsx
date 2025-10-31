import React from 'react';
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface PlaybackWaveformProps {
  peaks: number[];
  height?: number;
  currentPosition: number; // Current position in milliseconds
  duration: number; // Total duration in milliseconds
  color?: string; // Color for unplayed portion
  progressColor?: string; // Color for played portion
  onClick?: (seconds: number) => void; // Callback when clicked, receives position in seconds
  barWidth?: number; // Width of each bar
}

/**
 * Custom waveform component for playback that:
 * - Displays full-width waveform
 * - Shows unplayed portion with reduced opacity
 * - Shows played portion with full opacity
 * - Supports tap-to-seek functionality
 */
const PlaybackWaveform: React.FC<PlaybackWaveformProps> = ({
  peaks,
  height = 300,
  currentPosition,
  duration,
  color = 'rgba(255, 255, 255, 0.5)', // 50% opacity for unplayed
  progressColor = '#FFFFFF', // Full opacity for played
  onClick,
  barWidth = 2,
}) => {
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Calculate progress percentage (0 to 1)
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentPosition / duration)) : 0;

  // Handle container layout
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  // Handle tap to seek
  const handlePress = (event: any) => {
    if (!onClick || containerWidth === 0 || duration === 0) return;

    const { locationX } = event.nativeEvent;
    const progressPercent = Math.max(0, Math.min(1, locationX / containerWidth));
    const seconds = (progressPercent * duration) / 1000;
    onClick(seconds);
  };

  if (peaks.length === 0 || containerWidth === 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={handleLayout}>
        <View style={styles.emptyContainer}>
          {/* Empty state - will show placeholder or nothing */}
        </View>
      </View>
    );
  }

  const spacing = 1; // Space between bars
  const totalBarWidth = barWidth + spacing;
  const maxBars = Math.floor(containerWidth / totalBarWidth);
  const sampleInterval = Math.max(1, Math.floor(peaks.length / maxBars));

  // Calculate progress width in pixels
  const progressWidth = containerWidth * progress;
  const progressBars = Math.floor(progressWidth / totalBarWidth);

  // Generate bars
  const bars: Array<{ x: number; height: number; isPlayed: boolean }> = [];
  for (let i = 0; i < maxBars; i++) {
    const peakIndex = Math.min(i * sampleInterval, peaks.length - 1);
    const peak = peaks[peakIndex];
    const x = i * totalBarWidth;

    if (x < containerWidth) {
      const barHeight = Math.max(2, peak * height * 0.7); // Scale to 70% of canvas height
      bars.push({
        x,
        height: barHeight,
        isPlayed: i < progressBars,
      });
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={[styles.container, { height }]}
      onLayout={handleLayout}
    >
      <Svg width={containerWidth} height={height} style={styles.svg}>
        {/* Render all bars (unplayed portion) with reduced opacity */}
        {bars.map((bar, index) => (
          <Rect
            key={`unplayed-${index}`}
            x={bar.x}
            y={(height - bar.height) / 2}
            width={barWidth}
            height={bar.height}
            fill={color}
          />
        ))}
        {/* Render played portion with full opacity (overlay) */}
        {bars.slice(0, progressBars).map((bar, index) => (
          <Rect
            key={`played-${index}`}
            x={bar.x}
            y={(height - bar.height) / 2}
            width={barWidth}
            height={bar.height}
            fill={progressColor}
          />
        ))}
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  emptyContainer: {
    flex: 1,
    width: '100%',
  },
});

export default PlaybackWaveform;

