/**
 * Generate peaks array from audio file for waveform visualization
 * Uses Web Audio API to decode audio and extract amplitude data
 */

/**
 * Generate peaks array from audio URL
 * @param audioUrl - URL to audio file (blob URL or regular URL)
 * @param samples - Number of peaks to generate (default: 200)
 * @returns Promise resolving to normalized peaks array (0-1 range)
 */
export const generatePeaksFromAudio = async (
  audioUrl: string,
  samples: number = 200
): Promise<number[]> => {
  try {
    console.log('🎵 Generating peaks from audio:', {
      audioUrl: audioUrl.substring(0, 50) + '...',
      samples,
    });

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Fetch and decode audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('✅ Audio decoded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    });

    // Get raw audio data from first channel
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const peaks: number[] = [];

    // Extract peaks - take absolute maximum in each block
    for (let i = 0; i < samples; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, rawData.length);

      for (let j = start; j < end; j++) {
        const abs = Math.abs(rawData[j]);
        if (abs > max) {
          max = abs;
        }
      }

      peaks.push(max);
    }

    // Normalize peaks to 0-1 range
    const maxPeak = Math.max(...peaks);
    const normalizedPeaks = maxPeak > 0 
      ? peaks.map(peak => peak / maxPeak)
      : peaks.map(() => 0.1); // If all zeros, return array of small values for visibility

    console.log('✅ Peaks generated:', {
      peakCount: normalizedPeaks.length,
      maxPeak: maxPeak,
      samplePeaks: normalizedPeaks.slice(0, 5),
    });

    return normalizedPeaks;

  } catch (error) {
    console.error('❌ Error generating peaks from audio:', error);
    // Return empty array on error
    return new Array(samples).fill(0);
  }
};

/**
 * Generate peaks array with higher resolution for longer recordings
 * Automatically adjusts sample count based on duration
 * @param audioUrl - URL to audio file
 * @param durationSeconds - Duration of audio in seconds
 * @returns Promise resolving to normalized peaks array
 */
export const generatePeaksForDuration = async (
  audioUrl: string,
  durationSeconds: number
): Promise<number[]> => {
  // Calculate appropriate sample count based on duration
  // Aim for ~1 sample per second for short recordings, up to 400 samples max
  const samples = Math.min(Math.max(Math.floor(durationSeconds), 50), 400);
  return generatePeaksFromAudio(audioUrl, samples);
};

