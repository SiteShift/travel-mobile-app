import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="trip-detail" 
            options={{ 
              headerShown: false, 
              presentation: 'transparentModal',
              animation: 'fade',
            }} 
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
} 