import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Text } from 'react-native';
import { useStore } from './src/store/useStore';

const Stack = createNativeStackNavigator();

function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard Screen</Text>
      <Text style={styles.subtext}>React Native App - Ready for Development</Text>
    </View>
  );
}

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
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 10,
    fontWeight: '300',
  },
  subtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
