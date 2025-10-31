import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

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
 * - Supports click-to-seek functionality
 */
const PlaybackWaveform: React.FC<PlaybackWaveformProps> = ({
  peaks,
  height = 200,
  currentPosition,
  duration,
  color = 'rgba(255, 255, 255, 0.5)', // 50% opacity for unplayed
  progressColor = '#FFFFFF', // Full opacity for played
  onClick,
  barWidth = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate progress percentage (0 to 1)
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentPosition / duration)) : 0;

  // Render waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!canvas || !backgroundCanvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    const backgroundCtx = backgroundCanvas.getContext('2d');
    if (!ctx || !backgroundCtx) return;

    const containerWidth = containerRef.current.clientWidth;
    
    // Set canvas sizes with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = containerWidth * dpr;
    const canvasHeight = height * dpr;

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    backgroundCanvas.width = canvasWidth;
    backgroundCanvas.height = canvasHeight;

    // Scale context for high DPI displays
    ctx.scale(dpr, dpr);
    backgroundCtx.scale(dpr, dpr);

    // Clear both canvases
    ctx.clearRect(0, 0, containerWidth, height);
    backgroundCtx.clearRect(0, 0, containerWidth, height);

    if (peaks.length === 0) {
      return;
    }

    const spacing = 1; // Space between bars
    const totalBarWidth = barWidth + spacing;
    const maxBars = Math.floor(containerWidth / totalBarWidth);
    const sampleInterval = Math.max(1, Math.floor(peaks.length / maxBars));

    // Calculate progress width in pixels
    const progressWidth = containerWidth * progress;

    // Render background (unplayed portion) - full width with reduced opacity
    backgroundCtx.fillStyle = color;
    for (let i = 0; i < maxBars; i++) {
      const peakIndex = Math.min(i * sampleInterval, peaks.length - 1);
      const peak = peaks[peakIndex];
      const x = i * totalBarWidth;

      if (x < containerWidth) {
        const barHeight = Math.max(2, peak * height * 0.7); // Scale to 70% of canvas height
        const y = (height - barHeight) / 2; // Center vertically

        backgroundCtx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // Render progress (played portion) - only the portion that's been played, with full opacity
    ctx.fillStyle = progressColor;
    const progressBars = Math.floor(progressWidth / totalBarWidth);

    for (let i = 0; i < progressBars; i++) {
      const peakIndex = Math.min(i * sampleInterval, peaks.length - 1);
      const peak = peaks[peakIndex];
      const x = i * totalBarWidth;

      if (x < progressWidth) {
        const barHeight = Math.max(2, peak * height * 0.7); // Scale to 70% of canvas height
        const y = (height - barHeight) / 2; // Center vertically

        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }, [peaks, height, currentPosition, duration, progress, color, progressColor, barWidth]);

  // Handle click to seek
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const containerWidth = containerRef.current.clientWidth;
      const percentage = Math.max(0, Math.min(1, clickX / containerWidth));
      const seconds = percentage * (duration / 1000); // Convert to seconds

      onClick(seconds);
    },
    [onClick, duration]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render on resize
      if (containerRef.current) {
        // Force re-render by updating canvas
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box
      ref={containerRef}
      onClick={handleClick}
      sx={{
        width: '100%',
        height: height,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Background canvas (unplayed portion) */}
      <canvas
        ref={backgroundCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: height,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      {/* Progress canvas (played portion) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: height,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default PlaybackWaveform;

