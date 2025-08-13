import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Animated,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
import { Easing } from 'react-native';
import { LevelLightbox } from '../../src/components/LevelLightbox';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';
import { TripCreationModal } from '../../src/components/TripCreationModal';
import { AnimatedBookCreation } from '../../src/components/AnimatedBookCreation';
import { MediaPicker, MediaItem } from '../../src/components/MediaPicker';
import { FONT_WEIGHTS, SPACING, BORDER_RADIUS, EMOTIONAL_GRADIENTS } from '../../src/constants/theme';
import * as Haptics from 'expo-haptics';
import { getMockDataForUser } from '../../src/data/mockData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Trip data structure supporting both real trips and placeholders
interface Trip {
  id: string;
  type: 'real' | 'placeholder';
  title: string;
  description?: string;
  image?: any;
  buttonText: string;
  gradient?: string[];
  country?: string;
  blurhash?: string;
  dates?: {
    start: string;
    end: string;
  };
  isEditing?: boolean;
  // Fields needed for trip detail screen
  coverImage?: string;
  startDate?: Date;
  endDate?: Date;
}

// Start with empty user experience - 3 placeholder cards
const createPlaceholderTrips = (): Trip[] => [
  {
    id: 'placeholder-1',
    type: 'placeholder',
    title: 'Create Book',
    buttonText: 'Add Trip',
  },
  {
    id: 'placeholder-2', 
    type: 'placeholder',
    title: 'Create Book',
    buttonText: 'Add Trip',
  },
  {
    id: 'placeholder-3',
    type: 'placeholder', 
    title: 'Create Book',
    buttonText: 'Add Trip',
  },
];

const CARD_WIDTH = screenWidth * 0.77;
const SPACING_VALUE = SPACING.md;
const ITEM_SPACING = screenWidth * 0.72;
const CARD_HEIGHT = screenHeight * 0.62;
const BUTTON_HEIGHT = 54;

