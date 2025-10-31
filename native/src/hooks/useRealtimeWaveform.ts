import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

/**
 * Hook for extracting real-time waveform data from an Expo AV Recording
 * Returns an array of peak values (0-1) that updates in real-time
 * 
 * Note: Expo AV doesn't expose raw audio stream like web MediaStream.
 * For now, we generate synthetic peaks based on time and random variation.
 * Real-time waveform visualization would require:
 * - A native module that processes audio data
 * - Or integration with a library like react-native-audio-waveform
 * - Or using onRecordingStatusUpdate with metering data (if available)
 */
export const useRealtimeWaveform = (
  recording: Audio.Recording | null,
  isActive: boolean = true,
  durationMs: number = 0 // Optional: duration in milliseconds for synthetic peaks
): number[] => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const lastActiveStateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!recording) {
      // Only reset when recording is null (actually stopped, not just paused)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPeaks([]);
      startTimeRef.current = 0;
      pausedTimeRef.current = 0;
      totalPausedTimeRef.current = 0;
      lastActiveStateRef.current = false;
      return;
    }

    // Track when we transition from active to inactive (paused)
    if (lastActiveStateRef.current && !isActive) {
      // Just paused - record the pause start time
      pausedTimeRef.current = Date.now();
    }
    
    // Track when we transition from inactive to active (resumed)
    if (!lastActiveStateRef.current && isActive) {
      // Just resumed - add the paused duration to total
      if (pausedTimeRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pausedTimeRef.current;
        pausedTimeRef.current = 0;
      }
    }
    
    lastActiveStateRef.current = isActive;

    if (!isActive) {
      // When paused, stop generating peaks but preserve state
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Keep last peaks visible (don't clear)
      return;
    }

    // Initialize start time when recording first starts
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    // Generate synthetic peaks for visualization
    // In production, this should be replaced with real audio processing
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
      
      // Generate synthetic peaks with some variation
      const samples = 100; // Number of bars to show
      const newPeaks: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        // Create wave-like pattern with random variation
        const position = i / samples;
        const timeFactor = elapsed / 1000; // Seconds elapsed
        const base = Math.sin(position * Math.PI * 4 + timeFactor) * 0.5 + 0.5;
        const variation = (Math.random() - 0.5) * 0.4;
        const peak = Math.min(1, Math.max(0.1, base + variation));
        newPeaks.push(peak);
      }
      
      setPeaks(newPeaks);
    }, 100); // Update every 100ms

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = 0;
    };
  }, [recording, isActive, durationMs]);

  return peaks;
};

