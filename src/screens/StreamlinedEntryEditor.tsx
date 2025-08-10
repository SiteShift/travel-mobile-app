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
import { TripCreationModal } from '../components/TripCreationModal';
import { MinimalTrip, MinimalMemory } from '../types/tripDetailMinimal';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserTrip {
  id: string;
  title: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function StreamlinedEntryEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string; isVideo?: string; cameraFacing?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState('');
  const [userTrips, setUserTrips] = useState<UserTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<UserTrip | null>(null);
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [showTripCreationModal, setShowTripCreationModal] = useState(false);
  
  const inputOpacity = useSharedValue(0);
  const inputTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const dropdownOpacity = useSharedValue(0);
  const dropdownScale = useSharedValue(0.95);
  
  const videoRef = useRef<Video>(null);

  const isVideo = params.isVideo === 'true';

  // Load user trips from AsyncStorage (only trips created from home page)
  useEffect(() => {
    const loadExistingTrips = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys: string[] = await AsyncStorage.getAllKeys();
        
        // Load trips that were created from the home page (TripCreationModal)
        // These have the pattern 'trip_' and contain the specific structure from home page
        const tripKeys = keys.filter((key: string) => key.startsWith('trip_'));
        
        if (tripKeys.length > 0) {
          const tripData = await AsyncStorage.multiGet(tripKeys);
          const trips: UserTrip[] = tripData
            .map(([key, value]: [string, string | null]) => {
              if (!value) return null;
              try {
                const parsedTrip: any = JSON.parse(value);
                // Validate that this is a trip created from home page with expected structure
                if (parsedTrip.id && parsedTrip.title && parsedTrip.coverImage && parsedTrip.startDate && parsedTrip.endDate) {
                  return {
                    id: parsedTrip.id,
                    title: parsedTrip.title,
                  };
                }
                return null;
              } catch (error) {
                console.error('Error parsing trip data:', error);
                return null;
              }
            })
            .filter((trip: UserTrip | null): trip is UserTrip => trip !== null);
          
          setUserTrips(trips);
        } else {
          setUserTrips([]);
        }
      } catch (error) {
        console.error('Error loading user trips:', error);
        setUserTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    loadExistingTrips();
  }, []);

  // Handle trip creation
  const handleTripCreation = useCallback(async (tripData: {
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
  }) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // Use same ID format as home page
      const tripId = `trip-${Date.now()}`;
      
      // Create the same data structure as home page
      const simpleTrip = {
        id: tripId,
        title: tripData.title,
        description: tripData.description,
        coverImage: tripData.image,
        startDate: tripData.startDate.toISOString(),
        endDate: tripData.endDate.toISOString(),
        country: 'Adventure',
      };
      
      // Use same AsyncStorage key format as home page
      await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(simpleTrip));
      
      // Add to current trips list
      const newTrip: UserTrip = {
        id: tripId,
        title: tripData.title,
      };
      
      setUserTrips([...userTrips, newTrip]);
      setSelectedTrip(newTrip);
      setShowTripCreationModal(false);
      
      console.log('✅ Trip created:', tripData.title);
      
    } catch (error) {
      console.error('❌ StreamlinedEntryEditor: Failed to create trip:', error);
      Alert.alert('Error', 'Failed to create trip');
    }
  }, [userTrips]);

  // Initialize animations
  useEffect(() => {
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

  // Handle keyboard visibility
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

  const handleSave = useCallback(async () => {
    if (!selectedTrip) {
      Alert.alert("📚 Select a Trip", "Please select a trip to add this memory to!");
      return;
    }
    
    if (!params.photoUri) {
      console.error('❌ No photo URI provided');
      Alert.alert("Error", "No photo found. Please try taking the photo again.");
      return;
    }
    
    console.log('🎯 Starting save process with photo:', params.photoUri);
    
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      console.log('🔍 Saving memory to trip:', selectedTrip.id);
      
      // Load the full trip data from storage
      const storedTripData = await AsyncStorage.getItem(`trip_${selectedTrip.id}`);
      
      if (!storedTripData) {
        console.error('❌ Trip not found in storage:', `trip_${selectedTrip.id}`);
        Alert.alert("Error", "Could not find trip data. Please try again.");
        return;
      }
      
      const tripData = JSON.parse(storedTripData);
      console.log('🎯 Loaded trip:', tripData.title);
      
      // Convert to MinimalTrip format if it doesn't exist
      let minimalTrip: MinimalTrip = {
        id: tripData.id,
        title: tripData.title,
        coverImage: tripData.coverImage,
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
        days: tripData.days || [
          {
            day: 1,
            date: new Date(tripData.startDate), // Ensure Date object
            memories: [],
            location: tripData.country || 'Adventure'
          }
        ],
        totalPhotos: tripData.totalPhotos || 0
      };
      
      // If days exist but dates are strings, convert to Date objects
      if (tripData.days) {
        minimalTrip.days = tripData.days.map((day: any) => ({
          ...day,
          date: typeof day.date === 'string' ? new Date(day.date) : day.date,
          memories: day.memories || []
        }));
      }
      
      // Create new memory
      const newMemory: MinimalMemory = {
        id: `mem_${Date.now()}`,
        uri: params.photoUri!,
        thumbnail: params.photoUri!,
        caption: content.trim() || 'A special moment captured',
        timestamp: new Date(),
        aspectRatio: 1 // Default aspect ratio, could be calculated from image
      };
      
      // Find the most recent day (highest day number)
      const mostRecentDay = minimalTrip.days.reduce((latest, current) => {
        return current.day > latest.day ? current : latest;
      }, minimalTrip.days[0]);
      
      // Add memory to the most recent day
      const dayIndex = minimalTrip.days.findIndex((d) => d.day === mostRecentDay.day);
      if (dayIndex !== -1) {
        minimalTrip.days[dayIndex] = {
          ...minimalTrip.days[dayIndex],
          memories: [...minimalTrip.days[dayIndex].memories, newMemory]
        };
      }
      
      // Update total photos count
      minimalTrip.totalPhotos = minimalTrip.days.reduce((total, day) => total + day.memories.length, 0);
      
      // Save the updated trip data back to storage
      const updatedTripData = {
        ...tripData,
        days: minimalTrip.days,
        totalPhotos: minimalTrip.totalPhotos,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(`trip_${selectedTrip.id}`, JSON.stringify(updatedTripData));
      
      console.log('✅ Memory saved to', selectedTrip.title, 'Day', mostRecentDay.day);
      
      Alert.alert(
        "✨ Memory Saved", 
        `Your moment has been added to "${selectedTrip.title}" on Day ${mostRecentDay.day}.`,
        [{ text: "Perfect!", onPress: () => router.back() }]
      );
      
    } catch (error) {
      console.error('❌ StreamlinedEntryEditor: Failed to save memory:', error);
      Alert.alert("Error", "Failed to save memory. Please try again.");
    }
  }, [content, selectedTrip, params.photoUri, router]);

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

  const selectTrip = useCallback((trip: UserTrip) => {
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
              style={[
                styles.media,
                params.cameraFacing === 'front' && styles.frontCameraFlip
              ]}
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
                <Pressable 
                  onPress={userTrips.length > 0 ? toggleTripDropdown : () => setShowTripCreationModal(true)} 
                  style={[
                    styles.tripSelector,
                    { opacity: userTrips.length === 0 ? 0.8 : 1 }
                  ]}
                >
                  <Text style={styles.tripText} numberOfLines={1}>
                    {selectedTrip?.title || (isLoadingTrips ? 'Loading trips...' : 'Select your trip')}
                  </Text>
                  {userTrips.length > 0 && (
                    <Icon 
                      name={showTripDropdown ? "chevron-up" : "chevron-down"} 
                      size="sm" 
                      color="white" 
                    />
                  )}
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
                  {userTrips.length > 0 ? (
                    userTrips.map((trip: UserTrip, index: number) => (
                      <Pressable
                        key={trip.id}
                        onPress={() => selectTrip(trip)}
                        style={[
                          styles.dropdownItem,
                          selectedTrip?.id === trip.id && styles.dropdownItemSelected,
                          index === userTrips.length - 1 && styles.dropdownItemLast
                        ]}
                      >
                        <Text style={[
                          styles.dropdownText,
                          selectedTrip?.id === trip.id && styles.dropdownTextSelected
                        ]}>
                          {trip.title}
                    </Text>
                        {selectedTrip?.id === trip.id && (
                          <Icon name="check" size="sm" color="white" />
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <Pressable 
                      style={[styles.dropdownItem, styles.createTripButton]}
                      onPress={() => {
                        setShowTripDropdown(false);
                        setShowTripCreationModal(true);
                      }}
                    >
                      <Icon name="plus" size="sm" color="#007AFF" />
                      <Text style={[styles.dropdownText, { marginLeft: 8, color: '#007AFF' }]}>
                        Create new trip
                      </Text>
                    </Pressable>
                  )}
                </BlurView>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View style={[styles.saveButtonContainer, saveButtonStyle]}>
          <AnimatedPressable
          onPress={handleSave} 
            disabled={!selectedTrip || isLoadingTrips}
            style={({ pressed }) => [
            styles.saveButton,
              { 
                opacity: (!selectedTrip || isLoadingTrips) ? 0.5 : (pressed ? 0.8 : 1)
              }
            ]}
          >
            <View style={styles.saveButtonPill}>
              <Text style={styles.saveButtonText}>
                {isLoadingTrips ? 'Loading...' : 'Save Memory'}
              </Text>
      </View>
          </AnimatedPressable>
        </Animated.View>
      </KeyboardAvoidingView>
      <TripCreationModal
        visible={showTripCreationModal}
        onClose={() => setShowTripCreationModal(false)}
        onCreateTrip={handleTripCreation}
      />
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
  frontCameraFlip: {
    transform: [{ scaleX: -1 }],
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
  createTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginTop: 8,
  },
}); 