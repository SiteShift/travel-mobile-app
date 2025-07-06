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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Icon } from '../../src/components/Icon';
import { FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const mockTrips = [
  {
    id: '1',
    title: 'California Road Trip',
    description: 'Me and Samantha went from Los Angeles to San Francisco for our best trip ever in Big Bertha',
    image: require('../../assets/images/california-road-trip.jpg'),
    buttonText: 'View Trip',
    gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'],
    country: 'America',
    blurhash: 'LGF5?xYk^6#M@-5c,1J5Or]0Rj',
  },
  {
    id: '2',
    title: 'European Adventure',
    description: 'Three weeks exploring Paris, Rome, and Barcelona with amazing food and culture',
    image: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&h=1200&fit=crop&q=90&auto=format',
    buttonText: 'View Trip',
    gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'],
    country: 'France',
    blurhash: 'LHF#=8s:%%n$1N?Hn%s.56S~Iq',
  },
  {
    id: '3',
    title: 'Polish Mountains',
    description: 'A journey through the Tatra Mountains with breathtaking views and traditional culture',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=1200&fit=crop&q=90&auto=format',
    buttonText: 'View Trip',
    gradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'],
    country: 'Poland',
    blurhash: 'L~EVi7WBj[of_NWBj[j[~qj[j[j[',
  },
];

const CARD_WIDTH = screenWidth * 0.75;
const SPACING_VALUE = SPACING.md;
const ITEM_SPACING = screenWidth * 0.72; // Increased spacing for better card separation
const DUPLICATE_COUNT = mockTrips.length;
const CARD_HEIGHT = screenHeight * 0.6;
const BUTTON_HEIGHT = 54;

export default function HomeTab() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const infiniteData = [...mockTrips, ...mockTrips, ...mockTrips];
    setData(infiniteData);
    const initialOffset = DUPLICATE_COUNT * ITEM_SPACING;
    scrollX.setValue(initialOffset);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialOffset,
        animated: false,
      });
    }, 100);
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, []);

  const handleTripPress = (trip: any) => {
    console.log('Trip pressed:', trip.title);
    // Navigate to trip detail modal
    router.push('/trip-detail');
  };
  
  const onMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_SPACING);
    if (newIndex <= 1 || newIndex >= data.length - 2) {
      const targetIndex = DUPLICATE_COUNT + (newIndex % DUPLICATE_COUNT);
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
    }
  };

  const TripCard = ({ index }: { index: number }) => {
    const inputRange = [
      (index - 1) * ITEM_SPACING,
      index * ITEM_SPACING,
      (index + 1) * ITEM_SPACING,
    ];

    const rotateY = scrollX.interpolate({ inputRange, outputRange: ['40deg', '0deg', '-40deg'], extrapolate: 'clamp' });
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const buttonOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const buttonTranslateY = scrollX.interpolate({ inputRange, outputRange: [50, 0, 50], extrapolate: 'clamp' });

    const unifiedTransform = {
      transform: [{ perspective: 1000 }, { rotateY }, { scale }],
    };
    
    return (
      <View style={styles.itemContainer}>
        <Animated.View style={[styles.unifiedWrapper, unifiedTransform]}>
          <Pressable style={styles.tripCard} onPress={() => handleTripPress(data[index])}>
            <Image source={data[index]?.image} placeholder={{ blurhash: data[index]?.blurhash }} style={styles.tripImage} contentFit="cover" transition={300} />
            <View style={styles.imageBorder} />
            <LinearGradient colors={data[index]?.gradient || []} style={styles.gradientOverlay} />
            <View style={styles.cardContent}>
              <Text style={styles.tripTitle} numberOfLines={1}>{data[index]?.title}</Text>
              <Text style={styles.tripDescription}>{data[index]?.description}</Text>
            </View>
          </Pressable>
          <Animated.View style={[ styles.buttonContainer, { opacity: buttonOpacity, transform: [{ translateY: buttonTranslateY }] } ]}>
            <Pressable style={({ pressed }) => [ 
              styles.tripButton, 
              { backgroundColor: colors.surface.primary },
              pressed && styles.tripButtonPressed, 
            ]} onPress={() => handleTripPress(data[index])}>
              <Text style={[styles.tripButtonText, { color: colors.text.primary }]}>{data[index]?.buttonText}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background.primary} />

      <Animated.FlatList
        ref={flatListRef} data={data} renderItem={TripCard} keyExtractor={(item, index) => `${item?.id}-${index}`}
        horizontal showsHorizontalScrollIndicator={false} snapToInterval={ITEM_SPACING} decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: (screenWidth - ITEM_SPACING) / 2 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({ length: ITEM_SPACING, offset: ITEM_SPACING * index, index })}
          style={styles.carousel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carousel: {
    marginTop: -screenHeight * 0.05, // Move carousel up
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
  tripImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  imageBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1, borderColor: 'rgba(128, 128, 128, 0.5)', borderRadius: 32, zIndex: 3,
  },
  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%', borderRadius: 32, zIndex: 2,
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
    letterSpacing: -0.5,
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
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 100,
    minWidth: 140, height: BUTTON_HEIGHT, justifyContent: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  tripButtonPressed: {
    opacity: 0.8,
  },
  tripButtonText: {
    fontSize: 18, fontWeight: FONT_WEIGHTS.medium, textAlign: 'center',
  },
}); 