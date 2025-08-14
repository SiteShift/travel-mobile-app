import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  InteractionManager,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
  withDelay,
  withRepeat,
  cancelAnimation,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
// MediaLibrary used defensively to coerce iOS ph:// assets into file:// URIs
let MediaLibrary: any;
try {
  // Lazy require to avoid bundling issues if not available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MediaLibrary = require('expo-media-library');
} catch {}

async function ensureFileUriAsync(originalUri: string): Promise<string> {
  // Already a file URI
  if (originalUri.startsWith('file://')) return originalUri;
  // Try image manipulator to write into app cache (works for many sources)
  try {
    const manipulated = await ImageManipulator.manipulateAsync(originalUri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    if (manipulated?.uri) return manipulated.uri;
  } catch {}
  // Try MediaLibrary to resolve ph:// to a local file
  try {
    if (MediaLibrary && originalUri.startsWith('ph://')) {
      const perm = await MediaLibrary.requestPermissionsAsync?.();
      if (!perm || perm.status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(originalUri);
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        if (info?.localUri) return info.localUri as string;
      }
    }
  } catch {}
  // As a last resort, prefix bare absolute paths with file://
  if (originalUri.startsWith('/')) return `file://${originalUri}`;
  return originalUri;
}
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { useRouter } from 'expo-router';
import { SimpleDateTimePicker } from './SimpleDateTimePicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants for better maintainability
const ANIMATION_CONFIG = {
  ENTRANCE_DURATION: 500,
  COVER_FADE_DURATION: 600,
  PAGE_FLIP_DURATION: 600,
  FORM_FADE_DURATION: 300,
  SPARKLE_DURATION: 500,
  GLOW_DURATION: 500,
  PULSE_DURATION: 800,
  HOLD_AFTER_FADE_MS: 800,
} as const;

const BOOK_CONFIG = {
  SCALE_FACTOR: 0.85,
  HEIGHT_FACTOR: 0.6,
  INITIAL_SCALE: 0.02, // start smaller for a more dramatic grow-in
  ENTRANCE_OVERSHOOT: 1.06, // subtle overshoot, feels more premium
  MAX_ROTATION_Y: -25,
  PAGE_FLIP_ANGLE: 180,
} as const;

// Animation states with better typing
enum BookState {
  INITIAL = 'INITIAL',
  ZOOMING = 'ZOOMING', 
  COVER_SELECTION = 'COVER_SELECTION',
  COVER_UPLOADING = 'COVER_UPLOADING',
  COVER_APPLIED = 'COVER_APPLIED',
  OPENING = 'OPENING',
  FORM_ENTRY = 'FORM_ENTRY',
  CLOSING = 'CLOSING',
}

// Better typed interfaces
interface BookAnimationValues {
  bookScale: SharedValue<number>;
  bookOpacity: SharedValue<number>;
  bookRotationY: SharedValue<number>;
  bookRotationX: SharedValue<number>;
  bookTranslateX: SharedValue<number>;
  bookTranslateY: SharedValue<number>;
  coverOpacity: SharedValue<number>;
  coverScale: SharedValue<number>;
  pageRotationY: SharedValue<number>;
  pageOpacity: SharedValue<number>;
  formOpacity: SharedValue<number>;
  backdropOpacity: SharedValue<number>;
  placeholderPulse: SharedValue<number>;
  sparkleOpacity: SharedValue<number>;
  glowOpacity: SharedValue<number>;
}

interface BookCreationData {
  title: string;
  description: string;
  image: string | null;
  startDate: Date;
  endDate: Date;
}

interface AnimatedBookCreationProps {
  visible: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

export const AnimatedBookCreation: React.FC<AnimatedBookCreationProps> = ({
  visible,
  onClose,
  onCreateTrip,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  // State management with better typing
  const [currentState, setCurrentState] = useState<BookState>(BookState.INITIAL);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookCreationData>({
    title: '',
    description: '',
    image: null,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const isNavigatingRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const templateReadyRef = useRef(false);
  const isMountedRef = useRef(true);
  const openScheduledRef = useRef(false);

  // Animation values - destructured for cleaner code
  const bookScale = useSharedValue(BOOK_CONFIG.INITIAL_SCALE as number);
  const bookOpacity = useSharedValue(0);
  const bookRotationY = useSharedValue(0);
  const bookRotationX = useSharedValue(0);
  const bookTranslateX = useSharedValue(0);
  const bookTranslateY = useSharedValue(0);
  const coverOpacity = useSharedValue(0);
  const coverScale = useSharedValue(0.8);
  const coverLightSweep = useSharedValue(0); // 0..1 sweep progress
  const pageRotationY = useSharedValue(90); // Start page hidden on the right
  const pageOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const placeholderPulse = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  // Control shadow opacity during large transforms to avoid visual tearing
  const bookShadowOpacity = useSharedValue(1);
  // New: real cover hinge rotation and measured width for proper pivot
  const coverHingeRotationY = useSharedValue(0);
  const pageWidth = useSharedValue(0);
  // Full white overlay animation values
  const whiteOverlayOpacity = useSharedValue(0);
  const whiteOverlayScale = useSharedValue(1);
  // UI entrance animations for white screen content
  const uiTitleOpacity = useSharedValue(0);
  const uiTitleTranslateY = useSharedValue(12);
  const uiFieldsOpacity = useSharedValue(0);
  const uiFieldsTranslateY = useSharedValue(14);
  const uiButtonOpacity = useSharedValue(0);
  const uiButtonTranslateY = useSharedValue(16);
  // Force rasterization flags (as View props, not styles)
  const hwAndroid = Platform.OS === 'android' ? true : undefined;
  const hwiOS = Platform.OS === 'ios' ? true : undefined;

  // Error boundary handler
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`AnimatedBookCreation Error [${context}]:`, error);
    setHasError(true);
    Alert.alert('Something went wrong', 'Please try again.');
  }, []);

  // Reset animation when modal opens
  useEffect(() => {
    isMountedRef.current = true;
    if (visible) {
      resetAnimation();
      isNavigatingRef.current = false;
      // Preload the blank template to avoid first-frame flicker
      (async () => {
        try {
          const mod = require('../../public/assets/Blank-trip-image-book-animation.webp');
          await Asset.fromModule(mod).downloadAsync();
          templateReadyRef.current = true;
        } catch {}
        if (isMountedRef.current) {
          startBookCreationFlow();
        }
      })();
    } else {
      resetAnimation();
      setCurrentState(BookState.INITIAL);
      setCoverImage(null);
      setFormData({
        title: '',
        description: '',
        image: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      setOverlayActive(false);
      isNavigatingRef.current = false;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [visible]);

  const resetAnimation = useCallback(() => {
    'worklet';
    bookScale.value = BOOK_CONFIG.INITIAL_SCALE;
    bookOpacity.value = 0;
    bookRotationY.value = 0;
    bookRotationX.value = 0;
    coverOpacity.value = 0;
    coverScale.value = 0.8;
    pageRotationY.value = 90; // Start page hidden on the right
    pageOpacity.value = 0;
    formOpacity.value = 0;
    backdropOpacity.value = 0;
    bookTranslateY.value = 0;
    bookTranslateX.value = 0;
    placeholderPulse.value = 1;
    sparkleOpacity.value = 0;
    glowOpacity.value = 0;
    coverHingeRotationY.value = 0;
    whiteOverlayOpacity.value = 0;
    whiteOverlayScale.value = 1;
  }, [
    bookScale, bookOpacity, bookRotationY, bookRotationX, coverOpacity, coverScale,
    pageRotationY, pageOpacity, formOpacity, backdropOpacity, bookTranslateY,
    bookTranslateX, placeholderPulse, sparkleOpacity, glowOpacity, coverHingeRotationY,
    whiteOverlayOpacity, whiteOverlayScale
  ]);

  const startBookCreationFlow = useCallback(() => {
    try {
      // Strong haptic feedback for magical start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setCurrentState(BookState.ZOOMING);
      
      // Backdrop fade in with sparkles
      backdropOpacity.value = withTiming(1, { duration: 400 });
      // Remove orangey glow effect by eliminating sparkle overlay ramp-up
      sparkleOpacity.value = withTiming(0, { duration: 0 });
      
      // Dramatic but smooth book entrance - small to large with gentle overshoot
      bookOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });

       bookScale.value = withSequence(
        withTiming(BOOK_CONFIG.ENTRANCE_OVERSHOOT, {
           duration: ANIMATION_CONFIG.ENTRANCE_DURATION,
          easing: Easing.bezier(0.22, 0.61, 0.36, 1),
        }),
        withSpring(1, { damping: 14, stiffness: 140, mass: 0.7 })
      );

      // Subtle 3D rotation for depth, reduced amplitude and duration
      bookRotationX.value = withSequence(
        withTiming(-4, { duration: 220 }),
        withSpring(0, { damping: 16, stiffness: 150 })
      );
      
      // Remove colored glow behind the book
      glowOpacity.value = withTiming(0, { duration: 0 });
      
      // Do not pulse the placeholder (keep dotted rectangle still)
      setTimeout(() => {
        runOnJS(setCurrentState)(BookState.COVER_SELECTION);
      }, ANIMATION_CONFIG.ENTRANCE_DURATION + 150);
      
    } catch (error) {
      handleError(error as Error, 'startBookCreationFlow');
    }
  }, [
    backdropOpacity, sparkleOpacity, bookOpacity, bookScale, bookRotationX,
    glowOpacity, placeholderPulse, handleError
  ]);

  const selectCoverImage = useCallback(async () => {
    if (currentState !== BookState.COVER_SELECTION) return;
    
    try {
      setCurrentState(BookState.COVER_UPLOADING);
      
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // do not crop
        quality: 1.0,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;
        imageUri = await ensureFileUriAsync(imageUri);
        setCoverImage(imageUri);
        setFormData(prev => ({ ...prev, image: imageUri }));
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('pending_cover_image', imageUri);
        } catch (e) {
          console.warn('Failed to persist pending cover image', e);
        }
        // Immediately show the image as cover by making coverOpacity visible
        coverOpacity.value = withTiming(1, { duration: 100 });
        coverScale.value = withTiming(1, { duration: 100 });
        
        // Stop placeholder pulse
        cancelAnimation(placeholderPulse);
        placeholderPulse.value = 1;
        
        // Epic cover application sequence
        setCurrentState(BookState.COVER_APPLIED);
        
        // Haptic for success
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Prepare cover visuals; actual fade begins when image loads to avoid hitch
        coverScale.value = withTiming(1, { duration: 0 });
        coverOpacity.value = 0;
        
        // Softer micro-tilt only (no big wobble)
        bookRotationY.value = withSequence(
          withTiming(4, { duration: 260 }),
          withTiming(-2, { duration: 280 }),
          withSpring(0, { damping: 10, stiffness: 130 })
        );
        
        // Keep glow disabled
        glowOpacity.value = withTiming(0, { duration: 0 });
        
        // Auto-open is now scheduled from the image onLoad handler after a short fade
        if (openTimerRef.current) {
          clearTimeout(openTimerRef.current);
          openTimerRef.current = null;
        }
        openScheduledRef.current = false;
      } else {
        setCurrentState(BookState.COVER_SELECTION);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setCurrentState(BookState.COVER_SELECTION);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, [currentState]);

  const openBook = useCallback(() => {
    try {
      if (isNavigatingRef.current) return;
      setCurrentState(BookState.OPENING);
      
      // Epic haptic feedback for magical book opening
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);
      
      // As the cover begins to open, fade out the cover image quickly
      coverOpacity.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });

      // Slight overall book yaw for depth while the cover opens
      bookRotationY.value = withTiming(BOOK_CONFIG.MAX_ROTATION_Y, {
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      
      // Slight book movement like being held
      bookTranslateX.value = withTiming(-screenWidth * 0.03, { 
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 200 
      });
      bookTranslateY.value = withTiming(-screenHeight * 0.01, { 
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 200 
      });
      
      // Real cover hinge open (front cover rotates around left edge)
      coverHingeRotationY.value = withTiming(-155, {
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION,
        easing: Easing.out(Easing.cubic),
      });

      // Reveal inner page later to avoid overlap seam during cover flip
      pageOpacity.value = withDelay(ANIMATION_CONFIG.PAGE_FLIP_DURATION - 280, withTiming(1, { duration: 160 }));
      pageRotationY.value = withDelay(
        150,
        withTiming(0, {
          duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 100,
          easing: Easing.bezier(0.2, 0.0, 0.1, 1.0),
        })
      );
      
      // Faster sparkle effect
      sparkleOpacity.value = withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(ANIMATION_CONFIG.SPARKLE_DURATION, withTiming(0, { duration: 240 }))
      );
      
      // After flip completes: perform a brief zoom-in with a white overlay already active to avoid any flicker
      setTimeout(() => {
        const ZOOM_AFTER_OPEN_MS = 160;
        // Bring in full-white overlay BEFORE zoom so the transition stays white end-to-end
        setOverlayActive(true);
        whiteOverlayOpacity.value = withTiming(1, { duration: 0 });
        // Slightly oversize the overlay to avoid any edge/pixel rounding reveals on some devices
        whiteOverlayScale.value = 1.06;

        // Stronger, quicker zoom to emphasize reveal (book is now covered by white)
        bookScale.value = withTiming(1.7, {
          duration: ZOOM_AFTER_OPEN_MS,
          easing: Easing.out(Easing.cubic),
        });

        setTimeout(() => {
          // Immediately hide book below and navigate under the white overlay
          bookOpacity.value = withTiming(0, { duration: 0 });
          if (isNavigatingRef.current) return;
          isNavigatingRef.current = true;
          const img = formData.image || coverImage;
          const params: Record<string, string> = { handoff: '1' };
          if (img) params.imageUri = img as string;
          if (formData.title) params.title = String(formData.title);
          if (formData.startDate) params.startDate = (formData.startDate as Date).toISOString();
          if (formData.endDate) params.endDate = (formData.endDate as Date).toISOString();
          runOnJS(router.replace)({ pathname: '/create-trip', params });
          // Keep white overlay up; the next screen will signal when it's ready via AsyncStorage flag
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.setItem('handoff_overlay_up', '1');
          } catch {}
        }, ZOOM_AFTER_OPEN_MS);
      }, ANIMATION_CONFIG.PAGE_FLIP_DURATION);
      
    } catch (error) {
      handleError(error as Error, 'openBook');
    }
  }, [
    bookRotationY, bookTranslateX, bookTranslateY, pageOpacity, pageRotationY,
    sparkleOpacity, handleError, coverHingeRotationY, whiteOverlayOpacity, 
    whiteOverlayScale, bookOpacity, bookScale, formData, coverImage, router, 
    onClose
  ]);

  const handleCreateTrip = async () => {
    if (!formData.title.trim() || !formData.image) {
      Alert.alert('Missing Information', 'Please add a title and cover image.');
      return;
    }

    // Dismiss keyboard before leaving the form to avoid it persisting into the next transition
    try { Keyboard.dismiss(); } catch {}

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreateTrip({
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: formData.image!,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      onClose();
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up all animations
    cancelAnimation(placeholderPulse);
    
    // Smooth exit animation
    backdropOpacity.value = withTiming(0, { duration: 300 });
    sparkleOpacity.value = withTiming(0, { duration: 200 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    bookOpacity.value = withTiming(0, { duration: 300 });
    bookScale.value = withTiming(0.05, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  // Animated styles
  const dimBackgroundStyle = useAnimatedStyle(() => ({
    opacity: overlayActive ? (1 - whiteOverlayOpacity.value) : backdropOpacity.value,
  }));

  const bookContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bookScale.value },
      { rotateX: `${bookRotationX.value}deg` },
      { rotateY: `${bookRotationY.value}deg` },
      { translateX: bookTranslateX.value },
      { translateY: bookTranslateY.value },
    ],
    opacity: bookOpacity.value,
  }));

  const coverStyle = useAnimatedStyle(() => ({
    opacity: coverOpacity.value,
    transform: [{ scale: coverScale.value }],
  }));

  // Animated light sweep highlight moving across the cover
  const coverSweepStyle = useAnimatedStyle(() => {
    const translateX = interpolate(coverLightSweep.value, [0, 1], [-50, 300]);
    const sweepOpacity = interpolate(coverLightSweep.value, [0, 0.2, 0.6, 1], [0, 0.35, 0.15, 0]);
    return {
      opacity: sweepOpacity,
      transform: [{ translateX }],
    };
  });

  const pageStyle = useAnimatedStyle(() => {
    const w = screenWidth * 0.85;
    return {
      opacity: pageOpacity.value,
      transform: [
        { translateX: -w / 2 },
        { rotateY: `${pageRotationY.value}deg` },
        { translateX: w / 2 },
      ],
    };
  });

  // Front cover hinge rotation around left edge
  const coverHingeStyle = useAnimatedStyle(() => {
    const w = screenWidth * 0.85;
    return {
      transform: [
        { translateX: -w / 2 },
        { rotateY: `${coverHingeRotationY.value}deg` },
        { translateX: w / 2 },
      ],
    };
  });

  // Dynamic cover shadow while opening (softened to avoid banding)
  const coverShadowAnimatedStyle = useAnimatedStyle(() => {
    const rotation = coverHingeRotationY.value;
    const progress = Math.min(Math.max((rotation + 155) / 155, 0), 1);
    const opacity = 0.02 + (1 - progress) * 0.18;
    return { opacity };
  });

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  // Full-white overlay animated style (with scale, but oversized to avoid edge artifacts)
  const whiteOverlayStyle = useAnimatedStyle(() => ({
    opacity: whiteOverlayOpacity.value,
    transform: [{ scale: whiteOverlayScale.value }],
  }));

  // Fade decorative/edge layers as white overlay fades in to avoid seams
  const edgeLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - whiteOverlayOpacity.value,
  }));

  const uiTitleStyle = useAnimatedStyle(() => ({
    opacity: uiTitleOpacity.value,
    transform: [{ translateY: uiTitleTranslateY.value }],
  }));
  const uiFieldsStyle = useAnimatedStyle(() => ({
    opacity: uiFieldsOpacity.value,
    transform: [{ translateY: uiFieldsTranslateY.value }],
  }));
  const uiButtonStyle = useAnimatedStyle(() => ({
    opacity: uiButtonOpacity.value,
    transform: [{ translateY: uiButtonTranslateY.value }],
  }));

  const placeholderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: placeholderPulse.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const tapGesture = Gesture.Tap().onStart(() => {
    'worklet';
    if (currentState === BookState.COVER_SELECTION) {
      runOnJS(selectCoverImage)();
    }
  });

  // Early returns for better performance
  if (!visible) return null;

  // Error state
  if (hasError) {
    return (
      <Modal visible={visible} transparent statusBarTranslucent>
        <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <Pressable style={styles.errorButton} onPress={onClose}>
              <Text style={styles.errorButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <Animated.View style={[styles.backdrop, (overlayActive || currentState === BookState.OPENING) && styles.backdropWhite]}>
          {/* Base white guard to guarantee full-bleed white during handoff */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject as any, styles.whiteGuard, styles.whiteGuardVisible]}
          />
          <Animated.View style={[StyleSheet.absoluteFillObject as any, styles.dimBackground, dimBackgroundStyle]} pointerEvents="none" />
          <StatusBar barStyle={(overlayActive || currentState === BookState.OPENING) ? 'dark-content' : (isDark ? 'light-content' : 'dark-content')} backgroundColor={(overlayActive || currentState === BookState.OPENING) ? '#FFFFFF' : 'transparent'} translucent />
          
          {/* Close button hidden during opening/overlay phases */}
          {!(overlayActive || currentState === BookState.OPENING) && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Icon name="close" size="xl" color="white" />
            </TouchableOpacity>
          )}
        
                <View style={styles.container}>
          <View style={styles.perspectiveWrapper}>
          {/* Disabled sparkles to remove colored background artifacts */}

            <Animated.View style={[styles.bookContainer, bookContainerStyle]}>
            {/* Glow removed */}

            {/* Enhanced 3D Book */}
            <GestureDetector gesture={tapGesture}>
              <View style={styles.book}>
                {/* Book back pages for depth (hide in placeholder state to remove rectangle) */}
                <Animated.View style={[
                  styles.bookBackPages,
                  edgeLayerStyle,
                  !coverImage ? { opacity: 0 } : null,
                ]} />
                
                {/* Book spine with realistic shadow (hide during placeholder to avoid rectangle artifacts) */}
                <AnimatedLinearGradient
                  colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.bookSpine, edgeLayerStyle, !coverImage ? { opacity: 0 } : null]}
                />
                
                {/* Multiple page edges for 3D effect - disabled to avoid seams */}
                {/* <View style={styles.pageEdge1} />
                <View style={styles.pageEdge2} />
                <View style={styles.pageEdge3} /> */}
                
                {/* Enhanced front cover with better shadows */}
                 <Animated.View
                  renderToHardwareTextureAndroid={hwAndroid}
                  shouldRasterizeIOS={hwiOS}
                  style={[styles.bookCoverWrapper, coverHingeStyle]}
                >
                  <View style={[
                    styles.bookCoverMask,
                    !coverImage ? styles.bookCoverMaskPlaceholder : null
                  ]}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.coverShadow}
                  />
                   {/* Avoid dark overlay in placeholder to reduce perceived flicker */}
                   {!(!coverImage) && (
                     <Animated.View pointerEvents="none" style={[styles.coverShadowOverlay, coverShadowAnimatedStyle]} />
                   )}
                  
                  <View style={styles.coverContent}>
                     {coverImage ? (
                       <Animated.View style={[styles.coverImageContainer, coverStyle]} pointerEvents="none">
                         <Image
                          source={{ uri: coverImage }}
                          style={styles.coverImage}
                          contentFit="cover"
                          onLoad={() => {
                            coverOpacity.value = withTiming(1, {
                              duration: ANIMATION_CONFIG.COVER_FADE_DURATION,
                              easing: Easing.out(Easing.cubic),
                            });
                            coverLightSweep.value = 0;
                            coverLightSweep.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
                            // Schedule opening after fade-in, then hold briefly so the photo can be appreciated
                            if (!openScheduledRef.current) {
                              if (openTimerRef.current) clearTimeout(openTimerRef.current);
                              openTimerRef.current = setTimeout(() => {
                                openBook();
                              }, ANIMATION_CONFIG.COVER_FADE_DURATION + ANIMATION_CONFIG.HOLD_AFTER_FADE_MS);
                              openScheduledRef.current = true;
                            }
                          }}
                        />
                        {/* Enhanced cover overlay */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
                          style={styles.coverOverlay}
                        />
                        {/* Light sweep */}
                        <Animated.View style={[styles.coverSweep, coverSweepStyle]} />
                      </Animated.View>
                      ) : (
                       <Animated.View style={[styles.placeholderCover, placeholderStyle]} pointerEvents={currentState === BookState.COVER_SELECTION ? 'auto' : 'none'}>
                         {/* Blank book template filling the cover area */}
                         <Image
                           source={require('../../public/assets/Blank-trip-image-book-animation.webp')}
                           style={[StyleSheet.absoluteFillObject as any]}
                           contentFit="cover"
                           transition={300}
                         />
                         {/* Tap affordance overlay */}
                         <View style={styles.placeholderContent}>
                           <View style={styles.plusIconContainer}>
                             <Icon name="plus" size="lg" color="#999" />
                           </View>
                           <Text style={[styles.placeholderText, { color: '#666' }]}>Tap to add cover</Text>
                         </View>
                       </Animated.View>
                     )}
                  </View>
                  </View>
                </Animated.View>

                {/* Realistic book page with proper 3D flip */}
                <Animated.View
                  renderToHardwareTextureAndroid={hwAndroid}
                  shouldRasterizeIOS={hwiOS}
                  style={[styles.bookPageWrapper, pageStyle]}
                >
                   <View style={[styles.bookPageMask, !coverImage ? { backgroundColor: 'transparent', borderWidth: 0 } : null]}>
                    <View style={styles.pageContent} />
                  </View>
                </Animated.View>
              </View>
            </GestureDetector>
            </Animated.View>
          </View>
        
          {/* Full-screen white overlay sits on top of everything to mask during handoff */}
          <Animated.View
            style={[styles.whiteOverlay, whiteOverlayStyle]}
            pointerEvents={overlayActive || currentState === BookState.FORM_ENTRY ? 'auto' : 'none'}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.whiteOverlayContent}>
                {/* Only render form when in FORM_ENTRY to avoid seeing the card during handoff */}
                {overlayActive && currentState !== BookState.FORM_ENTRY ? (
                  // During handoff, render an empty full-white filler so nothing shows
                  <View style={{ flex: 1 }} />
                ) : currentState === BookState.FORM_ENTRY ? (
                  <View style={styles.centerFormContainer}>
                    <View style={styles.centeredFormCard}>
                    <Animated.Text style={[styles.whiteTitle, uiTitleStyle]}>Create Book</Animated.Text>

                    <Animated.View style={[styles.inputGroupWhite, uiFieldsStyle]}>
                      <Text style={styles.inputLabelWhite}>Title</Text>
                      <TextInput
                        style={styles.titleInputWhite}
                        placeholder="Enter your trip name..."
                        placeholderTextColor="#B0B0B0"
                        value={formData.title}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                        maxLength={50}
                        returnKeyType="next"
                      />
                    </Animated.View>

                    <Animated.View style={[styles.inputGroupWhiteRow, uiFieldsStyle]}>
                      <View style={styles.datePickerCol}>
                        <Text style={styles.inputLabelWhite}>Start Date</Text>
                        <SimpleDateTimePicker
                          value={formData.startDate}
                          onDateChange={(d: Date) => setFormData(prev => ({ ...prev, startDate: d }))}
                          mode="date"
                          showIcon
                        />
                      </View>
                      <View style={styles.datePickerCol}>
                        <Text style={styles.inputLabelWhite}>End Date</Text>
                        <SimpleDateTimePicker
                          value={formData.endDate}
                          onDateChange={(d: Date) => setFormData(prev => ({ ...prev, endDate: d }))}
                          mode="date"
                          showIcon
                        />
                      </View>
                    </Animated.View>

                    <Animated.View style={[styles.inputGroupWhite, uiFieldsStyle]}>
                      <Text style={styles.inputLabelWhite}>Description</Text>
                      <TextInput
                        style={styles.descriptionInputWhite}
                        placeholder="Tell your story..."
                        placeholderTextColor="#B0B0B0"
                        value={formData.description}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                        returnKeyType="done"
                      />
                    </Animated.View>

                    <Animated.View style={uiButtonStyle}>
                      <TouchableOpacity
                        style={[styles.createButtonWhite, !formData.title.trim() && styles.createButtonWhiteDisabled]}
                        onPress={handleCreateTrip}
                        disabled={!formData.title.trim() || isLoading}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.createButtonWhiteText}>
                          {isLoading ? 'Creating...' : 'Create Trip'}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                    </View>
                  </View>
                ) : null}
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </Animated.View>

        </View>
      </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropWhite: {
    backgroundColor: '#FFFFFF',
  },
  dimBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)'
  },
  whiteGuard: {
    backgroundColor: 'transparent',
    zIndex: 0,
  },
  whiteGuardVisible: {
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  perspectiveWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ perspective: 1200 }],
  },
  // Sparkle effects
  sparklesContainer: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sparkle1: { top: '20%', left: '15%' },
  sparkle2: { top: '30%', right: '20%' },
  sparkle3: { top: '70%', left: '25%' },
  sparkle4: { top: '60%', right: '15%' },
  sparkle5: { top: '45%', left: '80%' },
  
  // Book container - bigger and more impressive
  bookContainer: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.6,
    zIndex: 10,
    overflow: 'visible',
  },
  
  // Glow effect
  glowContainer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  glowBlur: {
    flex: 1,
    borderRadius: 30,
  },
  
  // Enhanced 3D book
  book: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  
  // Book back pages for depth
  bookBackPages: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    zIndex: 0,
  },
  
  // Book spine with gradient
  bookSpine: {
    position: 'absolute',
    left: -12,
    top: 0,
    bottom: 0,
    width: 20,
    borderRadius: 4,
    zIndex: 0,
  },
  
  // Multiple page edges for 3D effect
  pageEdge1: {
    position: 'absolute',
    top: 2,
    left: -2,
    right: 6,
    bottom: -1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: -2,
  },
  pageEdge2: {
    position: 'absolute',
    top: 4,
    left: -1,
    right: 4,
    bottom: 0,
    backgroundColor: '#FCFCFC',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.03)',
    zIndex: -1,
  },
  pageEdge3: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 2,
    bottom: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.02)',
    zIndex: 0,
  },
  
  // Mask wrapper for the cover (static clipping)
  bookCoverMask: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
  },
  // When showing the placeholder, remove white rectangle so only the blank template shows
  bookCoverMaskPlaceholder: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  
  coverShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  
  coverContent: {
    flex: 1,
    zIndex: 2,
  },
  
  coverImageContainer: {
    flex: 1,
  },
  coverImage: {
    flex: 1,
    width: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  coverSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '12deg' }],
  },
  // Additional subtle shadow overlay that we animate with rotation
  coverShadowOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 0,
    borderRadius: 16,
  },
  // Absolute wrapper for animated cover so inner mask can flex correctly
  bookCoverWrapper: {
    ...StyleSheet.absoluteFillObject as any,
    zIndex: 3,
  },
  
  // Enhanced placeholder with dotted border and plus icon
  placeholderCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  
  dottedBorder: {
    // removed in favor of blank book template
  },
  
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  plusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Wrappers for page (animated outer + static inner mask)
  bookPageWrapper: {
    ...StyleSheet.absoluteFillObject as any,
    backfaceVisibility: 'hidden',
  },
  bookPageMask: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
  },
  
  pageContent: {
    flex: 1,
    borderRadius: 16,
    padding: 0,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  
  // Page texture lines
  pageLines: {
    position: 'absolute',
    top: 0,
    left: 60,
    right: 32,
    bottom: 0,
    opacity: 0.1,
  },
  // Paper overlay container
  paperOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  paperVignetteTopBottom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  paperVignetteLeftRight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ruledLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ruledLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.045)',
  },
  
  // Full white overlay styles
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    // Oversize slightly to avoid any device/safe-area rounding revealing edges during scale
    marginLeft: -8,
    marginRight: -8,
  },
  whiteOverlayContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  whiteOverlayScroll: {
    paddingBottom: 24,
  },
  centerFormContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredFormCard: {
    width: '90%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  whiteTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.5,
    fontFamily: 'Merienda',
  },
  inputGroupWhite: {
    marginBottom: 20,
  },
  inputGroupWhiteRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: 20,
  },
  datePickerCol: {
    flex: 1,
  },
  inputLabelWhite: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  titleInputWhite: {
    fontSize: 16,
    color: '#111111',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  descriptionInputWhite: {
    fontSize: 16,
    color: '#111111',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  createButtonWhite: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  createButtonWhiteDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonWhiteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  formContainer: {
    flex: 1,
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -0.5,
    fontFamily: 'Merienda',
  },
  
  inputGroup: {
    marginBottom: 28,
  },
  
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34495E',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  
  // Title input now matches the description style for consistency
  titleInput: {
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 52,
    backgroundColor: '#FAFAFA',
  },
  
  descriptionInput: {
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  
  createButton: {
    borderRadius: 16,
    marginTop: 'auto',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  
  createButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  createButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Error state styles
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    margin: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
}); 