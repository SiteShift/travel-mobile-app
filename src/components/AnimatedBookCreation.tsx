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
  ENTRANCE_DURATION: 500,
  COVER_FADE_DURATION: 800,
  PAGE_FLIP_DURATION: 700, // Faster, smoother page flip
  FORM_FADE_DURATION: 400,
  SPARKLE_DURATION: 600,
  GLOW_DURATION: 600,
  PULSE_DURATION: 1000,
} as const;

const BOOK_CONFIG = {
  SCALE_FACTOR: 0.85,
  HEIGHT_FACTOR: 0.6,
  INITIAL_SCALE: 0.05,
  ENTRANCE_OVERSHOOT: 1.1,
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

  // Animation values - destructured for cleaner code
  const bookScale = useSharedValue(BOOK_CONFIG.INITIAL_SCALE as number);
  const bookOpacity = useSharedValue(0);
  const bookRotationY = useSharedValue(0);
  const bookRotationX = useSharedValue(0);
  const bookTranslateX = useSharedValue(0);
  const bookTranslateY = useSharedValue(0);
  const coverOpacity = useSharedValue(0);
  const coverScale = useSharedValue(0.8);
  const pageRotationY = useSharedValue(90); // Start page hidden on the right
  const pageOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const placeholderPulse = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

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
  }, [
    bookScale, bookOpacity, bookRotationY, bookRotationX, coverOpacity, coverScale,
    pageRotationY, pageOpacity, formOpacity, backdropOpacity, bookTranslateY,
    bookTranslateX, placeholderPulse, sparkleOpacity, glowOpacity
  ]);

  const startBookCreationFlow = useCallback(() => {
    try {
      // Strong haptic feedback for magical start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setCurrentState(BookState.ZOOMING);
      
      // Backdrop fade in with sparkles
      backdropOpacity.value = withTiming(1, { duration: 400 });
      sparkleOpacity.value = withTiming(1, { duration: ANIMATION_CONFIG.SPARKLE_DURATION });
      
      // Dramatic book entrance - zoom in with bounce and rotation
      bookOpacity.value = withTiming(1, { duration: 300 });
      
      // Smooth, polished entrance animation
      bookScale.value = withSequence(
        withTiming(BOOK_CONFIG.ENTRANCE_OVERSHOOT, { 
          duration: ANIMATION_CONFIG.ENTRANCE_DURATION, 
          easing: Easing.bezier(0.2, 0.0, 0.13, 1.0) // Smoother easing curve
        }),
        withSpring(1, { damping: 12, stiffness: 120, mass: 0.7 })
      );
      
      // Subtle 3D rotation for depth
      bookRotationX.value = withSequence(
        withTiming(-8, { duration: 400 }),
        withSpring(0, { damping: 12, stiffness: 150 })
      );
      
      // Glow effect
      glowOpacity.value = withTiming(0.6, { duration: ANIMATION_CONFIG.GLOW_DURATION });
      
      // Start placeholder pulse after book settles
      setTimeout(() => {
        placeholderPulse.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: ANIMATION_CONFIG.PULSE_DURATION }),
            withTiming(1, { duration: ANIMATION_CONFIG.PULSE_DURATION })
          ),
          -1,
          true
        );
        runOnJS(setCurrentState)(BookState.COVER_SELECTION);
      }, ANIMATION_CONFIG.ENTRANCE_DURATION + 200);
      
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Book-like ratio
        quality: 1.0, // Maximum quality for ultra-sharp images
        exif: true, // Preserve image metadata
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
        
        // Dramatic cover fade-in (much slower as requested)
        coverOpacity.value = withTiming(1, { 
          duration: ANIMATION_CONFIG.COVER_FADE_DURATION, 
          easing: Easing.out(Easing.quad) 
        });
        coverScale.value = withSequence(
          withTiming(1.05, { duration: 800 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        );
        
        // Book celebration animation - realistic tilt and bounce
        bookRotationY.value = withSequence(
          withTiming(8, { duration: 300 }),
          withTiming(-3, { duration: 400 }),
          withSpring(0, { damping: 8, stiffness: 120 })
        );
        
        // Enhanced glow effect
        glowOpacity.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 600 })
        );
        
        // Auto-open book after cover is fully applied
        setTimeout(() => {
          openBook();
        }, ANIMATION_CONFIG.COVER_FADE_DURATION + 300);
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
      
      // 3D book opening with realistic perspective
      bookRotationY.value = withTiming(BOOK_CONFIG.MAX_ROTATION_Y, { 
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94)
      });
      
      // Slight book movement like being held
      bookTranslateX.value = withTiming(-screenWidth * 0.03, { 
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 200 
      });
      bookTranslateY.value = withTiming(-screenHeight * 0.01, { 
        duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION - 200 
      });
      
      // FIXED: Natural page flip animation (right to left like turning a book page)
      // Start the page hidden on the right and flip to flat/visible
      pageOpacity.value = withTiming(1, { duration: 200 });
      pageRotationY.value = withSequence(
        withDelay(300, withTiming(0, { 
          duration: ANIMATION_CONFIG.PAGE_FLIP_DURATION,
          easing: Easing.bezier(0.2, 0.0, 0.1, 1.0) // Smoother, more natural easing
        }))
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
    sparkleOpacity, formOpacity, handleError
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

  const pageStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [
      { perspective: 1000 },
      { rotateY: `${pageRotationY.value}deg` },
    ],
  }), [pageOpacity, pageRotationY]);

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
            <Icon name="x" size="xl" color="white" />
          </TouchableOpacity>
        
                <View style={styles.container}>
          {/* Magical sparkles background */}
          <Animated.View style={[styles.sparklesContainer, sparkleStyle]}>
            <View style={[styles.sparkle, styles.sparkle1]} />
            <View style={[styles.sparkle, styles.sparkle2]} />
            <View style={[styles.sparkle, styles.sparkle3]} />
            <View style={[styles.sparkle, styles.sparkle4]} />
            <View style={[styles.sparkle, styles.sparkle5]} />
          </Animated.View>

          <Animated.View style={[styles.bookContainer, bookContainerStyle]}>
            {/* Magical glow effect */}
            <Animated.View style={[styles.glowContainer, glowStyle]}>
              <BlurView intensity={20} style={styles.glowBlur} />
            </Animated.View>

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
                <View style={[styles.bookCover]}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.coverShadow}
                  />
                  
                  <View style={styles.coverContent}>
                    {coverImage ? (
                      <Animated.View style={[styles.coverImageContainer, coverStyle]}>
                        <Image
                          source={{ uri: coverImage }}
                          style={styles.coverImage}
                          contentFit="cover"
                        />
                        {/* Enhanced cover overlay */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
                          style={styles.coverOverlay}
                        />
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
                </View>

                {/* Realistic book page with proper 3D flip */}
                <Animated.View style={[styles.bookPage, pageStyle]}>
                  <View style={styles.pageContent}>
                    {/* Page texture and lines */}
                    <View style={styles.pageLines} />
                    
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
                            <Text style={styles.pageTitle}>Create Your Story</Text>
                            
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Title</Text>
                              <TextInput
                                style={styles.titleInput}
                                placeholder="My Amazing Adventure"
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
    zIndex: 1,
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
    zIndex: 2,
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
    letterSpacing: 0.5,
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
  
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    borderBottomWidth: 2,
    borderBottomColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
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