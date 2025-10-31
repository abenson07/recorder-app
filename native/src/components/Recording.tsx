import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { useRecorder } from '../hooks/useRecorder';
import { saveRecording } from '../lib/storageAdapter';
import { Audio } from 'expo-av';
import { Recording as RecordingType } from '../shared/store/types';
import Timestamp from './Timestamp';
import RecordingWaveform from './RecordingWaveform';
import { useRealtimeWaveform } from '../hooks/useRealtimeWaveform';

type RootStackParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Playback: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Recording: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addRecording, setIsRecording, setIsPaused } = useStore();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRecordBack = useCallback((data: { currentPosition: number }) => {
    // Store position for reference if needed
  }, []);

  const {
    isRecording,
    isPaused,
    recordTime,
    currentPosition,
    error,
    startRecorder,
    stopRecorder,
    pauseRecorder,
    resumeRecorder,
    resetRecorder,
    getFinalDuration,
    getRecording,
    isLoading,
  } = useRecorder(handleRecordBack);

  // Get recording reference for waveform
  // Pass isRecording separately so waveform knows when to clear vs pause
  const recording = getRecording();
  const waveformPeaks = useRealtimeWaveform(recording, isRecording, currentPosition);

  // Update global recording state
  useEffect(() => {
    setIsRecording(isRecording);
  }, [isRecording, setIsRecording]);

  // Update global paused state
  useEffect(() => {
    setIsPaused(isPaused);
  }, [isPaused, setIsPaused]);

  // Reset paused state when recording stops
  useEffect(() => {
    if (!isRecording) {
      setIsPaused(false);
    }
    return () => {
      setIsPaused(false);
    };
  }, [isRecording, setIsPaused]);

  // Auto-start recording on mount
  useEffect(() => {
    handleStartRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Handle errors
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setShowError(true);
    }
  }, [error]);

  const handleStartRecording = async () => {
    try {
      await startRecorder();
    } catch (err) {
      // Error handling done via error state and snackbar
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecorder();
    } else {
      pauseRecorder();
    }
  };

  /**
   * Get duration from audio file (for native, we'll get it from the recording URI)
   */
  const getDurationFromRecording = async (audioUri: string): Promise<number> => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      let durationSeconds = 0;
      
      if (status.isLoaded && status.durationMillis) {
        durationSeconds = Math.floor(status.durationMillis / 1000); // Convert to seconds
      }
      
      await sound.unloadAsync();
      return durationSeconds;
    } catch (err) {
      console.error('Error getting duration from recording:', err);
      return 0;
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!isRecording) {
        return;
      }

      const recordedDurationMs = getFinalDuration();
      console.log('🔴 Stopping recording:', {
        durationMs: recordedDurationMs,
        durationSeconds: Math.floor(recordedDurationMs / 1000),
      });

      // Stop the recorder
      const audioUri = await stopRecorder();
      resetRecorder();

      if (!audioUri) {
        throw new Error('No recording data available');
      }

      // Calculate duration
      let duration = Math.floor(recordedDurationMs / 1000);
      
      // Fallback: Try to get duration from audio file if recorder duration is 0
      if (duration === 0) {
        console.log('⚠️ Recorder duration is 0, attempting file duration fallback...');
        const fileDuration = await getDurationFromRecording(audioUri);
        if (fileDuration > 0) {
          duration = fileDuration;
        }
      }
      
      console.log('🔴 Final duration calculation:', {
        recorderDurationMs: recordedDurationMs,
        recorderDurationSeconds: Math.floor(recordedDurationMs / 1000),
        finalDurationSeconds: duration,
      });

      // Create recording object
      const recordingId = `rec_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const fileName = `Recording - ${new Date().toLocaleString()}`;

      const recording: RecordingType = {
        id: recordingId,
        fileName,
        duration,
        status: 'done',
        createdAt,
        audioUrl: audioUri, // In native, this is a file URI
      };

      // Save to storage
      await saveRecording(recording);
      
      // Add to store
      addRecording(recording);

      // Navigate back to dashboard
      navigation.navigate('Dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save recording';
      setErrorMessage(errorMsg);
      setShowError(true);
      resetRecorder();
    }
  };

  const handleDeleteRecording = async () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            resetRecorder();
            navigation.navigate('Dashboard');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Section: Title and duration */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Recording</Text>
        <Timestamp milliseconds={currentPosition} />
      </View>

      {/* Middle Section: Waveform */}
      <View style={styles.waveformContainer}>
        <RecordingWaveform
          peaks={waveformPeaks}
          height={500}
          color="rgba(255, 255, 255, 0.5)"
          isRecording={isRecording && !isPaused}
        />
      </View>

      {/* Bottom Section: Large timestamp */}
      <View style={styles.bottomSection}>
        <Timestamp milliseconds={currentPosition} fontSize={48} />
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsSection}>
        <Button
          mode="contained"
          onPress={handlePauseRecording}
          disabled={!isRecording}
          style={[styles.controlButton, styles.pauseButton]}
          buttonColor="#1976d2"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          mode="contained"
          onPress={handleStopRecording}
          disabled={!isRecording || isLoading}
          style={[styles.controlButton, styles.stopButton]}
          buttonColor="#f44336"
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Stop & Save
        </Button>
        <Button
          mode="outlined"
          onPress={handleDeleteRecording}
          disabled={!isRecording || isLoading}
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
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setShowError(false),
        }}
      >
        {errorMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 20,
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
  pauseButton: {
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
});

export default Recording;

