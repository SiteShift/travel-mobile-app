import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar, InteractionManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleDateTimePicker } from '../src/components/SimpleDateTimePicker';

export default function CreateTripScreen() {
  const { imageUri, handoff } = useLocalSearchParams<{ imageUri?: string; handoff?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [isSaving, setIsSaving] = useState(false);

  // Render instantly with no staged animations

  // One-frame white guard to prevent first-run reveal when arriving via handoff
  const [showGuard, setShowGuard] = useState(handoff === '1');

  const handleCreate = async () => {
    if (!title.trim() || !imageUri) {
      Alert.alert('Missing Info', 'Please add a title and cover image.');
      return;
    }
    setIsSaving(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const tripId = `trip-${Date.now()}`;
      const simpleTrip = {
        id: tripId,
        title: title.trim(),
        description: description.trim(),
        coverImage: imageUri,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        country: 'Adventure',
      };
      await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(simpleTrip));

      // Navigate straight to View Trip page
      router.replace({ pathname: `/trip/${tripId}` });
    } catch (e) {
      console.error('CreateTrip error:', e);
      Alert.alert('Error', 'Could not create trip.');
    } finally {
      setIsSaving(false);
    }
  };

  // Staggered fade-in animations
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeTitleGroup = useRef(new Animated.Value(0)).current;
  const fadeDatesDesc = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;
  const fadeClose = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Instantly visible; then stagger children
    Animated.sequence([
      Animated.timing(fadeTitle, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeTitleGroup, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeDatesDesc, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeButton, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeClose, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [fadeTitle, fadeTitleGroup, fadeDatesDesc, fadeButton, fadeClose]);

  useEffect(() => {
    if (!showGuard) return;
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => setShowGuard(false));
    });
  }, [showGuard]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Instant render: no white overlay */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          {/* First-render guard to ensure white is fully painted on first frame */}
          {showGuard && (
            <View pointerEvents="none" style={styles.whiteOverlay} />
          )}
          {/* Close button */}
          <Animated.View style={[styles.closeButtonWrapper, { top: insets.top + 12, opacity: fadeClose }]}> 
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.Text style={[styles.title, { opacity: fadeTitle }]}>Create Book</Animated.Text>

            <Animated.View style={[styles.group, { opacity: fadeTitleGroup }]}> 
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter your trip name..."
                placeholderTextColor="#A3A3A3"
                maxLength={50}
              />
            </Animated.View>

            <Animated.View style={[styles.row, { opacity: fadeDatesDesc }]}> 
              <View style={styles.col}>
                <Text style={styles.label}>Start Date</Text>
                <SimpleDateTimePicker value={startDate} onDateChange={setStartDate} mode="date" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>End Date</Text>
                <SimpleDateTimePicker value={endDate} onDateChange={setEndDate} mode="date" />
              </View>
            </Animated.View>

            <Animated.View style={[styles.group, { opacity: fadeDatesDesc }]}> 
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell your story..."
                placeholderTextColor="#A3A3A3"
                multiline
              />
            </Animated.View>

            <Animated.View style={{ opacity: fadeButton }}>
              <TouchableOpacity style={[styles.button, !title.trim() && styles.buttonDisabled]} disabled={!title.trim() || isSaving} onPress={handleCreate} activeOpacity={0.9}>
                <Text style={styles.buttonText}>{isSaving ? 'Creating...' : 'Create Trip'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  content: {
    flex: 1,
  },
  closeButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonWrapper: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    elevation: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'left',
    marginBottom: 28,
    letterSpacing: -0.6,
    fontFamily: 'Merienda',
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  button: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


