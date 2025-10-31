/**
 * Native-specific storage adapter that wraps AsyncStorage
 * Implements the storage functions interface expected by shared store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '../shared/store/types';
import type { StorageFunctions } from '../shared/store/useStore';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEY = 'recorder_app_recordings';
// Get document directory - FileSystem exports documentDirectory as a string constant
// Using type assertion since TypeScript definitions may vary
const docDir = (FileSystem as any).documentDirectory as string;
const AUDIO_DIR = docDir ? `${docDir}recordings/` : 'recordings/';

// Helper function for ensuring audio directory exists
const ensureAudioDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
};

export const nativeStorageAdapter: StorageFunctions = {
  saveRecordings: async (recordings: Recording[]): Promise<void> => {
    try {
      // Save metadata only (exclude audioBlob and audioUrl)
      const recordingsToSave = recordings.map((recording) => {
        const { audioBlob, audioUrl, ...record } = recording;
        return record;
      });
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordingsToSave));
    } catch (error) {
      console.error('Error saving recordings to AsyncStorage:', error);
      throw new Error('Failed to save recordings');
    }
  },
  
  loadRecordings: async (): Promise<Recording[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const recordings = JSON.parse(stored) as Omit<Recording, 'audioBlob' | 'audioUrl'>[];
      
      // Load audio file URIs for native
      const recordingsWithUris = await Promise.all(
        recordings.map(async (rec) => {
          const audioUri = `${AUDIO_DIR}${rec.id}.m4a`;
          const fileInfo = await FileSystem.getInfoAsync(audioUri);
          return {
            ...rec,
            audioUrl: fileInfo.exists ? audioUri : undefined,
            audioBlob: undefined, // Not used in native
          };
        })
      );

      return recordingsWithUris;
    } catch (error) {
      console.error('Error loading recordings from AsyncStorage:', error);
      return [];
    }
  },
  
  deleteRecording: async (id: string): Promise<void> => {
    try {
      const recordings = await nativeStorageAdapter.loadRecordings();
      const filtered = recordings.filter((r) => r.id !== id);
      await nativeStorageAdapter.saveRecordings(filtered);
      
      // Delete audio file
      const audioUri = `${AUDIO_DIR}${id}.m4a`;
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(audioUri);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  },
};

// Additional helper functions (not part of StorageFunctions interface)
// These will be used directly by components for single recording operations
export const saveRecording = async (recording: Recording): Promise<void> => {
  try {
    await ensureAudioDir();
    
    // If we have audio data, save it to file system
    // (In native, we'll save from recording URI, not blob)
    const recordings = await nativeStorageAdapter.loadRecordings();
    
    const { audioBlob, audioUrl, ...recordingMetadata } = recording;
    
    const existingIndex = recordings.findIndex((r) => r.id === recording.id);
    if (existingIndex >= 0) {
      recordings[existingIndex] = recordingMetadata;
    } else {
      recordings.unshift(recordingMetadata);
    }

    await nativeStorageAdapter.saveRecordings(recordings);
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

export const loadRecording = async (id: string): Promise<Recording | null> => {
  try {
    const recordings = await nativeStorageAdapter.loadRecordings();
    const recording = recordings.find((r) => r.id === id);
    
    if (!recording) {
      return null;
    }

    // Check if audio file exists
    const audioUri = `${AUDIO_DIR}${id}.m4a`;
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    
    return {
      ...recording,
      audioUrl: fileInfo.exists ? audioUri : undefined,
      audioBlob: undefined,
    };
  } catch (error) {
    console.error('Error loading recording:', error);
    return null;
  }
};

