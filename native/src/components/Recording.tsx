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
  const { addRecording, setIsRecording, setIsPaused, setRecordingCallbacks, clearCallbacks } = useStore();
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

  // Register callbacks with store for Controls component
  useEffect(() => {
    setRecordingCallbacks({
      onPauseResume: handlePauseRecording,
      onStop: handleStopRecording,
    });
    
    return () => {
      clearCallbacks();
    };
  }, [setRecordingCallbacks, clearCallbacks, handlePauseRecording, handleStopRecording]);

  // Auto-start recording on mount
  useEffect(() => {
    const start = async () => {
      try {
        await handleStartRecording();
      } catch (err) {
        // Error already handled by useRecorder hook and error state
        // If permission denied, navigate back after showing error
        if (err instanceof Error && err.message.includes('permission')) {
          setTimeout(() => {
            navigation.navigate('Dashboard');
          }, 3000);
        }
      }
    };
    start();
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

  const handlePauseRecording = useCallback(() => {
    if (isPaused) {
      resumeRecorder();
    } else {
      pauseRecorder();
    }
  }, [isPaused, resumeRecorder, pauseRecorder]);

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

  const handleStopRecording = useCallback(async () => {
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
  }, [isRecording, getFinalDuration, stopRecorder, resetRecorder, addRecording, navigation, saveRecording]);

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
      {/* Top Section: Header with red dot + "New recording" and "32kbps" */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.redDot} />
          <Text style={styles.headerText}>New recording</Text>
        </View>
        <Text style={styles.headerRight}>32kbps</Text>
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

      {/* Controls are handled by Controls component at bottom */}

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
    borderRadius: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
  headerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'System',
  },
  headerRight: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'System',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101010',
    overflow: 'hidden',
  },
  bottomSection: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 24,
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