export default function HomeTab() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Animation refs for level pill
  const levelPillScale = useRef(new Animated.Value(1)).current;
  const levelPillShadow = useRef(new Animated.Value(1)).current;
  const badgeShimmer = useRef(new Animated.Value(0)).current;
  const badgeTapShimmer = useRef(new Animated.Value(0)).current;
  const [trips, setTrips] = useState<Trip[]>(createPlaceholderTrips());
  const [data, setData] = useState<Trip[]>([]);
  const [showTripCreationModal, setShowTripCreationModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showTripOptionsModal, setShowTripOptionsModal] = useState(false);
  const [showEditCoverModal, setShowEditCoverModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  
  // Get user level data
  const userData = getMockDataForUser('user1');
  const [userLevel, setUserLevel] = useState<number>(userData.user?.stats.level || 1);
  // Level badge images (static requires for bundler)
  const BADGE1 = require('../../public/assets/Trip Memo Level Badges for home page/level-1-level-badge_compressed.webp');
  const LEVEL_BADGES: Record<number, any> = {
    // Prefer special badge set; fallback to existing set if not present
    1: BADGE1,
    2: require('../../public/assets/Trip Memo Level Badges for home page/level-2-level-badge_compressed.webp'),
    3: require('../../public/assets/Trip Memo Level Badges for home page/level-3-level-badge_compressed.webp'),
    4: require('../../public/assets/Trip Memo Level Badges for home page/level-4-level-badge_compressed.webp'),
    5: require('../../public/assets/Trip Memo Level Badges for home page/level-5-level-badge_compressed.webp'),
    6: require('../../public/assets/Trip Memo Level Badges for home page/level-6-level-badge_compressed.webp'),
    7: require('../../public/assets/Trip Memo Level Badges for home page/level-7-level-badge_compressed.webp'),
    8: require('../../public/assets/Trip Memo Level Badges for home page/level-8-level-badge_compressed.webp'),
    9: require('../../public/assets/Trip Memo Level Badges for home page/level-9-level-badge_compressed.webp'),
    10: require('../../public/assets/Trip Memo Level Badges for home page/level-10-level-badge_compressed.webp'),
  };

  // Levels system data
  const levelsData = [
    { level: 1, name: 'Wanderer', character: '🚶‍♂️', unlocked: userLevel >= 1, description: 'Starting your journey', color: '#FF6B6B' },
    { level: 2, name: 'Explorer', character: '🧭', unlocked: userLevel >= 2, description: 'Finding new paths', color: '#FF8A65' },
    { level: 3, name: 'Adventurer', character: '🎒', unlocked: userLevel >= 3, description: 'Ready for anything', color: '#FFB74D' },
    { level: 4, name: 'Voyager', character: '⛵', unlocked: userLevel >= 4, description: 'Sailing to new horizons', color: '#81C784' },
    { level: 5, name: 'Nomad', character: '🏕️', unlocked: userLevel >= 5, description: 'Home is where you are', color: '#64B5F6' },
    { level: 6, name: 'Globetrotter', character: '🌍', unlocked: userLevel >= 6, description: 'Conquering continents', color: '#BA68C8' },
    { level: 7, name: 'Legend', character: '👑', unlocked: userLevel >= 7, description: 'Master of all journeys', color: '#FFD54F' },
    { level: 8, name: 'Mythic', character: '🌟', unlocked: userLevel >= 8, description: 'Beyond ordinary travel', color: '#F48FB1' },
  ];

  // Dynamic trip management
  const updateTripsData = useCallback((newTrips: Trip[]) => {
    const realTrips = newTrips.filter(t => t.type === 'real');
    const placeholderCount = Math.max(3, realTrips.length + 1);
    
    // Create placeholders to ensure we always have the right number
    const placeholders: Trip[] = [];
    for (let i = 0; i < placeholderCount; i++) {
      placeholders.push({
        id: `placeholder-${i + 1}`,
        type: 'placeholder',
        title: 'Create Book',
        buttonText: 'Add Trip',
      });
    }
    
    // If we have real trips, replace placeholders with real trips
    const finalTrips = [...realTrips, ...placeholders.slice(realTrips.length)];
    
    setTrips(finalTrips);
    
    // Create infinite scroll data
    const infiniteData = [...finalTrips, ...finalTrips, ...finalTrips];
    setData(infiniteData);
  }, []);

  useEffect(() => {
    updateTripsData(trips);
  }, []);

  // Load existing trips from AsyncStorage on mount and when returning to screen
  useFocusEffect(
    useCallback(() => {
      const loadExistingTrips = async () => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const keys: string[] = await AsyncStorage.getAllKeys();
          const tripKeys = keys.filter((key: string) => key.startsWith('trip_'));
          
          if (tripKeys.length > 0) {
            const tripData = await AsyncStorage.multiGet(tripKeys);
            const existingTrips: Trip[] = tripData
              .map(([key, value]: [string, string | null]) => {
                if (!value) return null;
                try {
                  const parsedTrip: any = JSON.parse(value);
                  
                  if (parsedTrip.id && parsedTrip.title && parsedTrip.coverImage) {
                    const trip = {
                      id: parsedTrip.id,
                      type: 'real' as const,
                      title: parsedTrip.title,
                      description: parsedTrip.description || '',
                      image: parsedTrip.coverImage,
                      buttonText: 'View Trip',
                      country: parsedTrip.country || 'Adventure',
                      coverImage: parsedTrip.coverImage,
                      startDate: new Date(parsedTrip.startDate),
                      endDate: new Date(parsedTrip.endDate),
                    };
                    return trip;
                  }
                  return null;
                } catch (error) {
                  console.error('❌ HomePage: Error parsing trip data:', error);
                  return null;
                }
              })
              .filter((trip: Trip | null): trip is Trip => trip !== null);
            
            if (existingTrips.length > 0) {
              // Update trips with existing data
              updateTripsData(existingTrips);
            }
            // Also refresh leveling state on focus
            try {
              const leveling = require('../../src/utils/leveling');
              const state = await leveling.getLevelingState();
              const lvl = leveling.computeLevelFromXp(state.xp);
              setUserLevel(lvl);
            } catch {}
          }
        } catch (error) {
          console.error('❌ HomePage: Error loading existing trips:', error);
        }
      };

      loadExistingTrips();
    }, [updateTripsData])
  );

  useEffect(() => {
    if (data.length > 0) {
      const initialOffset = trips.length * ITEM_SPACING;
      scrollX.setValue(initialOffset);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialOffset,
          animated: false,
        });
      }, 100);
    }
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [data, trips.length, isDark]);

  const handleTripPress = useCallback((trip: Trip) => {
    // Add gentle haptic feedback for emotional connection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
      if (trip.type === 'placeholder') {
      // Show trip creation modal
      handleCreateTrip();
    } else {
      // Navigate to existing trip
      console.log('Trip pressed:', trip.title);
      router.push(`/trip/${trip.id}`);
    }
  }, [router]);

  const handleCreateTrip = useCallback(() => {
    setShowTripCreationModal(true);
  }, []);

  const handleTripOptions = useCallback((tripId: string) => {
    // Add subtle haptic feedback for menu interaction
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTripId(tripId);
    setShowTripOptionsModal(true);
  }, []);

  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTripId) return;
    
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem(`trip_${selectedTripId}`);
              
              // Remove from trips array
              const updatedTrips = trips.filter(trip => trip.id !== selectedTripId);
              updateTripsData(updatedTrips.filter(t => t.type === 'real'));
              
              setShowTripOptionsModal(false);
              setSelectedTripId(null);
              
              console.log('✅ Trip deleted successfully:', selectedTripId);
            } catch (error) {
              console.error('❌ Error deleting trip:', error);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            }
          },
        },
      ]
    );
  }, [selectedTripId, trips, updateTripsData]);

  const handleEditCover = useCallback(() => {
    setShowTripOptionsModal(false);
    // Keep selectedTripId for updating the cover later
    setShowEditCoverModal(true);
  }, []);

  const handleCoverImageSelect = useCallback(async (media: MediaItem[]) => {
    if (!selectedTripId || media.length === 0) return;

    const newCoverImage = media[0].uri;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Update AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const existingData = await AsyncStorage.getItem(`trip_${selectedTripId}`);
      
      if (existingData) {
        const tripData = JSON.parse(existingData);
        tripData.coverImage = newCoverImage;
        await AsyncStorage.setItem(`trip_${selectedTripId}`, JSON.stringify(tripData));
        
        // Update local state
        setTrips(prevTrips => 
          prevTrips.map(trip => {
            if (trip.id === selectedTripId) {
              return {
                ...trip,
                image: { uri: newCoverImage },
                coverImage: newCoverImage,
              };
            }
            return trip;
          })
        );

        setData(prevData => 
          prevData.map(trip => {
            if (trip.id === selectedTripId) {
              return {
                ...trip,
                image: { uri: newCoverImage },
                coverImage: newCoverImage,
              };
            }
            return trip;
          })
        );

        console.log('✅ Cover image updated successfully for trip:', selectedTripId);
        Alert.alert('Success', 'Cover image updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating cover image:', error);
      Alert.alert('Error', 'Failed to update cover image. Please try again.');
    } finally {
      setShowEditCoverModal(false);
      setSelectedTripId(null);
    }
  }, [selectedTripId]);

  const handleTripCreation = useCallback(async (tripData: {
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
  }) => {
    const tripId = `trip-${Date.now()}`;
    
    const newTrip: Trip = {
      id: tripId,
      type: 'real',
      title: tripData.title,
      description: tripData.description,
      image: { uri: tripData.image },
      buttonText: 'View Trip',
      gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'],
      country: 'Adventure',
      blurhash: 'LGF5?xYk^6#M@-5c,1J5Or]0Rj',
      dates: {
        start: tripData.startDate.toISOString(),
        end: tripData.endDate.toISOString(),
      },
      // Add fields needed for trip detail screen
      coverImage: tripData.image,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
    };
    
    // Save to storage for trip detail screen (using simple structure)
    try {
      // Use AsyncStorage directly for simple key-value storage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const simpleTrip = {
        id: tripId,
        title: tripData.title,
        description: tripData.description,
        coverImage: tripData.image,
        startDate: tripData.startDate.toISOString(),
        endDate: tripData.endDate.toISOString(),
        country: 'Adventure',
      };
      
      await AsyncStorage.setItem(`trip_${tripId}`, JSON.stringify(simpleTrip));
      // Leveling: award XP for creating a trip and progress mission
      try {
        const leveling = require('../../src/utils/leveling');
        await leveling.awardTripCreated();
        await leveling.progressMission('add_3_trips', 1);
        const state = await leveling.getLevelingState();
        const lvl = leveling.computeLevelFromXp(state.xp);
        setUserLevel(lvl);
      } catch {}
    } catch (error) {
      console.error('❌ HomePage: Failed to save trip to storage:', error);
    }
    
    const realTrips = trips.filter(t => t.type === 'real');
    updateTripsData([...realTrips, newTrip]);
    setShowTripCreationModal(false);
    console.log('✅ Trip created:', tripData.title);
  }, [trips, updateTripsData]);
  
  const onMomentumScrollEnd = useCallback((event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_SPACING);
    if (newIndex <= 1 || newIndex >= data.length - 2) {
      const targetIndex = trips.length + (newIndex % trips.length);
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
    }
  }, [data.length, trips.length]);

  const TripCard = React.memo(({ index }: { index: number }) => {
    const trip = data[index];
    if (!trip) return null;

    const inputRange = [
      (index - 1) * ITEM_SPACING,
      index * ITEM_SPACING,
      (index + 1) * ITEM_SPACING,
    ];

    const rotateY = scrollX.interpolate({ 
      inputRange, 
      outputRange: ['40deg', '0deg', '-40deg'], 
      extrapolate: 'clamp' 
    });
    
    const scale = scrollX.interpolate({ 
      inputRange, 
      outputRange: [0.8, 1, 0.8], 
      extrapolate: 'clamp' 
    });
    
    const buttonOpacity = scrollX.interpolate({ 
      inputRange, 
      outputRange: [0, 1, 0], 
      extrapolate: 'clamp' 
    });
    
    const buttonTranslateY = scrollX.interpolate({ 
      inputRange, 
      outputRange: [50, 0, 50], 
      extrapolate: 'clamp' 
    });

    const unifiedTransform = {
      transform: [{ perspective: 1000 }, { rotateY }, { scale }],
    };

    if (trip.type === 'placeholder') {
      // Anticipation: press scale for the card
      const pressScale = useRef(new Animated.Value(1)).current;
      const onPressIn = () => {
        Animated.timing(pressScale, {
          toValue: 0.98,
          duration: 90,
          useNativeDriver: true,
        }).start();
      };
      const onPressOut = () => {
        Animated.timing(pressScale, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }).start();
      };
      const cardPress = () => {
        // Small delay so the scale is perceptible
        setTimeout(() => handleTripPress(trip), 60);
      };
        return (
          <View style={styles.itemContainer}>
            <Animated.View style={[styles.unifiedWrapper, unifiedTransform, { transform: [...(unifiedTransform as any).transform, { scale: pressScale }] }]}> 
              <Pressable 
                style={[
                  styles.tripCard, 
                  styles.placeholderCard, 
                  { 
                    backgroundColor: 'transparent',
                    // No border, no rounding, no clipping behind image
                    borderColor: 'transparent',
                    borderWidth: 0,
                    borderRadius: 0,
                    overflow: 'visible',
                    // Make shadow very subtle for placeholder
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 3,
                  }
                ]} 
              onPress={cardPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              accessibilityLabel="Add Trip"
            >
              {/* Blank book image replacing dotted outline */}
                <Image 
                  source={require('../../public/assets/Blank-trip-image.webp')}
                  style={[StyleSheet.absoluteFillObject as any, { borderRadius: 0 }]}
                  contentFit="cover"
                  transition={200}
                />

              {/* Centered overlay content */}
              <View style={[styles.placeholderContent, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                <LinearGradient
                  colors={['#fff0f3', '#fce7f3']}
                  style={styles.plusIconContainer}
                >
                  <Icon name="plus" size="xl" color={colors.primary[600]} />
                </LinearGradient>
                <Text style={[styles.placeholderTitle, { color: colors.text.primary }]}>
                  {trip.title}
                </Text>
                <Text style={[styles.placeholderSubtitle, { color: colors.text.secondary }]}>
                  Save your memories
                </Text>
              </View>
            </Pressable>
              
          </Animated.View>
        </View>
      );
    }

    // Real trip card
    return (
      <View style={styles.itemContainer}>
        <Animated.View style={[styles.unifiedWrapper, unifiedTransform]}>
          {/* Outer right cast shadow on background (behind the book) */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
            locations={[0, 0.18, 0.72, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.outerRightShadow}
            pointerEvents="none"
          />
          
          <Pressable style={styles.tripCard} onPress={() => handleTripPress(trip)}>
            <Image 
              source={trip.image} 
              placeholder={{ blurhash: trip.blurhash }} 
              style={styles.tripImage} 
              contentFit="cover" 
              transition={0} 
            />
            {/* Subtle inward spine shadow from the left edge */}
            <LinearGradient
              colors={["rgba(0,0,0,0.24)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.leftInnerShadow}
              pointerEvents="none"
            />
            {/* Book spine overlay on top of the image (no corner rounding) */}
            <Image
              source={require('../../public/assets/NEW-trip-shadow-overlay.webp')}
              style={styles.bookSpineOverlay}
              contentFit="cover"
              transition={0}
              pointerEvents="none"
            />
            {/* Removed outline border */}
            <LinearGradient 
              colors={trip.gradient as any || ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} 
              style={styles.gradientOverlay} 
            />
            
            {/* Three-dot menu button */}
            <TouchableOpacity 
              style={styles.tripOptionsButton}
              onPress={() => handleTripOptions(trip.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.tripOptionsButtonBackground, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                <Icon name="ellipsis-horizontal" size="sm" color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.cardContent}>
              <Text style={styles.tripTitle} numberOfLines={1}>
                {trip.title}
              </Text>
              <Text style={styles.tripDescription}>
                {trip.description}
              </Text>
            </View>
          </Pressable>
          
          {/* Removed 'View Trip' floating button for cleaner look */}
        </Animated.View>
      </View>
    );
  });

  const renderDots = () => {
    if (trips.length === 0) return null;
    
    return (
      <View style={styles.dotsContainer}>
        <View style={[styles.dotsWrapper]}>
          {trips.map((_, index) => {
            const createInputRange = (baseIndex: number) => [
              (baseIndex - 1) * ITEM_SPACING,
              baseIndex * ITEM_SPACING,
              (baseIndex + 1) * ITEM_SPACING,
            ];

            const inputRanges = [
              createInputRange(index),
              createInputRange(index + trips.length),
              createInputRange(index + trips.length * 2),
            ];

            const dotOpacity = scrollX.interpolate({
              inputRange: inputRanges.flat(),
              outputRange: [0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5],
              extrapolate: 'clamp',
            });

            const dotScale = scrollX.interpolate({
              inputRange: inputRanges.flat(),
              outputRange: [1, 1.4, 1, 1, 1.4, 1, 1, 1.4, 1],
              extrapolate: 'clamp',
            });

            const activeDotOpacity = scrollX.interpolate({
              inputRange: inputRanges.flat(),
              outputRange: [0, 1, 0, 0, 1, 0, 0, 1, 0],
              extrapolate: 'clamp',
            });

            return (
              <View key={index} style={styles.dotContainer}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      opacity: dotOpacity,
                      transform: [{ scale: dotScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.activeDot,
                    {
                      opacity: activeDotOpacity,
                      transform: [{ scale: dotScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isDark ? ['#ffffff', '#e5e5e5'] : ['#000000', '#333333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dotGradient}
                  />
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTripMemo = () => (
    <View style={styles.tripMemoContainer}>
      <Image
        source={require('../../public/assets/TripMemo-parrot-logo-Photoroom_compressed.webp')}
        style={styles.tripMemoLogo}
        resizeMode="contain"
      />
      <Text style={[styles.tripMemoText, { color: colors.text.primary }]}>
        TripMemo
      </Text>
    </View>
  );

  const handleLevelPillPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.timing(levelPillScale, {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(levelPillShadow, {
        toValue: 0.4,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLevelPillPressOut = () => {
    Animated.parallel([
      Animated.spring(levelPillScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.timing(levelPillShadow, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Slow, periodic shimmer across the badge (every ~10s)
  useEffect(() => {
    let isCancelled = false;
    const loop = () => {
      if (isCancelled) return;
      badgeShimmer.setValue(0);
      Animated.sequence([
        Animated.delay(2000), // small initial delay after mount/return
        Animated.timing(badgeShimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.delay(8000), // rest period
      ]).start(() => {
        if (!isCancelled) loop();
      });
    };
    loop();
    return () => { isCancelled = true; };
  }, [badgeShimmer]);

  const handleLevelPillPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Ensure button returns to normal state after press
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(levelPillScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }),
        Animated.timing(levelPillShadow, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 50);
    
    // Quick white shimmer sweep across the badge on tap
    badgeTapShimmer.setValue(0);
    Animated.timing(badgeTapShimmer, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.cubic),
    }).start(() => {
      badgeTapShimmer.setValue(0);
    });

    setShowLevelsModal(true);
  };

  const renderLevelIndicator = () => (
    <View style={styles.levelIndicatorContainer}>
      <Animated.View 
        style={[
          styles.levelIndicatorAnimatedWrapper,
          {
            opacity: levelPillShadow,
            transform: [{ scale: levelPillScale }],
          },
        ]}
      >
        <TouchableOpacity 
          style={[styles.levelIndicatorWrapper, { backgroundColor: colors.surface.tertiary }]}
          onPress={handleLevelPillPress}
          onPressIn={handleLevelPillPressIn}
          onPressOut={handleLevelPillPressOut}
          activeOpacity={1}
        >
          <View style={styles.levelContent}>
            <View style={styles.levelBadgeContainer}>
              <Image
                source={LEVEL_BADGES[userLevel] || LEVEL_BADGES[1]}
                style={styles.levelBadgeImage}
                contentFit="contain"
              />
              <View pointerEvents="none" style={styles.levelBadgeInnerStroke} />
              <AnimatedLinearGradient
                pointerEvents="none"
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.55)',
                  'rgba(255,255,255,0)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.levelBadgeShimmer,
                  {
                    transform: [{
                      translateX: badgeShimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 40],
                      })
                    }],
                  }
                ]}
              />
              <AnimatedLinearGradient
                pointerEvents="none"
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.85)',
                  'rgba(255,255,255,0)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.levelBadgeShimmer,
                  {
                    opacity: 0.6,
                    transform: [{
                      translateX: badgeTapShimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 40],
                      })
                    }],
                  }
                ]}
              />
            </View>
            <View style={styles.levelTextContainer}>
              <Text style={[styles.levelNumber, { color: colors.text.primary }]}>
                {`Level ${userLevel}`}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  const renderLevelsModal = () => (
    <LevelLightbox
      visible={showLevelsModal}
      onClose={() => setShowLevelsModal(false)}
      initialIndex={Math.max(0, (userLevel || 1) - 1)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]} pointerEvents={showTripCreationModal ? 'none' : 'auto'}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background.primary} 
      />

      {/* TripMemo Brand */}
      {renderTripMemo()}

      {/* Dots Indicator */}
      {renderDots()}

      {/* Level Indicator */}
      {renderLevelIndicator()}

      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={({ index }) => <TripCard index={index} />}
        keyExtractor={(item, index) => `${item?.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_SPACING}
        decelerationRate="fast"
        contentContainerStyle={{ 
          paddingHorizontal: (screenWidth - ITEM_SPACING) / 2,
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }], 
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({ 
          length: ITEM_SPACING, 
          offset: ITEM_SPACING * index, 
          index 
        })}
        style={styles.carousel}
        // Performance optimizations
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        windowSize={5}
        removeClippedSubviews={false}
        updateCellsBatchingPeriod={100}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
      
      {/* Trip Creation Modal */}
      <AnimatedBookCreation
        visible={showTripCreationModal}
        onClose={() => setShowTripCreationModal(false)}
        onCreateTrip={handleTripCreation}
      />
      
      {/* Trip Options Modal */}
      <Modal
        visible={showTripOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTripOptionsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTripOptionsModal(false)}
        >
          <View style={[styles.tripOptionsModal, { backgroundColor: colors.surface.primary }]}>
            <TouchableOpacity 
              style={[styles.tripOptionItem, { borderBottomColor: colors.border.primary }]}
              onPress={handleEditCover}
            >
              <Icon name="image" size="md" color={colors.text.primary} />
              <Text style={[styles.tripOptionText, { color: colors.text.primary }]}>
                Edit Cover
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tripOptionItem, { borderBottomWidth: 0 }]}
              onPress={handleDeleteTrip}
            >
              <Icon name="trash-outline" size="md" color={colors.error[500]} />
              <Text style={[styles.tripOptionText, { color: colors.error[500] }]}>
                Delete Trip
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      {/* Edit Cover Media Picker */}
      <MediaPicker
        visible={showEditCoverModal}
        onClose={() => {
          setShowEditCoverModal(false);
          setSelectedTripId(null);
        }}
        onMediaSelect={handleCoverImageSelect}
        maxSelection={1}
        allowsEditing={true}
        includeVideos={false}
        showCamera={true}
        showLibrary={true}
      />
      
      {/* Levels Modal */}
      {renderLevelsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  // Levels pager modal styles
  levelsPagerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  levelsPagerClose: {
    position: 'absolute',
    top: screenHeight * 0.06,
    right: SPACING.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  levelPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPageGradient: {
    ...StyleSheet.absoluteFillObject as any,
  },
  levelPageContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  levelPageCharacter: {
    fontSize: 84,
    marginBottom: SPACING.md,
  },
  levelPageTitle: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: 'Merienda',
    color: 'white',
    letterSpacing: -1,
  },
  levelPageName: {
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.semibold,
    color: 'white',
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  levelPageDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  levelBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 1,
    color: 'white'
  },
  levelsPagerDots: {
    position: 'absolute',
    bottom: screenHeight * 0.08,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  levelsPagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  levelsPagerDotActive: {
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  dotsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: screenHeight * 0.125, // Moved very slightly down from 0.12 to 0.125
    left: 0,
    right: 0,
    zIndex: 10,
    height: 40, // Reduced from 50 to 40 for smaller container
  },
  dotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // Removed all container styling - no padding, background, shadows, etc.
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs, // Small spacing for subtle dots
    position: 'relative',
  },
  dot: {
    width: 6, // Small, subtle dots
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  activeDot: {
    position: 'absolute',
    width: 6, // Small, subtle dots
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  carousel: {
    flex: 1,
    marginTop: screenHeight * -0.002,
  },
  itemContainer: {
    width: ITEM_SPACING,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + (BUTTON_HEIGHT / 2),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tripCard: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderCard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    // Enhanced 3D effect for placeholder cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  dottedBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  plusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    // Add subtle border for 3D effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'Merienda',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  tripImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  imageBorder: {
    // removed; kept for reference in case reintroduced later
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 6,
    zIndex: 2,
  },
  // Spine overlay across the entire card surface above the image
  bookSpineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Match the image’s rounding exactly
    borderRadius: 6,
    zIndex: 4,
  },
  // Subtle right-side vertical shadow as tall as the image
  rightShadowOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 28,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 3,
  },
  // Outer background shadow to the right of the card (fades onto background)
  outerRightShadow: {
    position: 'absolute',
    top: 0,
    height: CARD_HEIGHT,
    right: -18,
    width: 40,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 0,
  },
  leftInnerShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 22,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 3,
  },
  // Very subtle inner/right-edge shadow to suggest page thickness
  rightEdgeShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 18,
    // Use a vertical gradient-like effect using shadow via a semi-transparent view
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // Add a faint dark edge inside the right side
    borderLeftWidth: 0,
    zIndex: 1,
  },
  tripOptionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 4,
  },
  tripOptionsButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    position: 'absolute',
    bottom: 35,
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    zIndex: 3,
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 32,
    fontWeight: '400',
    fontFamily: 'Merienda',
    letterSpacing: -1.5,
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tripDescription: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.light,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  tripButton: {
    borderRadius: 100,
    minWidth: 140,
    height: BUTTON_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    // Add subtle border for 3D effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tripButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 100,
    minWidth: 140,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    // Add inner 3D effect
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  tripButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }, { translateY: 2 }],
  },
  tripButtonText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
    // Add subtle text shadow for 3D effect
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelIndicatorContainer: {
    position: 'absolute',
    top: screenHeight * 0.073,
    right: SPACING.md - 4,
    zIndex: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIndicatorAnimatedWrapper: {
    // Subtle 3D shadow for animated wrapper
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: 100,
  },
  levelIndicatorWrapper: {
    paddingVertical: SPACING.xs,
    // Asymmetric padding to visually nudge contents left within the pill
    paddingLeft: SPACING.md,
    paddingRight: SPACING.lg,
    borderRadius: 100,
    // Very subtle 3D effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    // Very subtle border for minimal depth
    borderWidth: 0.3,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    transform: [{ translateX: -4 }],
  },
  levelBadgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  levelBadgeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  levelBadgeInnerStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  levelBadgeShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 26,
    opacity: 0.35,
    transform: [{ rotate: '18deg' }],
  },
  adventureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Very subtle 3D shadow effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    // Very subtle border
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  adventureIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    // Very subtle inner shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // Very subtle inner border
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  levelTextContainer: {
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Merienda',
    letterSpacing: -0.3,
  },
  levelText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Merienda',
    letterSpacing: -0.5,
  },
  tripMemoContainer: {
    position: 'absolute',
    top: screenHeight * 0.073,
    left: SPACING.md - 8, // Moved further to the left
    zIndex: 10,
    height: 50,
    flexDirection: 'row', // Add flexDirection row
    alignItems: 'center', // Center align items vertically
    justifyContent: 'flex-start', // Align to the left
  },
  tripMemoText: {
    fontSize: 22, // Increased from 20 to 22 for slightly bigger text
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: 'Merienda',
    letterSpacing: -1, // Kept tight letter spacing
  },
  tripMemoLogo: {
    width: 44, // Increased from 40 to 44 for slightly bigger logo
    height: 44, // Increased from 40 to 44 for slightly bigger logo
    marginRight: -6, // Increased negative margin to reduce space between logo and text
  },
  bookPagesContainer: {
    position: 'absolute',
    top: 0,
    right: -8, // Slightly less extension
    width: CARD_WIDTH * 0.12, // Narrower for more subtlety
    height: CARD_HEIGHT,
    zIndex: 0, // Behind the main card
  },
  bookPage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    opacity: 0.5,
  },
  bookPage1: {
    right: 0,
    transform: [{ translateX: 0 }],
    zIndex: 3,
  },
  bookPage2: {
    right: -3,
    transform: [{ translateX: 0 }],
    zIndex: 2,
    opacity: 0.4,
  },
  bookPage3: {
    right: -6,
    transform: [{ translateX: 0 }],
    zIndex: 1,
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripOptionsModal: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  tripOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  tripOptionText: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    marginLeft: SPACING.md,
  },
  // Levels Modal Styles
  levelsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  levelsModalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  levelsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  levelsModalTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: 'Merienda',
  },
  levelsModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  levelsProgressContainer: {
    marginBottom: SPACING.xl,
  },
  levelsProgressText: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  levelsProgressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelsProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  levelsGrid: {
    paddingHorizontal: SPACING.xs,
  },
  levelCard: {
    flex: 0.5,
    margin: SPACING.xs,
  },
  levelCardGradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  levelCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCardCharacter: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  levelCardLevel: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  levelCardName: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  levelCardDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  levelCardUnlockedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  levelCardUnlockedText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
}); 