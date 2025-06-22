import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../src/components/SafeAreaWrapper';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { Icon } from '../../src/components/Icon';
import { Card } from '../../src/components/Card';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { router } from 'expo-router';

export default function CameraTab() {
  const { colors } = useTheme();

  const handleTakePhoto = () => {
    Alert.alert(
      'Take Photo',
      'This will open the camera to take a photo for your journal',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Camera', 
          onPress: () => {
            // In a real app, would open camera
            console.log('Camera functionality - Phase 5');
            // After photo taken, navigate to entry editor
            router.push('/entry-editor');
          }
        },
      ]
    );
  };

  const handleTakeVideo = () => {
    Alert.alert(
      'Record Video',
      'This will open the camera to record a video for your journal',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Record Video', 
          onPress: () => {
            console.log('Video recording functionality - Phase 5');
            router.push('/entry-editor');
          }
        },
      ]
    );
  };

  const handleQuickEntry = () => {
    router.push('/entry-editor');
  };

  return (
    <SafeAreaWrapper variant="full">
      <Header title="Capture" />
      
      <View style={styles.container}>
        <View style={styles.content}>
          <Icon name="camera" size="xxl" color={colors.primary[500]} />
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Capture Your Journey
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Take photos and videos to document your travels and create memorable entries
          </Text>
          
          <View style={styles.actionContainer}>
            <Card variant="elevated" style={styles.actionCard}>
              <Button
                title="📸 Take Photo"
                variant="primary"
                onPress={handleTakePhoto}
                style={styles.actionButton}
              />
              <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                Capture a moment and create a journal entry
              </Text>
            </Card>

            <Card variant="elevated" style={styles.actionCard}>
              <Button
                title="🎥 Record Video"
                variant="secondary"
                onPress={handleTakeVideo}
                style={styles.actionButton}
              />
              <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                Record a video memory of your adventure
              </Text>
            </Card>

            <Card variant="elevated" style={styles.actionCard}>
              <Button
                title="✍️ Quick Entry"
                variant="ghost"
                onPress={handleQuickEntry}
                style={styles.actionButton}
              />
              <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                Write a text entry without media
              </Text>
            </Card>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 320,
    gap: SPACING.md,
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  actionButton: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  actionDescription: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
  },
}); 