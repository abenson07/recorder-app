import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface RecordingWaveformProps {
  peaks: number[];
  height?: number;
  color?: string;
  isRecording?: boolean;
}

/**
 * Custom waveform component for recording that:
 * - Generates waveform at center and pushes left as new audio arrives
 * - Maintains consistent height regardless of width
 * - Renders in real-time from peaks array
 */
const RecordingWaveform: React.FC<RecordingWaveformProps> = ({
  peaks,
  height = 200,
  color = '#FFFFFF',
  isRecording = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksHistoryRef = useRef<number[][]>([]);
  const maxHistoryLength = 500; // Maximum number of peak arrays to store (grows left)

  // Update peaks history - new peaks appear at center, old ones shift left
  useEffect(() => {
    if (peaks.length > 0) {
      // Add new peaks to the front (will be rendered at center)
      peaksHistoryRef.current.unshift([...peaks]); // Create copy to avoid reference issues
      
      // Limit history size to prevent memory growth
      if (peaksHistoryRef.current.length > maxHistoryLength) {
        peaksHistoryRef.current = peaksHistoryRef.current.slice(0, maxHistoryLength);
      }

      // Debug: Log occasionally
      if (peaksHistoryRef.current.length % 50 === 0) {
        console.log('📊 RecordingWaveform peaks:', {
          peaksCount: peaks.length,
          historyLength: peaksHistoryRef.current.length,
          samplePeaks: peaks.slice(0, 5),
        });
      }
    } else if (!isRecording) {
      // Clear history when recording stops
      peaksHistoryRef.current = [];
    }
  }, [peaks, isRecording]);

  // Render waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, height);

    // Debug: Log canvas dimensions
    if (canvas.offsetWidth === 0 || height === 0) {
      console.warn('⚠️ RecordingWaveform canvas has zero dimensions:', {
        width: canvas.offsetWidth,
        height,
      });
    }

    const centerX = canvas.offsetWidth / 2;
    const frameWidth = 4; // Width of each time frame (each peaks array)
    const spacing = 1; // Space between frames
    const totalFrameWidth = frameWidth + spacing;

    // Calculate maximum number of frames we can show on each side
    const maxFramesPerSide = Math.floor(centerX / totalFrameWidth);

    // Render waveform - each peaks array is a time frame
    // Newest frame (index 0) is at center, older frames shift outward in both directions
    const historyToRender = peaksHistoryRef.current.slice(0, maxFramesPerSide);
    
    // Debug: Log rendering state
    if (historyToRender.length > 0) {
      console.log('🎨 Rendering waveform:', {
        framesToRender: historyToRender.length,
        canvasWidth: canvas.offsetWidth,
        centerX,
        maxFramesPerSide,
      });
    }

    historyToRender.forEach((peakArray, frameIndex) => {
      if (peakArray.length === 0) return;

      // Render on LEFT side: frame index 0 = center, higher index = further left
      const leftX = centerX - (frameIndex * totalFrameWidth);

      // Render on RIGHT side: mirrored/flipped version
      const rightX = centerX + (frameIndex * totalFrameWidth);

      // Render LEFT side (if visible)
      if (leftX + frameWidth >= 0 && leftX < centerX) {
        const barsPerFrame = Math.min(peakArray.length, 10); // Limit to 10 bars per frame
        const barSpacing = frameWidth / barsPerFrame;
        
        peakArray.slice(0, barsPerFrame).forEach((peak, barIndex) => {
          const barX = leftX + (barIndex * barSpacing);
          const barWidth = Math.max(1, barSpacing - 1);
          const barHeight = Math.max(2, peak * height * 0.8); // Scale to 80% of canvas height
          const y = (height - barHeight) / 2; // Center vertically

          ctx.fillStyle = color;
          ctx.fillRect(barX, y, barWidth, barHeight);
        });
      }

      // Render RIGHT side (mirrored/flipped horizontally) - if visible
      if (rightX >= centerX && rightX < canvas.offsetWidth) {
        const barsPerFrame = Math.min(peakArray.length, 10); // Limit to 10 bars per frame
        const barSpacing = frameWidth / barsPerFrame;
        
        // Flip the array and render from right to left
        [...peakArray].reverse().slice(0, barsPerFrame).forEach((peak, barIndex) => {
          // Calculate position from the right edge of the frame, going left
          const barX = rightX + frameWidth - ((barIndex + 1) * barSpacing);
          const barWidth = Math.max(1, barSpacing - 1);
          const barHeight = Math.max(2, peak * height * 0.8); // Scale to 80% of canvas height
          const y = (height - barHeight) / 2; // Center vertically

          ctx.fillStyle = color;
          ctx.fillRect(barX, y, barWidth, barHeight);
        });
      }
    });

    // Center line removed as requested
  }, [peaks, height, color]);

  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: height,
          display: 'block',
        }}
      />
    </Box>
  );
};

export default RecordingWaveform;

