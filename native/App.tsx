import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from './src/store/useStore';
import DashboardScreen from './src/components/Dashboard';
import RecordingScreen from './src/components/Recording';
import PlaybackScreen from './src/components/Playback';
import Speaker from './src/components/Speaker';
import Controls from './src/components/Controls';

const Stack = createNativeStackNavigator();

export default function App() {
  const loadRecordings = useStore((state) => state.loadRecordingsFromStorage);

  // Load recordings on app start
  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const theme = {
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e',
    },
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <View style={styles.appContainer}>
            {/* Screen Section - Main content area (matches web #191919 background) */}
            <View style={styles.screenContainer}>
              <Stack.Navigator
                initialRouteName="Dashboard"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#101010',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: '300',
                  },
                }}
              >
                <Stack.Screen 
                  name="Dashboard" 
                  component={DashboardScreen}
                  options={{ title: 'Recordings', headerShown: false }}
                />
                <Stack.Screen 
                  name="Recording" 
                  component={RecordingScreen}
                  options={{ 
                    title: 'Recording',
                    headerBackVisible: false,
                    gestureEnabled: false,
                    headerShown: false,
                  }}
                />
                <Stack.Screen 
                  name="Playback" 
                  component={PlaybackScreen}
                  options={{ 
                    title: 'Playback',
                    headerShown: false,
                  }}
                />
              </Stack.Navigator>
            </View>

            {/* Speaker Section - 40px fixed height */}
            <View style={styles.speakerContainer}>
              <Speaker />
            </View>

            {/* Controls Section - 150px fixed height */}
            <Controls />
          </View>
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#D1D1D1',
    padding: 8,
    gap: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#191919',
    borderRadius: 1,
    overflow: 'hidden',
  },
  speakerContainer: {
    height: 40,
    backgroundColor: '#D1D1D1',
    borderRadius: 1,
  },
});

// Removed unused styles - no longer needed since we're using actual components
