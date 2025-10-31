/**
 * Platform-agnostic storage abstraction
 * Provides a unified API for localStorage (web) and AsyncStorage (native)
 */

export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Get platform-appropriate storage implementation
 */
export const getStorage = async (): Promise<Storage> => {
  const platform = typeof window !== 'undefined' && window.navigator?.product === 'ReactNative'
    ? 'native'
    : 'web';

  if (platform === 'native') {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return {
      getItem: async (key: string) => await AsyncStorage.getItem(key),
      setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
      removeItem: async (key: string) => await AsyncStorage.removeItem(key),
    };
  } else {
    // Web platform - use localStorage
    return {
      getItem: async (key: string) => {
        return localStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        localStorage.removeItem(key);
      },
    };
  }
};

