import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioVisualizerState {
  audioLevel: number;
  waveformData: number[];
  isAnalyzing: boolean;
}

export const useAudioVisualizer = (
  stream: MediaStream | null,
  isRecording: boolean,
  isPaused: boolean
): AudioVisualizerState => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average audio level
    const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
    const normalizedLevel = (average / 255) * 100;
    
    setAudioLevel(normalizedLevel);

    // Add to waveform data (keep last 50 points)
    setWaveformData(prev => {
      const newData = [...prev.slice(-49), normalizedLevel];
      return newData;
    });

    if (isRecording && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (stream && isRecording) {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        // Create data array
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        // Connect audio source to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        setIsAnalyzing(true);
        analyzeAudio();

      } catch (error) {
        console.error('Error setting up audio visualization:', error);
        setIsAnalyzing(false);
      }
    } else {
      // Clean up
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      analyserRef.current = null;
      dataArrayRef.current = null;
      setIsAnalyzing(false);
      setAudioLevel(0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording, analyzeAudio]);

  // Reset waveform data when recording stops
  useEffect(() => {
    if (!isRecording) {
      setWaveformData([]);
      setAudioLevel(0);
    }
  }, [isRecording]);

  return {
    audioLevel,
    waveformData,
    isAnalyzing,
  };
};
