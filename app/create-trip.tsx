import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar, InteractionManager, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../src/components/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleDateTimePicker } from '../src/components/SimpleDateTimePicker';
import { MediaPicker, MediaItem } from '../src/components/MediaPicker';

export default function CreateTripScreen() {
  const { imageUri, handoff } = useLocalSearchParams<{ imageUri?: string; handoff?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const BRAND_ORANGE = '#EF6144';
  const BORDER_GREY = '#E5E7EB';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [isSaving, setIsSaving] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>(typeof imageUri === 'string' ? imageUri : undefined);
  const [isMediaPickerVisible, setIsMediaPickerVisible] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const [startFocusPulse, setStartFocusPulse] = useState(false);
  const [endFocusPulse, setEndFocusPulse] = useState(false);

  // Render instantly with no staged animations

  // One-frame white guard to prevent first-run reveal when arriving via handoff
  const [showGuard, setShowGuard] = useState(handoff === '1');

  const handleCreate = async () => {
    if (!title.trim() || !coverImageUri) {
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
        coverImage: coverImageUri,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        country: 'Adventure',
      };
      await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(simpleTrip));

      // Fade in overlay and show loading for 5 seconds before navigating
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      setTimeout(() => {
        router.replace({ pathname: `/trip/${tripId}` });
      }, 5000);
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
    // Slower, staggered entrance
    Animated.sequence([
      Animated.timing(fadeTitle, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeTitleGroup, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeDatesDesc, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeButton, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fadeClose, { toValue: 1, duration: 320, useNativeDriver: true }),
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
              style={styles.closeButtonPlain}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeButtonPlainText}>×</Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.Text style={[styles.title, { opacity: fadeTitle }]}>Create Book</Animated.Text>

            {/* Cover Image */}
            <Animated.View style={[styles.group, { opacity: fadeTitleGroup }]}> 
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.coverBox, !coverImageUri ? styles.inputDashed : styles.inputFocused]}
                onPress={() => setIsMediaPickerVisible(true)}
                accessibilityLabel="Choose cover image"
              >
                {coverImageUri ? (
                  <Image source={{ uri: coverImageUri }} style={styles.coverImage} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <LinearGradient
                      colors={[ 'rgba(244,132,95,0.8)', 'rgba(239,97,68,0.8)' ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.coverPlusCircle}
                    >
                      <Icon name="plus" size="lg" color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.coverPlaceholder}>Tap to add a cover photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

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
          <MediaPicker
            visible={isMediaPickerVisible}
            onClose={() => setIsMediaPickerVisible(false)}
            onMediaSelect={(items: MediaItem[]) => {
              if (items && items[0]) setCoverImageUri(items[0].uri);
            }}
            maxSelection={1}
            includeVideos={false}
          />
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
  },
});


