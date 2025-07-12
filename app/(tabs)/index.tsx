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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';
import { TripCreationModal } from '../../src/components/TripCreationModal';
import { FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

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
}

// Start with empty user experience - 3 placeholder cards
const createPlaceholderTrips = (): Trip[] => [
  {
    id: 'placeholder-1',
    type: 'placeholder',
    title: 'Add Your First Trip',
    buttonText: 'Create Trip',
  },
  {
    id: 'placeholder-2', 
    type: 'placeholder',
    title: 'Plan Another Adventure',
    buttonText: 'Create Trip',
  },
  {
    id: 'placeholder-3',
    type: 'placeholder', 
    title: 'Dream Big & Explore',
    buttonText: 'Create Trip',
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
        title: i === 0 ? 'Add Your First Trip' : i === 1 ? 'Plan Another Adventure' : 'Dream Big & Explore',
        buttonText: 'Create Trip',
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
      router.push('/trip-detail');
    }
  }, [router]);

  const handleCreateTrip = useCallback(() => {
    setShowTripCreationModal(true);
  }, []);

  const handleTripCreation = useCallback((tripData: {
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
  }) => {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
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
    };
    
    const realTrips = trips.filter(t => t.type === 'real');
    updateTripsData([...realTrips, newTrip]);
    setShowTripCreationModal(false);
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
                  Start documenting your adventures
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

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background.primary} 
      />

      {/* Dots Indicator */}
      {renderDots()}

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
    marginTop: screenHeight * -0.010,
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
}); 