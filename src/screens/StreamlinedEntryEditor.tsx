import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Pressable,
  Animated as RNAnimated,
  StatusBar as RNStatusBar,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock trips data
const mockTrips = [
  { id: '1', name: 'California Road Trip' },
  { id: '2', name: 'European Adventure' },
  { id: '3', name: 'Polish Mountains' },
  { id: '4', name: 'Japan Discovery' },
  { id: '5', name: 'Italian Getaway' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function StreamlinedEntryEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string; isVideo?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(mockTrips[0]);
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const inputOpacity = useSharedValue(0);
  const inputTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const dropdownOpacity = useSharedValue(0);
  const dropdownScale = useSharedValue(0.95);
  
  const videoRef = useRef<Video>(null);

  const isVideo = params.isVideo === 'true';

  useEffect(() => {
    'worklet';
    // A slight delay to ensure the screen is fully ready before animating
    setTimeout(() => {
      inputOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
      inputTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
      });

      buttonOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
      buttonTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
      });
    }, 50);
  }, []);

  // Keyboard handling
  useEffect(() => {
    const showListener = () => {
      setKeyboardVisible(true);
    };
    
    const hideListener = () => {
      setKeyboardVisible(false);
    };

    if (Platform.OS === 'ios') {
      const keyboardWillShow = Keyboard.addListener('keyboardWillShow', showListener);
      const keyboardWillHide = Keyboard.addListener('keyboardWillHide', hideListener);
      return () => {
        keyboardWillShow?.remove();
        keyboardWillHide?.remove();
      };
    }
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSave = useCallback(() => {
    if (!content.trim()) {
      Alert.alert("✍️ Add your note", "Tell us about this moment!");
      return;
    }
    
    Alert.alert(
      "✨ Memory Saved", 
      "Your moment has been added to your journal.",
      [{ text: "Perfect!", onPress: () => router.back() }]
    );
  }, [content, router]);

  const toggleTripDropdown = useCallback(() => {
    const newState = !showTripDropdown;
    setShowTripDropdown(newState);
    
    if (newState) {
      dropdownOpacity.value = withSpring(1);
      dropdownScale.value = withSpring(1);
    } else {
      dropdownOpacity.value = withTiming(0);
      dropdownScale.value = withTiming(0.95);
    }
  }, [showTripDropdown]);

  const selectTrip = useCallback((trip: typeof mockTrips[0]) => {
    setSelectedTrip(trip);
    toggleTripDropdown();
  }, [toggleTripDropdown]);

  // Animated styles
  const inputContainerStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const saveButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value,
    transform: [{ scale: dropdownScale.value }],
  }));

  return (
    <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Full Screen Media */}
        {params.photoUri && (
          <View style={styles.mediaContainer}>
            {isVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: params.photoUri }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={true}
                isLooping={true}
                isMuted={false}
              />
            ) : (
            <Image 
              source={{ uri: params.photoUri }} 
              style={styles.media}
              contentFit="cover"
            />
          )}
          

          </View>
        )}

      {/* Close Button */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <BlurView intensity={40} style={styles.closeButtonBlur}>
            <Icon name="close" size="lg" color="white" />
          </BlurView>
        </Pressable>
      </View>

      {/* Glass Morphism Input Container */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomContainer}
      >
        <Animated.View style={inputContainerStyle}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <BlurView intensity={40} style={styles.inputBlur}>
                {/* Trip Selector */}
                <Pressable onPress={toggleTripDropdown} style={styles.tripSelector}>
                  <Text style={styles.tripText} numberOfLines={1}>
                    {selectedTrip.name}
                  </Text>
                  <Icon 
                    name={showTripDropdown ? "chevron-up" : "chevron-down"} 
                    size="sm" 
                    color="white" 
                  />
                </Pressable>

                {/* Note Input */}
            <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note about this moment..."
                  placeholderTextColor="#CCCCCC"
              value={content}
                  onChangeText={setContent}
              multiline
                  maxLength={500}
                  selectionColor={colors.primary[500]}
                />
                
                {/* Character count */}
                <Text style={styles.characterCount}>
                  {content.length}/500
                </Text>
              </BlurView>
            </View>
            
            {/* Trip Dropdown */}
            {showTripDropdown && (
              <Animated.View style={[styles.dropdownContainer, dropdownStyle]}>
                <BlurView intensity={40} style={styles.dropdownBlur}>
                  {mockTrips.map((trip, index) => (
                    <Pressable
                      key={trip.id}
                      onPress={() => selectTrip(trip)}
                      style={[
                        styles.dropdownItem,
                        selectedTrip.id === trip.id && styles.dropdownItemSelected,
                        index === mockTrips.length - 1 && styles.dropdownItemLast
                      ]}
                    >
                      <Text style={[
                        styles.dropdownText,
                        selectedTrip.id === trip.id && styles.dropdownTextSelected
                      ]}>
                        {trip.name}
                  </Text>
                      {selectedTrip.id === trip.id && (
                        <Icon name="check" size="sm" color="white" />
                      )}
                    </Pressable>
                  ))}
                </BlurView>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View style={[styles.saveButtonContainer, saveButtonStyle]}>
          <AnimatedPressable
          onPress={handleSave} 
            style={({ pressed }) => [
            styles.saveButton,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <View style={styles.saveButtonPill}>
              <Text style={styles.saveButtonText}>Save Memory</Text>
      </View>
          </AnimatedPressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 50,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  inputContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputBlur: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 48,
    elevation: 24,
  },
  tripSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  tripText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  noteInput: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  characterCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },

  saveButtonContainer: {
    marginBottom: 34,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
  },
  saveButtonPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: SCREEN_WIDTH - 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dropdownContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownBlur: {
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 48,
    elevation: 24,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItemLast: {
    // No additional styles needed for last item
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
  dropdownTextSelected: {
    fontWeight: '600',
  },
}); 