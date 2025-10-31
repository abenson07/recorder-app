import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { loadRecording } from '../lib/storageAdapter';
import { Recording } from '../shared/store/types';
import { MaterialIcons } from '@expo/vector-icons';

type RootStackParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Playback: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recordings, isLoading, loadRecordingsFromStorage } = useStore();

  // Ensure recordings are loaded on mount
  useEffect(() => {
    loadRecordingsFromStorage();
  }, [loadRecordingsFromStorage]);

  const formatDuration = (seconds: number): string => {
    // Validate input
    if (!isFinite(seconds) || seconds < 0) {
      return '00:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRecordingPress = async (recording: Recording) => {
    try {
      // Ensure full recording data is loaded (including audio file)
      const fullRecording = await loadRecording(recording.id);
      if (fullRecording && fullRecording.audioUrl) {
        navigation.navigate('Playback', { id: fullRecording.id });
      } else {
        Alert.alert(
          'Recording Not Found',
          'The audio file for this recording could not be found.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading recording:', error);
      Alert.alert(
        'Error',
        'Failed to load recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNewRecording = () => {
    navigation.navigate('Recording');
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => {
    // Extract date part from filename (remove "Recording - " prefix and everything after comma)
    const displayName = item.fileName.replace('Recording - ', '').split(',')[0] || item.fileName;
    
    return (
      <TouchableOpacity
        style={styles.recordingItem}
        onPress={() => handleRecordingPress(item)}
        activeOpacity={0.9}
      >
        <Text style={styles.recordingName} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.recordingMeta}>
          <Text style={styles.recordingDuration}>
            {formatDuration(item.duration || 0)}
          </Text>
          <Text style={styles.recordingTime}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My recordings</Text>
        <Text style={styles.headerCount}>{recordings.length} recordings</Text>
      </View>

      {/* Recordings List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.5)" />
          </View>
        ) : recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="mic" size={64} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyStateTitle}>No recordings yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap the record button to start your first recording
            </Text>
          </View>
        ) : (
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    fontSize: 12,
    color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
    fontWeight: '300',
    fontFamily: 'System', // Will need to add Ubuntu Sans font
  },
  headerCount: {
    fontSize: 12,
    color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
    fontWeight: '300',
    fontFamily: 'System',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 0,
  },
  recordingItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 0,
  },
  recordingName: {
    fontSize: 24,
    color: '#E6E6E6', // 100% opacity
    fontWeight: '300',
    fontFamily: 'System',
    lineHeight: 24,
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordingDuration: {
    fontSize: 12,
    color: '#E6E6E6', // 100% opacity
    fontWeight: '300',
    fontFamily: 'System',
  },
  recordingTime: {
    fontSize: 12,
    color: 'rgba(230, 230, 230, 0.5)', // #E6E6E6 at 50% opacity
    fontWeight: '300',
    fontFamily: 'System',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '300',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default Dashboard;

