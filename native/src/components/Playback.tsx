import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  const { deleteRecording, setIsPlaying, updateRecording } = useStore();
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

  const handlePlayPause = async () => {
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
  };

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Section: Title and duration */}
      <View style={styles.topSection}>
        <Text style={styles.title} numberOfLines={2}>
          {recording.fileName.replace('Recording - ', '')}
        </Text>
        <Timestamp milliseconds={finalDurationMs} />
      </View>

      {/* Date */}
      <Text style={styles.dateText}>{formatRecordedDate(recording.createdAt)}</Text>

      {/* Waveform */}
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
              // Seek to clicked position
              seekTo(seconds * 1000); // Convert to milliseconds
            }}
          />
        ) : (
          <>
            <Text style={styles.placeholderText}>No waveform data</Text>
            <Text style={styles.playTime}>{playTime}</Text>
          </>
        )}
      </View>

      {/* Bottom Section: Large timestamp */}
      <View style={styles.bottomSection}>
        <Timestamp milliseconds={currentPosition} fontSize={48} />
        <Text style={styles.separator}>/</Text>
        <Timestamp milliseconds={finalDurationMs} fontSize={48} />
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsSection}>
        <Button
          mode="contained"
          onPress={handlePlayPause}
          disabled={!recording.audioUrl || playerLoading}
          style={[styles.controlButton, styles.playButton]}
          buttonColor="#1976d2"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button
          mode="contained"
          onPress={handleStop}
          disabled={playerLoading}
          style={[styles.controlButton, styles.stopButton]}
          buttonColor="#f44336"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Stop
        </Button>
        <Button
          mode="outlined"
          onPress={handleDelete}
          disabled={playerLoading}
          style={[styles.controlButton, styles.deleteButton]}
          textColor="rgba(255, 255, 255, 0.7)"
          contentStyle={styles.buttonContent}
          labelStyle={styles.deleteButtonLabel}
        >
          Delete
        </Button>
      </View>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginRight: 12,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 32,
    fontWeight: '300',
  },
  waveformContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    marginBottom: 20,
  },
  playTime: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  separator: {
    fontSize: 48,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 16,
    fontWeight: '300',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  controlButton: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  playButton: {
    // backgroundColor handled by buttonColor prop
  },
  stopButton: {
    // backgroundColor handled by buttonColor prop
  },
  deleteButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default Playback;

