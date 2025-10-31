/**
 * Platform detection utilities
 */

export type Platform = 'web' | 'native';

/**
 * Detect the current platform
 */
export const getPlatform = (): Platform => {
  if (typeof window !== 'undefined' && window.navigator) {
    // Check if we're in a React Native environment
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'native';
    }
    return 'web';
  }
  // Default to native for React Native contexts
  return 'native';
};

/**
 * Check if running on web platform
 */
export const isWeb = (): boolean => getPlatform() === 'web';

/**
 * Check if running on native platform
 */
export const isNative = (): boolean => getPlatform() === 'native';

