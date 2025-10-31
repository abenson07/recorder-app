import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from './src/store/useStore';
import DashboardScreen from './src/components/Dashboard';
import RecordingScreen from './src/components/Recording';
import PlaybackScreen from './src/components/Playback';

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
              options={{ title: 'Recordings' }}
            />
            <Stack.Screen 
              name="Recording" 
              component={RecordingScreen}
              options={{ 
                title: 'Recording',
                headerBackVisible: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="Playback" 
              component={PlaybackScreen}
              options={{ 
                title: 'Playback',
              }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Removed unused styles - no longer needed since we're using actual components
