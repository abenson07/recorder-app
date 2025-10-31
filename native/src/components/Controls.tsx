import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import Dial from './Dial';
import Light from './Light';

type RootStackParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Playback: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ControlsProps {}

const Controls: React.FC<ControlsProps> = () => {
  // Get current route from store instead of navigation hooks
  const { 
    isRecording, 
    isPaused, 
    isPlaying, 
    currentRoute,
    onRecordingPauseResume, 
    onRecordingStop, 
    onPlaybackPlayPause, 
    onPlaybackStop 
  } = useStore();
  
  // useNavigation() works here since we're inside NavigationContainer
  // (the issue was only with useNavigationState() and useRoute() which need a navigator)
  const navigation = useNavigation<NavigationProp>();
  const [wifiLightState, setWifiLightState] = useState<{ light: 'red' | 'green'; status: 'processing' | 'ready' }>({
    light: 'green',
    status: 'ready',
  });
  const prevIsRecordingRef = useRef(isRecording);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WiFi light blinking when recording stops
  useEffect(() => {
    if (prevIsRecordingRef.current && !isRecording) {
      setWifiLightState({ light: 'red', status: 'processing' });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setWifiLightState({ light: 'green', status: 'ready' });
        timeoutRef.current = null;
      }, 5000);
    } else if (!prevIsRecordingRef.current && isRecording) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setWifiLightState({ light: 'green', status: 'ready' });
    }
    
    prevIsRecordingRef.current = isRecording;
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isRecording]);

  const isDashboard = currentRoute === 'Dashboard';
  const isRecordingPage = currentRoute === 'Recording';
  const isPlayback = currentRoute === 'Playback';

  const handleRecordClick = () => {
    navigation.navigate('Recording');
  };

  const handleStopClick = () => {
    if (onRecordingStop || onPlaybackStop) {
      // Callbacks handle navigation
      if (onRecordingStop) onRecordingStop();
      if (onPlaybackStop) onPlaybackStop();
    } else {
      navigation.navigate('Dashboard');
    }
  };

  // Dashboard Controls: Record button, Dial, WiFi + Headphones
  if (isDashboard) {
    return (
      <View style={styles.container}>
        {/* Position 1: Record Button */}
        <TouchableOpacity
          style={[styles.button, styles.leftButton]}
          onPress={handleRecordClick}
          activeOpacity={0.8}
        >
          <View style={styles.recordDot} />
        </TouchableOpacity>

        {/* Position 2: Dial */}
        <View style={[styles.dialContainer, styles.middleButton]}>
          <Dial isActive={false} />
        </View>

        {/* Position 3 & 4: Additional Controls Area */}
        <View style={styles.rightColumn}>
          {/* Position 3: WiFi Icon */}
          <View style={[styles.button, styles.topRightButton]}>
            <MaterialIcons name="wifi" size={20} color="rgba(0, 0, 0, 0.6)" />
            <Light light={wifiLightState.light} status={wifiLightState.status} />
          </View>

          {/* Position 4: Headphones Icon */}
          <View style={[styles.button, styles.bottomRightButton]}>
            <MaterialIcons name="headset" size={20} color="rgba(0, 0, 0, 0.6)" />
          </View>
        </View>
      </View>
    );
  }

  // Recording Controls: Pause/Resume, Dial, Stop + Headphones
  if (isRecordingPage) {
    return (
      <View style={styles.container}>
        {/* Position 1: Pause/Play Dual Icons */}
        <TouchableOpacity
          style={[styles.button, styles.leftButton]}
          onPress={() => {
            if (isRecording && onRecordingPauseResume) {
              onRecordingPauseResume();
            }
          }}
          activeOpacity={0.8}
          disabled={!isRecording}
        >
          <View style={styles.dualIconContainer}>
            <MaterialIcons
              name="pause"
              size={20}
              color={isRecording && !isPaused ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'}
            />
            <Text style={styles.iconSeparator}>/</Text>
            <MaterialIcons
              name="play-arrow"
              size={20}
              color={isRecording && isPaused ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'}
            />
          </View>
        </TouchableOpacity>

        {/* Position 2: Dial */}
        <View style={[styles.dialContainer, styles.middleButton]}>
          <Dial isActive={isRecording} />
        </View>

        {/* Position 3 & 4: Additional Controls Area */}
        <View style={styles.rightColumn}>
          {/* Position 3: Stop/Save Button */}
          <TouchableOpacity
            style={[styles.button, styles.topRightButton]}
            onPress={() => {
              if (onRecordingStop) {
                onRecordingStop();
              } else {
                handleStopClick();
              }
            }}
            activeOpacity={0.8}
            disabled={!isRecording}
          >
            <MaterialIcons
              name="stop"
              size={20}
              color={isRecording ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'}
            />
          </TouchableOpacity>

          {/* Position 4: Headphones Icon */}
          <View style={[styles.button, styles.bottomRightButton]}>
            <MaterialIcons name="headset" size={20} color="rgba(0, 0, 0, 0.6)" />
          </View>
        </View>
      </View>
    );
  }

  // Playback Controls: Play/Pause, Dial, Text/Audio + Stop
  if (isPlayback) {
    return (
      <View style={styles.container}>
        {/* Position 1: Pause/Play Dual Icons */}
        <TouchableOpacity
          style={[styles.button, styles.leftButton]}
          onPress={() => {
            if (onPlaybackPlayPause) {
              onPlaybackPlayPause();
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.dualIconContainer}>
            <MaterialIcons name="pause" size={20} color="rgba(0, 0, 0, 0.6)" />
            <Text style={styles.iconSeparator}>/</Text>
            <MaterialIcons name="play-arrow" size={20} color="rgba(0, 0, 0, 0.6)" />
          </View>
        </TouchableOpacity>

        {/* Position 2: Dial */}
        <View style={[styles.dialContainer, styles.middleButton]}>
          <Dial isActive={isPlaying} />
        </View>

        {/* Position 3 & 4: Additional Controls Area */}
        <View style={styles.rightColumn}>
          {/* Position 3: Text/Audio Dual Icons */}
          <View style={[styles.button, styles.topRightButton]}>
            <View style={styles.dualIconContainer}>
              <MaterialIcons name="text-fields" size={20} color="rgba(0, 0, 0, 0.6)" />
              <Text style={styles.iconSeparator}>/</Text>
              <MaterialIcons name="volume-up" size={20} color="rgba(0, 0, 0, 0.6)" />
            </View>
          </View>

          {/* Position 4: Stop Icon */}
          <TouchableOpacity
            style={[styles.button, styles.bottomRightButton]}
            onPress={() => {
              if (onPlaybackStop) {
                onPlaybackStop();
              } else {
                handleStopClick();
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="stop" size={20} color="rgba(0, 0, 0, 0.6)" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Default/fallback
  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    height: 150,
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 2,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    flex: 1,
    backgroundColor: '#D1D1D1',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  leftButton: {
    borderRadius: 6,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  middleButton: {
    borderRadius: 2,
  },
  dialContainer: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#D1D1D1',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  topRightButton: {
    flex: 1,
    borderRadius: 2,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bottomRightButton: {
    flex: 1,
    borderRadius: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  recordDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f44336',
  },
  dualIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconSeparator: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

export default Controls;

