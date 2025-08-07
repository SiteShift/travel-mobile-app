import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Merienda': require('../public/assets/Merienda-VariableFont_wght.ttf'),
    'PlusJakartaSans': require('../public/assets/PlusJakartaSans-VariableFont_wght.ttf'),
  });

  if (!loaded && !error) {
    return null;
  }

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
            name="trip/[id]" 
            options={{ 
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'fade',
              contentStyle: { backgroundColor: 'transparent' },
            }} 
          />
          <Stack.Screen 
            name="entry-editor" 
            options={{ 
              headerShown: false, 
              presentation: 'transparentModal',
              animation: 'fade',
              gestureEnabled: false,
            }} 
          />
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