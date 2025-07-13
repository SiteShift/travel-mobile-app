import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Animated,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';
import { TripCreationModal } from '../../src/components/TripCreationModal';
import { FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
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
    title: 'Create Your Book',
    buttonText: 'Add Trip',
  },
  {
    id: 'placeholder-2', 
    type: 'placeholder',
    title: 'Log Your Adventures',
    buttonText: 'Add Trip',
  },
  {
    id: 'placeholder-3',
    type: 'placeholder', 
    title: 'Dream Big & Explore',
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
  const [trips, setTrips] = useState<Trip[]>(createPlaceholderTrips());
  const [data, setData] = useState<Trip[]>([]);
  const [showTripCreationModal, setShowTripCreationModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showTripOptionsModal, setShowTripOptionsModal] = useState(false);
  
  // Get user level data
  const userData = getMockDataForUser('user1');
  const userLevel = userData.user?.stats.level || 1;

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
        title: i === 0 ? 'Create Your Book' : i === 1 ? 'Log Your Adventures' : 'Dream Big & Explore',
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
    setSelectedTripId(null);
    // TODO: Implement edit cover functionality
    Alert.alert('Coming Soon', 'Edit cover functionality will be available soon!');
  }, []);

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

  const TripCard = ({ index }: { index: number }) => {
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
      return (
        <View style={styles.itemContainer}>
          <Animated.View style={[styles.unifiedWrapper, unifiedTransform]}>
            {/* Book pages - positioned behind the card */}
            <View style={styles.bookPagesContainer}>
              <View style={[styles.bookPage, styles.bookPage3, { backgroundColor: colors.surface.tertiary }]} />
              <View style={[styles.bookPage, styles.bookPage2, { backgroundColor: colors.surface.secondary }]} />
              <View style={[styles.bookPage, styles.bookPage1, { backgroundColor: colors.surface.primary }]} />
            </View>
            
            <Pressable 
              style={[styles.tripCard, styles.placeholderCard, { 
                backgroundColor: colors.surface.secondary,
                borderColor: colors.border.primary,
              }]} 
              onPress={() => handleTripPress(trip)}
            >
              {/* Dotted border overlay */}
              <View style={[styles.dottedBorder, { borderColor: colors.border.primary }]} />
              
              {/* Plus icon in circle */}
              <View style={styles.placeholderContent}>
                <View style={[styles.plusIconContainer, { backgroundColor: colors.primary[100] }]}>
                  <Icon name="plus" size="xl" color={colors.primary[600]} />
                </View>
                <Text style={[styles.placeholderTitle, { color: colors.text.primary }]}>
                  {trip.title}
                </Text>
                <Text style={[styles.placeholderSubtitle, { color: colors.text.secondary }]}>
                  Save your memories
                </Text>
              </View>
            </Pressable>
            
            <Animated.View style={[
              styles.buttonContainer, 
              { 
                opacity: buttonOpacity, 
                transform: [{ translateY: buttonTranslateY }] 
              }
            ]}>
              <Pressable 
                style={({ pressed }) => [
                  styles.tripButton,
                  { backgroundColor: colors.primary[500] },
                  pressed && styles.tripButtonPressed,
                ]} 
                onPress={() => handleTripPress(trip)}
              >
                <Text style={[styles.tripButtonText, { color: 'white' }]}>
                  {trip.buttonText}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      );
    }

    // Real trip card
    return (
      <View style={styles.itemContainer}>
        <Animated.View style={[styles.unifiedWrapper, unifiedTransform]}>
          {/* Book pages - positioned behind the card */}
          <View style={styles.bookPagesContainer}>
            <View style={[styles.bookPage, styles.bookPage3, { backgroundColor: colors.surface.tertiary }]} />
            <View style={[styles.bookPage, styles.bookPage2, { backgroundColor: colors.surface.secondary }]} />
            <View style={[styles.bookPage, styles.bookPage1, { backgroundColor: colors.surface.primary }]} />
          </View>
          
          <Pressable style={styles.tripCard} onPress={() => handleTripPress(trip)}>
            <Image 
              source={trip.image} 
              placeholder={{ blurhash: trip.blurhash }} 
              style={styles.tripImage} 
              contentFit="cover" 
              transition={300} 
            />
            <View style={styles.imageBorder} />
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
              <View style={[styles.tripOptionsButtonBackground, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Icon name="ellipsis-horizontal" size="sm" color="white" />
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
          
          <Animated.View style={[
            styles.buttonContainer, 
            { 
              opacity: buttonOpacity, 
              transform: [{ translateY: buttonTranslateY }] 
            }
          ]}>
            <Pressable 
              style={({ pressed }) => [
                styles.tripButton, 
                { backgroundColor: colors.surface.primary },
                pressed && styles.tripButtonPressed, 
              ]} 
              onPress={() => handleTripPress(trip)}
            >
              <Text style={[styles.tripButtonText, { color: colors.text.primary }]}>
                {trip.buttonText}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    if (trips.length === 0) return null;
    
    return (
      <View style={styles.dotsContainer}>
        <View style={[styles.dotsWrapper, { backgroundColor: colors.surface.tertiary }]}>
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
              outputRange: [0.4, 1, 0.4, 0.4, 1, 0.4, 0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            const dotScale = scrollX.interpolate({
              inputRange: inputRanges.flat(),
              outputRange: [1, 1.3, 1, 1, 1.3, 1, 1, 1.3, 1],
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
                      backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
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
      <Text style={[styles.tripMemoText, { color: colors.text.primary }]}>
        TripMemo
      </Text>
    </View>
  );

  const renderLevelIndicator = () => (
    <View style={styles.levelIndicatorContainer}>
      <View style={[styles.levelIndicatorWrapper, { backgroundColor: colors.surface.tertiary }]}>
        <View style={styles.levelContent}>
          <Icon name="adventure" size="sm" color={colors.text.primary} />
          <View style={styles.levelTextContainer}>
            <Text style={[styles.levelNumber, { color: colors.text.primary }]}>
              Level 1
            </Text>
            <Text style={[styles.levelText, { color: colors.text.primary }]}>
              Adventurer
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
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
      />
      
      {/* Trip Creation Modal */}
      <TripCreationModal
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: screenHeight * 0.08,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 50,
  },
  dotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    position: 'relative',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  activeDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  dotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
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
    borderRadius: 32,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  imageBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 32,
    zIndex: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 32,
    zIndex: 2,
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
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  tripButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 100,
    minWidth: 140,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  tripButtonPressed: {
    opacity: 0.8,
  },
  tripButtonText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  levelIndicatorContainer: {
    position: 'absolute',
    top: screenHeight * 0.08,
    right: SPACING.md,
    zIndex: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIndicatorWrapper: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  levelTextContainer: {
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 12,
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
    top: screenHeight * 0.08,
    left: SPACING.md,
    zIndex: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripMemoText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: 'Merienda',
    letterSpacing: -0.5,
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
}); 