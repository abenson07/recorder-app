import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { loadRecording } from '../lib/storageAdapter';
import { usePlayer } from '../hooks/usePlayer';
import { Recording } from '../shared/store/types';
import Timestamp from './Timestamp';
import PlaybackWaveform from './PlaybackWaveform';
import { generatePeaksForDuration } from '../lib/audioUtils';

type RootStackParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Playback: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PlaybackRouteProp = RouteProp<RootStackParamList, 'Playback'>;

const Playback: React.FC = () => {
  const route = useRoute<PlaybackRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { id } = route.params;
  const { deleteRecording, setIsPlaying, updateRecording, setPlaybackCallbacks, clearCallbacks } = useStore();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [durationUpdated, setDurationUpdated] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [peaks, setPeaks] = useState<number[]>([]);
  const [peaksLoading, setPeaksLoading] = useState(false);

  const handlePlayBack = ({ currentPosition, duration }: { currentPosition: number; duration: number }) => {
    // Called during playback to update UI
  };

  const handlePlaybackEnd = () => {
    // Playback finished
  };

  // Calculate maxDurationMs for player
  const maxDurationMsForPlayer = recording && recording.duration && recording.duration > 0 && isFinite(recording.duration)
    ? recording.duration * 1000
    : undefined;

  const {
    isPlaying,
    playTime,
    duration: playerDuration,
    currentPosition,
    durationMs,
    error: playerError,
    startPlayer,
    stopPlayer,
    pausePlayer,
    resumePlayer,
    seekTo,
    isLoading: playerLoading,
  } = usePlayer(handlePlayBack, handlePlaybackEnd, maxDurationMsForPlayer);

  // Register callbacks with store for Controls component
  useEffect(() => {
    setPlaybackCallbacks({
      onPlayPause: handlePlayPause,
      onStop: handleStop,
    });
    
    return () => {
      clearCallbacks();
    };
  }, [setPlaybackCallbacks, clearCallbacks, handlePlayPause, handleStop]);

  // Load recording on mount
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setIsLoading(true);
      setDurationUpdated(false);
      try {
        const loaded = await loadRecording(id);
        if (loaded) {
          console.log('📹 Recording loaded:', {
            id: loaded.id,
            fileName: loaded.fileName,
            storedDuration: loaded.duration,
            storedDurationMs: loaded.duration * 1000,
            audioUrl: loaded.audioUrl ? 'present' : 'missing',
          });
          setRecording(loaded);

          // Generate peaks for waveform visualization
          if (loaded.audioUrl && loaded.duration > 0) {
            setPeaksLoading(true);
            try {
              const generatedPeaks = await generatePeaksForDuration(
                loaded.audioUrl,
                loaded.duration
              );
              setPeaks(generatedPeaks);
              console.log('📊 Generated peaks for waveform:', {
                peakCount: generatedPeaks.length,
                durationSeconds: loaded.duration,
              });
            } catch (error) {
              console.error('Error generating peaks:', error);
              setPeaks([]);
            } finally {
              setPeaksLoading(false);
            }
          }
        } else {
          setErrorMessage('Recording not found');
          setShowError(true);
          // Navigate back after a delay if recording not found
          setTimeout(() => {
            navigation.navigate('Dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error loading recording:', error);
        setErrorMessage('Failed to load recording');
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  // Sync playback state with global store
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Monitor playback progress to update stored duration if it was missing
  useEffect(() => {
    if (!durationUpdated && isPlaying && recording && recording.duration === 0 && durationMs > 1000) {
      console.log('🔍 Detected playback duration for recording with missing duration:', {
        recordingId: recording.id,
        detectedDurationMs: durationMs,
        detectedDurationSeconds: Math.floor(durationMs / 1000),
      });
      
      updateRecording(recording.id, {
        duration: Math.floor(durationMs / 1000),
      });
      
      setRecording((prev) => {
        if (prev) {
          return { ...prev, duration: Math.floor(durationMs / 1000) };
        }
        return prev;
      });
      setDurationUpdated(true);
      console.log('✅ Updated recording duration in storage');
    }
  }, [isPlaying, recording, durationMs, durationUpdated, updateRecording]);

  const formatRecordedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes}${ampm}`;
  };

  const handlePlayPause = useCallback(async () => {
    if (!recording?.audioUrl) return;

    if (isPlaying) {
      pausePlayer();
    } else {
      try {
        await startPlayer(recording.audioUrl);
      } catch (error) {
        console.error('Failed to start playback:', error);
        setErrorMessage('Failed to start playback. Please try again.');
        setShowError(true);
      }
    }
  }, [recording?.audioUrl, isPlaying, pausePlayer, startPlayer]);

  const handleStop = async () => {
    await stopPlayer();
    navigation.navigate('Dashboard');
  };

  const handleDelete = async () => {
    if (!recording) return;

    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(recording.id);
              navigation.navigate('Dashboard');
            } catch (error) {
              setErrorMessage('Failed to delete recording');
              setShowError(true);
            }
          },
        },
      ]
    );
  };

  // Helper function to format time (must be defined before use)
  const formatTime = (milliseconds: number): string => {
    if (!isFinite(milliseconds) || milliseconds < 0) {
      return '00:00:00';
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Safely calculate durations with fallbacks
  const storedDurationMs = recording?.duration && recording.duration > 0 && isFinite(recording.duration)
    ? recording.duration * 1000
    : 0;

  const finalDurationMs = storedDurationMs > 0 ? storedDurationMs : (durationMs > 0 ? durationMs : 0);
  const finalDurationDisplay = finalDurationMs > 0 ? formatTime(finalDurationMs) : '00:00:00';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!recording) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>The requested recording could not be found.</Text>
      </View>
    );
  }

  const currentPlayTime = formatTime(currentPosition || 0);
  const progressPercentage = finalDurationMs > 0 ? Math.min((currentPosition / finalDurationMs) * 100, 100) : 0;
  
  // Extract date part from filename
  const displayName = recording.fileName.replace('Recording - ', '').split(',')[0] || recording.fileName;

  return (
    <View style={styles.container}>
      {/* Top Section: Header with play icon + recording name and duration */}
      <View style={styles.header}>
        {/* Left: Play icon + Recording name */}
        <View style={styles.headerLeft}>
          <MaterialIcons name="play-arrow" size={20} color="#E6E6E6" />
          <Text style={styles.headerName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* Right: Recording duration */}
        <Text style={styles.headerDuration}>
          {finalDurationDisplay}
        </Text>
      </View>

      {/* Middle Section: Waveform area (fills remaining space) */}
      <View style={styles.waveformContainer}>
        {peaksLoading ? (
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.5)" />
        ) : peaks.length > 0 && finalDurationMs > 0 ? (
          <PlaybackWaveform
            peaks={peaks}
            height={300}
            currentPosition={currentPosition}
            duration={finalDurationMs}
            color="rgba(255, 255, 255, 0.5)"
            progressColor="#FFFFFF"
            barWidth={2}
            onClick={(seconds) => {
              seekTo(seconds * 1000);
            }}
          />
        ) : (
          <Text style={styles.placeholderText}>
            {peaks.length === 0 ? 'No waveform data' : `Duration: ${finalDurationMs}ms`}
          </Text>
        )}
      </View>

      {/* Bottom Section: Recorded date, timestamp, and progress bar */}
      <View style={styles.bottomSection}>
        {/* Recorded date/time */}
        <Text style={styles.recordedDate}>
          Recorded {formatRecordedDate(recording.createdAt)}
        </Text>

        {/* Large timestamp */}
        <View style={styles.timestampContainer}>
          <Timestamp milliseconds={currentPosition} fontSize={48} />
        </View>

        {/* Playback progress bar */}
        <View style={styles.progressBarContainer}>
          {/* Base line (full width) */}
          <View style={styles.progressBarBase} />
          {/* Progress line (on top) */}
          <View style={[styles.progressBarProgress, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Controls are handled by Controls component at bottom */}

      {/* Error Snackbar */}
      <Snackbar
        visible={showError || !!playerError}
        onDismiss={() => {
          setShowError(false);
        }}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => {
            setShowError(false);
          },
        }}
      >
        {playerError || errorMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    flexDirection: 'column',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerName: {
    color: '#E6E6E6',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    flex: 1,
  },
  headerDuration: {
    color: '#E6E6E6',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
  },
  waveformContainer: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: 'System',
  },
  bottomSection: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  recordedDate: {
    fontSize: 12,
    color: 'rgba(230, 230, 230, 0.5)',
    marginBottom: 8,
    fontFamily: 'System',
  },
  timestampContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
  },
  progressBarBase: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(230, 230, 230, 0.3)',
  },
  progressBarProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default Playback;

