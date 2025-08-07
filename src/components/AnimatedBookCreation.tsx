import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
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
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants for better maintainability
const ANIMATION_CONFIG = {
  ENTRANCE_DURATION: 650, // smoother, slightly slower entrance
  COVER_FADE_DURATION: 1400, // slower fade-in for the cover
  PAGE_FLIP_DURATION: 900, // slower, more elegant page flip
  FORM_FADE_DURATION: 450,
  SPARKLE_DURATION: 600,
  GLOW_DURATION: 600,
  PULSE_DURATION: 1000,
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
  const [hasError, setHasError] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // New: real cover hinge rotation and measured width for proper pivot
  const coverHingeRotationY = useSharedValue(0);
  const pageWidth = useSharedValue(0);

  // Error boundary handler
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`AnimatedBookCreation Error [${context}]:`, error);
    setHasError(true);
    Alert.alert('Something went wrong', 'Please try again.');
  }, []);

  // Reset animation when modal opens
  useEffect(() => {
    if (visible) {
      resetAnimation();
      startBookCreationFlow();
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
    }
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
  }, [
    bookScale, bookOpacity, bookRotationY, bookRotationX, coverOpacity, coverScale,
    pageRotationY, pageOpacity, formOpacity, backdropOpacity, bookTranslateY,
    bookTranslateX, placeholderPulse, sparkleOpacity, glowOpacity, coverHingeRotationY
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

      // Subtle 3D rotation for depth, reduced amplitude to feel calmer
      bookRotationX.value = withSequence(
        withTiming(-5, { duration: 380 }),
        withSpring(0, { damping: 14, stiffness: 140 })
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
        const imageUri = result.assets[0].uri;
        setCoverImage(imageUri);
        setFormData(prev => ({ ...prev, image: imageUri }));
        
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
        
        // Auto-open book after cover is fully applied (can be canceled by drag)
        if (openTimerRef.current) clearTimeout(openTimerRef.current);
        openTimerRef.current = setTimeout(() => {
          openBook();
        }, ANIMATION_CONFIG.COVER_FADE_DURATION + 600);
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
      setCurrentState(BookState.OPENING);
      
      // Epic haptic feedback for magical book opening
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);
      
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
      // Rotate the cover out of view while revealing the first page beneath
      coverHingeRotationY.value = withTiming(-155, {
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION,
        easing: Easing.bezier(0.2, 0.0, 0.1, 1.0),
      });

      // Reveal inner page slightly after cover begins moving
      pageOpacity.value = withDelay(120, withTiming(1, { duration: 220 }));
      pageRotationY.value = withDelay(
        150,
        withTiming(0, {
          duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 100,
          easing: Easing.bezier(0.2, 0.0, 0.1, 1.0),
        })
      );
      
      // Enhanced sparkle effect during opening
      sparkleOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(ANIMATION_CONFIG.SPARKLE_DURATION, withTiming(0, { duration: 400 }))
      );
      
      // Show form with better timing after page flip
      setTimeout(() => {
        setCurrentState(BookState.FORM_ENTRY);
        formOpacity.value = withDelay(
          100, 
          withTiming(1, { 
            duration: ANIMATION_CONFIG.FORM_FADE_DURATION, 
            easing: Easing.out(Easing.quad) 
          })
        );
      }, ANIMATION_CONFIG.PAGE_FLIP_DURATION);
      
    } catch (error) {
      handleError(error as Error, 'openBook');
    }
  }, [
    bookRotationY, bookTranslateX, bookTranslateY, pageOpacity, pageRotationY,
    sparkleOpacity, formOpacity, handleError, coverHingeRotationY
  ]);

  const handleCreateTrip = async () => {
    if (!formData.title.trim() || !formData.image) {
      Alert.alert('Missing Information', 'Please add a title and cover image.');
      return;
    }

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
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
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
    const w = pageWidth.value || (screenWidth * 0.85);
    return {
      opacity: pageOpacity.value,
      transform: [
        { perspective: 1000 },
        { translateX: -w / 2 },
        { rotateY: `${pageRotationY.value}deg` },
        { translateX: w / 2 },
      ],
    };
  });

  // Front cover hinge rotation around left edge
  const coverHingeStyle = useAnimatedStyle(() => {
    const w = pageWidth.value || (screenWidth * 0.85);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: -w / 2 },
        { rotateY: `${coverHingeRotationY.value}deg` },
        { translateX: w / 2 },
      ],
    };
  });

  // Dynamic cover shadow while opening
  const coverShadowAnimatedStyle = useAnimatedStyle(() => {
    // Map rotation [-155..0] to opacity [0.05..0.35]
    const rotation = coverHingeRotationY.value;
    const progress = Math.min(Math.max((rotation + 155) / 155, 0), 1);
    const opacity = 0.05 + (1 - progress) * 0.3;
    return { opacity };
  });

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
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
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Icon name="close" size="xl" color="white" />
          </TouchableOpacity>
        
                <View style={styles.container}>
          {/* Disabled sparkles to remove colored background artifacts */}

            <Animated.View style={[styles.bookContainer, bookContainerStyle]}>
            {/* Glow removed */}

            {/* Enhanced 3D Book */}
            <GestureDetector gesture={tapGesture}>
              <View style={styles.book}>
                {/* Book back pages for depth */}
                <View style={styles.bookBackPages} />
                
                {/* Book spine with realistic shadow */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookSpine}
                />
                
                {/* Multiple page edges for 3D effect */}
                <View style={styles.pageEdge1} />
                <View style={styles.pageEdge2} />
                <View style={styles.pageEdge3} />
                
                {/* Enhanced front cover with better shadows */}
                <Animated.View
                  style={[styles.bookCover, coverHingeStyle]}
                  onLayout={(e) => {
                    // Measure page width for correct pivot math
                    pageWidth.value = e.nativeEvent.layout.width;
                  }}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.coverShadow}
                  />
                  <Animated.View pointerEvents="none" style={[styles.coverShadowOverlay, coverShadowAnimatedStyle]} />
                  
                  <View style={styles.coverContent}>
                    {coverImage ? (
                      <Animated.View style={[styles.coverImageContainer, coverStyle]}>
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
                            coverLightSweep.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
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
                      <Animated.View style={[styles.placeholderCover, placeholderStyle]}>
                        {/* Dotted border */}
                        <View style={styles.dottedBorder} />
                        
                        {/* Plus icon and text */}
                        <View style={styles.placeholderContent}>
                          <View style={styles.plusIconContainer}>
                            <Icon name="plus" size="lg" color="#999" />
                          </View>
                          <Text style={[styles.placeholderText, { color: '#666' }]}>
                            Tap to add cover
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>

                {/* Realistic book page with proper 3D flip */}
                <Animated.View style={[styles.bookPage, pageStyle]}>
                  <View style={styles.pageContent}>
                    {/* Page texture and lines */}
                    <View style={styles.pageLines} />
                    {/* Paper styling overlays: subtle vignette + faint ruled lines */}
                    <View pointerEvents="none" style={styles.paperOverlayContainer}>
                      {/* Top-to-bottom vignette */}
                      <LinearGradient
                        colors={['rgba(0,0,0,0.03)', 'transparent', 'rgba(0,0,0,0.02)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.paperVignetteTopBottom}
                      />
                      {/* Left-to-right warmth */}
                      <LinearGradient
                        colors={['rgba(255, 214, 150, 0.03)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.paperVignetteLeftRight}
                      />
                      {/* Faint ruled lines */}
                      <View style={styles.ruledLinesContainer}>
                        {Array.from({ length: 18 }).map((_, i) => (
                          <View
                            key={`line-${i}`}
                            style={[
                              styles.ruledLine,
                              { top: `${(i + 1) * (100 / 20)}%` },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    
                    <Animated.View style={[styles.formContainer, formStyle]}>
                      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <KeyboardAvoidingView
                          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                          style={styles.keyboardView}
                        >
                          <ScrollView 
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                          >
                            <Text style={styles.pageTitle}>Create Book</Text>
                            
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Title</Text>
                              <TextInput
                                style={styles.titleInput}
                                placeholder="Enter your trip name..."
                                placeholderTextColor="#999"
                                value={formData.title}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                                maxLength={50}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onBlur={() => Keyboard.dismiss()}
                              />
                            </View>

                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Description</Text>
                              <TextInput
                                style={styles.descriptionInput}
                                placeholder="Tell your story..."
                                placeholderTextColor="#999"
                                value={formData.description}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                                onBlur={() => Keyboard.dismiss()}
                              />
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.createButton,
                                !formData.title.trim() && styles.createButtonDisabled
                              ]}
                              onPress={handleCreateTrip}
                              disabled={!formData.title.trim() || isLoading}
                            >
                              <LinearGradient
                                colors={!formData.title.trim() ? ['#ccc', '#aaa'] : ['#FF6B6B', '#FF5252']}
                                style={styles.createButtonGradient}
                              >
                                <Text style={styles.createButtonText}>
                                  {isLoading ? 'Creating...' : 'Create Trip'}
                                </Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </ScrollView>
                        </KeyboardAvoidingView>
                      </TouchableWithoutFeedback>
                    </Animated.View>
                  </View>
                </Animated.View>
              </View>
            </GestureDetector>
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  
  // Book back pages for depth
  bookBackPages: {
    position: 'absolute',
    top: 6,
    left: -4,
    right: 8,
    bottom: -2,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    zIndex: -3,
  },
  
  // Book spine with gradient
  bookSpine: {
    position: 'absolute',
    right: -12,
    top: 4,
    bottom: 4,
    width: 20,
    borderRadius: 4,
    zIndex: -1,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
  
  // Enhanced book cover
  bookCover: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 3,
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
  
  // Enhanced placeholder with dotted border and plus icon
  placeholderCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  
  dottedBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
    borderRadius: 12,
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
  
  // Realistic book page - FIXED positioning and transform origin
  bookPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEFEFE',
    borderRadius: 16,
    transformOrigin: 'left center', // FIXED: Left edge as pivot for left-to-right flip
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    zIndex: 0,
    overflow: 'hidden', // Ensure content doesn't go off-screen
  },
  
  pageContent: {
    flex: 1,
    borderRadius: 16,
    padding: 32,
    backgroundColor: '#FEFEFE',
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