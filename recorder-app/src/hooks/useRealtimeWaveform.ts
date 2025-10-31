import { useState, useEffect, useRef } from 'react';

/**
 * Hook for extracting real-time waveform data from a MediaStream
 * Returns an array of peak values (0-1) that updates in real-time
 */
export const useRealtimeWaveform = (
  stream: MediaStream | null,
  isActive: boolean = true
): number[] => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      // Clean up when stream is not available or inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setPeaks([]);
      return;
    }

    try {
      console.log('🎵 Setting up real-time waveform:', {
        hasStream: !!stream,
        streamActive: stream?.active,
        streamTracks: stream?.getTracks().length,
        isActive,
      });

      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Higher resolution for smoother waveform
      analyser.smoothingTimeConstant = 0.3; // Less smoothing for more responsive visualization
      analyserRef.current = analyser;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Initialize data array
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      console.log('✅ Real-time waveform setup complete');

      // Update waveform
      const updateWaveform = () => {
        if (!analyserRef.current || !dataArrayRef.current) {
          return;
        }

        // Get time domain data (waveform data)
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        // Extract peaks - downsample to reasonable number for visualization
        // We'll take samples from the data array
        const samples = 100; // Number of bars to show
        const sampleInterval = Math.floor(bufferLength / samples);
        const newPeaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          const index = i * sampleInterval;
          const value = dataArrayRef.current[index];
          // Normalize from 0-255 to 0-1, then center around 0.5 and scale
          const normalized = (value / 255 - 0.5) * 2; // Convert to -1 to 1 range
          const peak = Math.abs(normalized); // Absolute value for waveform visualization
          newPeaks.push(peak);
        }

        // Only update if we have meaningful data (check if peaks are above threshold)
        const maxPeak = Math.max(...newPeaks);
        if (maxPeak > 0.01 || newPeaks.length > 0) {
          setPeaks(newPeaks);
        }

        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      // Start updating
      updateWaveform();
    } catch (error) {
      console.error('❌ Error setting up real-time waveform:', error);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [stream, isActive]);

  return peaks;
};

