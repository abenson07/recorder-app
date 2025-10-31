import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface RecordingWaveformProps {
  peaks: number[];
  height?: number;
  color?: string;
  isRecording?: boolean;
}

/**
 * Custom waveform component for recording that:
 * - Generates waveform at center and flows outward in both directions
 * - Maintains consistent height regardless of width
 * - Renders in real-time from peaks array
 * - Mirrors horizontally (flows outward from center)
 */
const RecordingWaveform: React.FC<RecordingWaveformProps> = ({
  peaks,
  height = 500,
  color = 'rgba(255, 255, 255, 0.5)', // 50% opacity
  isRecording = true,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const peaksHistoryRef = useRef<number[][]>([]);
  const maxHistoryLength = 500; // Maximum number of peak arrays to store

  // Update peaks history - new peaks appear at center, old ones shift outward
  useEffect(() => {
    if (peaks.length > 0 && isRecording) {
      // Only add new peaks when actively recording (not paused)
      // Add new peaks to the front (will be rendered at center)
      peaksHistoryRef.current.unshift([...peaks]); // Create copy to avoid reference issues
      
      // Limit history size to prevent memory growth
      if (peaksHistoryRef.current.length > maxHistoryLength) {
        peaksHistoryRef.current = peaksHistoryRef.current.slice(0, maxHistoryLength);
      }
    }
    // Don't clear history on pause - only clear when component unmounts or recording actually stops
  }, [peaks, isRecording]);

  // Handle container layout
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  if (containerWidth === 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={handleLayout}>
        {/* Empty state while measuring */}
      </View>
    );
  }

  const centerX = containerWidth / 2;
  const frameWidth = 4; // Width of each time frame (each peaks array)
  const spacing = 1; // Space between frames
  const totalFrameWidth = frameWidth + spacing;

  // Calculate maximum number of frames we can show on each side
  const maxFramesPerSide = Math.floor(centerX / totalFrameWidth);

  // Get history to render (limit to what fits on screen)
  const historyToRender = peaksHistoryRef.current.slice(0, maxFramesPerSide);

  // Generate bars for rendering
  const bars: Array<{
    leftX: number;
    rightX: number;
    height: number;
    peakArray: number[];
  }> = [];

  historyToRender.forEach((peakArray, frameIndex) => {
    if (peakArray.length === 0) return;

    // LEFT side - flows left from center
    const leftX = centerX - (frameIndex * totalFrameWidth) - frameWidth;
    
    // RIGHT side - flows right from center (mirrored)
    const rightX = centerX + (frameIndex * totalFrameWidth);

    if (leftX + frameWidth >= 0 || rightX < containerWidth) {
      bars.push({
        leftX,
        rightX,
        height: 0, // Will be calculated per bar
        peakArray,
      });
    }
  });

  return (
    <View style={[styles.container, { height }]} onLayout={handleLayout}>
      <Svg width={containerWidth} height={height} style={styles.svg}>
        {bars.map((bar, barIndex) => {
          const barsPerFrame = Math.min(bar.peakArray.length, 10);
          const barSpacing = frameWidth / barsPerFrame;

          return (
            <React.Fragment key={`frame-${barIndex}`}>
              {/* LEFT side bars */}
              {bar.leftX + frameWidth >= 0 && bar.leftX < centerX && (
                <>
                  {bar.peakArray.slice(0, barsPerFrame).map((peak, peakIndex) => {
                    const barX = bar.leftX + (peakIndex * barSpacing);
                    const barWidth = Math.max(1, barSpacing - 1);
                    const barHeight = Math.max(2, peak * height * 0.8);
                    const y = (height - barHeight) / 2;

                    return (
                      <Rect
                        key={`left-${barIndex}-${peakIndex}`}
                        x={barX}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                      />
                    );
                  })}
                </>
              )}

              {/* RIGHT side bars (mirrored/flipped horizontally) */}
              {bar.rightX >= centerX && bar.rightX < containerWidth && (
                <>
                  {[...bar.peakArray].reverse().slice(0, barsPerFrame).map((peak, peakIndex) => {
                    const barX = bar.rightX + frameWidth - ((peakIndex + 1) * barSpacing);
                    const barWidth = Math.max(1, barSpacing - 1);
                    const barHeight = Math.max(2, peak * height * 0.8);
                    const y = (height - barHeight) / 2;

                    return (
                      <Rect
                        key={`right-${barIndex}-${peakIndex}`}
                        x={barX}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                      />
                    );
                  })}
                </>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
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
});

export default RecordingWaveform;

