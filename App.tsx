import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { Button } from './src/components';
import { SPACING, TYPOGRAPHY } from './src/constants/theme';

const AppContent: React.FC = () => {
  const { colors, toggleTheme, mode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Travel Diary App
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Current theme: {mode}
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Toggle Theme"
            onPress={toggleTheme}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Secondary Button"
            onPress={() => console.log('Secondary pressed')}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Ghost Button"
            onPress={() => console.log('Ghost pressed')}
            variant="ghost"
            style={styles.button}
          />
        </View>
      </View>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.styles.h1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: SPACING.md,
  },
});
