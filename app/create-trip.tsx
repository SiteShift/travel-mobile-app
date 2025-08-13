import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar, InteractionManager } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleDateTimePicker } from '../src/components/SimpleDateTimePicker';
 

export default function CreateTripScreen() {
  const { imageUri, handoff, title: initialTitle, startDate: initialStart, endDate: initialEnd } = useLocalSearchParams<{ imageUri?: string; handoff?: string; title?: string; startDate?: string; endDate?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const BRAND_ORANGE = '#EF6144';
  const BORDER_GREY = '#E5E7EB';

  const [title, setTitle] = useState(initialTitle ? String(initialTitle) : '');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(initialStart ? new Date(initialStart as string) : new Date());
  const [endDate, setEndDate] = useState(initialEnd ? new Date(initialEnd as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [isSaving, setIsSaving] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [coverImageUri] = useState<string | undefined>(typeof imageUri === 'string' ? decodeURIComponent(String(imageUri)) : undefined);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const [startFocusPulse, setStartFocusPulse] = useState(false);
  const [endFocusPulse, setEndFocusPulse] = useState(false);

  // Render instantly with no staged animations

  // One-frame white guard to prevent first-run reveal when arriving via handoff
  const [showGuard, setShowGuard] = useState(handoff === '1');
  const guardOpacity = useRef(new Animated.Value(handoff === '1' ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(handoff === '1' ? 0 : 1)).current;

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please add a title.');
      return;
    }
    setIsSaving(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const tripId = `trip-${Date.now()}`;
      // As a robust fallback, check if a pending cover image was persisted by the animation step
      let finalCover = coverImageUri || (typeof imageUri === 'string' ? imageUri : undefined);
      try {
        if (!finalCover) {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const pending = await AsyncStorage.getItem('pending_cover_image');
          if (pending) finalCover = pending;
        }
      } catch {}
      const simpleTrip = {
        id: tripId,
        title: title.trim(),
        description: description.trim(),
        coverImage: finalCover,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        country: 'Adventure',
      };
      await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(simpleTrip));

      // Show loading animation overlay, then wait ~3 seconds before navigating
      Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      setTimeout(() => {
        router.replace({ pathname: `/trip/${tripId}` });
      }, 3000);
    } catch (e) {
      console.error('CreateTrip error:', e);
      Alert.alert('Error', 'Could not create trip.');
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
    // Slower, more pronounced stagger for a relaxed reveal
    Animated.stagger(140, [
      Animated.timing(fadeTitle, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeTitleGroup, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeDatesDesc, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeButton, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeClose, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [fadeTitle, fadeTitleGroup, fadeDatesDesc, fadeButton, fadeClose]);

  useEffect(() => {
    if (!showGuard) return;
    let mounted = true;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    (async () => {
      try {
        await AsyncStorage.setItem('handoff_overlay_up', '0');
      } catch {}
      // Crossfade immediately on next frame; don't wait for all interactions
      requestAnimationFrame(() => {
        if (!mounted) return;
        Animated.parallel([
          Animated.timing(guardOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(contentOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          if (mounted) setShowGuard(false);
        });
      });
    })();
    return () => { mounted = false; };
  }, [showGuard, guardOpacity, contentOpacity]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Instant render: no white overlay */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {/* First-render guard to ensure white is fully painted on first frame */}
          {showGuard && (
            <Animated.View pointerEvents="none" style={[styles.whiteOverlay, { opacity: guardOpacity }]} />
          )}
          {/* Close button */}
          <Animated.View style={[styles.closeButtonWrapper, { top: insets.top + 10, right: 32, opacity: fadeClose }]}> 
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
              accessibilityLabel="Close"
              style={styles.closeButtonPlain}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeButtonPlainText}>×</Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 64 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.Text style={[styles.title, { opacity: fadeTitle }]}>Create Book</Animated.Text>

            {/* Cover image selection removed: cover comes from the book creation flow */}

            <Animated.View style={[styles.group, { opacity: fadeTitleGroup }]}> 
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={[styles.input, isTitleFocused ? styles.inputFocused : styles.inputDashed]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter your trip name..."
                placeholderTextColor="#A3A3A3"
                maxLength={50}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                // selectionColor applies to both caret and selection highlight on RN
                selectionColor={BRAND_ORANGE}
              />
            </Animated.View>

            <Animated.View style={[styles.row, { opacity: fadeDatesDesc }]}> 
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.col, styles.inputLike, startFocusPulse ? styles.inputFocused : styles.inputDashed]}
                onPress={() => {
                  setStartFocusPulse(true);
                  setTimeout(() => setStartFocusPulse(false), 800);
                }}
              >
                <Text style={styles.label}>Start Date</Text>
                <SimpleDateTimePicker value={startDate} onDateChange={setStartDate} mode="date" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.col, styles.inputLike, endFocusPulse ? styles.inputFocused : styles.inputDashed]}
                onPress={() => {
                  setEndFocusPulse(true);
                  setTimeout(() => setEndFocusPulse(false), 800);
                }}
              >
                <Text style={styles.label}>End Date</Text>
                <SimpleDateTimePicker value={endDate} onDateChange={setEndDate} mode="date" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.group, { opacity: fadeDatesDesc }]}> 
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multiline, isDescFocused ? styles.inputFocused : styles.inputDashed]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell your story..."
                placeholderTextColor="#A3A3A3"
                multiline
                onFocus={() => setIsDescFocused(true)}
                onBlur={() => setIsDescFocused(false)}
                selectionColor={BRAND_ORANGE}
              />
            </Animated.View>

            <Animated.View style={{ opacity: fadeButton }}>
              <TouchableOpacity style={[styles.button, styles.buttonPill, { backgroundColor: BRAND_ORANGE }, !title.trim() && styles.buttonDisabled]} disabled={!title.trim() || isSaving} onPress={handleCreate} activeOpacity={0.9}>
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{isSaving ? 'Creating...' : 'Create Trip'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
          {/* No media picker here; cover image is supplied by the previous step */}
          {isSaving && (
            <Animated.View style={[styles.loadingOverlay, { opacity: overlayOpacity }]} pointerEvents="auto">
              <View style={styles.loadingContent}>
                <LottieView
                  source={require('../public/assets/nhdHuewM5l.json')}
                  autoPlay
                  loop
                  style={styles.loadingLottie}
                />
                <Text style={styles.loadingText}>Creating your Trip...</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
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
  closeButtonPlain: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPlainText: {
    color: '#111111',
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '800',
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
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputDashed: {
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderStyle: 'solid',
    borderColor: '#EF6144',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputLike: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  coverBox: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    fontSize: 15,
    color: '#6B7280',
  },
  coverPlusCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPill: {
    borderRadius: 999,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    width: 280,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLottie: {
    width: 240,
    height: 240,
  },
  loadingText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    opacity: 0.7,
  },
});


