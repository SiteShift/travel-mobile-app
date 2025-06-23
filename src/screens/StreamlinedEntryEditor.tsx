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
  ScrollView as RNScrollView,
  findNodeHandle,
  Keyboard,
  Animated as RNAnimated,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedScrollView = Animated.createAnimatedComponent(RNScrollView);

// --- Performance Optimization: Helper functions moved outside component ---
const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

// --- Mock Data ---
const mockTrips = [
    { 
      id: '1', 
      name: 'California Road Trip',
      image: require('../../assets/images/california-road-trip.jpg'),
      location: 'San Francisco, CA'
    },
    { 
      id: '2', 
      name: 'Yosemite Adventure',
      image: require('../../public/assets/yosemite_compressed.webp'),
      location: 'Yosemite National Park'
    },
    { 
      id: '3', 
      name: 'Lake Tahoe Getaway',
      image: require('../../public/assets/lake-tahoe.webp'),
      location: 'Lake Tahoe, NV'
    },
    { 
      id: '4', 
      name: 'LA City Vibes',
      image: require('../../public/assets/los-angeles-city-skyline_compressed.webp'),
      location: 'Los Angeles, CA'
    },
];

// --- Performance Optimization: Memoized TripSelector ---
const TripSelector = React.memo(({ selectedTrip, onSelectTrip }: { selectedTrip: any, onSelectTrip: (trip: any) => void }) => {
    return (
        <View style={styles.tripSelectorContainer}>
            <Text style={styles.sectionTitle}>Select Trip</Text>
            <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tripsScrollView}>
                {mockTrips.map((trip) => (
                    <TouchableOpacity
                        key={trip.id}
                        style={[
                            styles.tripCard,
                            selectedTrip.id === trip.id && styles.selectedTripCard
                        ]}
                        onPress={() => onSelectTrip(trip)}
                    >
                        <Image source={trip.image} style={styles.tripImage} />
                        <View style={styles.tripCardContent}>
                            <Text style={[styles.tripName, selectedTrip.id === trip.id && styles.selectedTripName]}>
                                {trip.name}
                            </Text>
                            <Text style={[styles.tripLocation, selectedTrip.id === trip.id && styles.selectedTripLocation]}>
                                {trip.location}
                            </Text>
                        </View>
                        {selectedTrip.id === trip.id && (
                            <View style={styles.selectedIndicator}>
                                <Icon name="check" size="sm" color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </RNScrollView>
        </View>
    );
});


export default function StreamlinedEntryEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string; isVideo?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const scrollRef = useRef<RNScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(mockTrips[0]);
  const [currentTime] = useState(new Date());
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputY, setInputY] = useState(0);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const scrollY = useSharedValue(0);
  const isVideo = params.isVideo === 'true';

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animation for media scaling on scroll
  const mediaAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-200, 0],
      [1.5, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  // Animation for header - fade out and move up when scrolling
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -50],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });
  
  const handleClose = useCallback(() => router.back(), [router]);
  const handleSelectTrip = useCallback((trip: any) => setSelectedTrip(trip), []);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: inputY - 80, animated: true });
    }, 100);
  }, [inputY]);

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert("Tell your story", "Share what made this moment special");
      return;
    }
    console.log("Saving entry:", {
      content: content.trim(),
      media: params.photoUri,
      mediaType: isVideo ? 'video' : 'photo',
      trip: selectedTrip,
      time: currentTime,
    });
    Alert.alert("Memory saved! ✨", "Your story has been added to your journal.", [
      { text: "Done", onPress: () => router.back() },
    ]);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <AnimatedScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: keyboardHeight + 200 }}
      >
        {/* Media Section - now part of scroll content */}
        {params.photoUri && (
          <Animated.View style={[styles.mediaContainer, mediaAnimatedStyle]}>
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
              <Image source={{ uri: params.photoUri }} style={styles.media} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,1)']}
              locations={[0, 0.4, 1.0]}
              style={styles.mediaGradient}
            />
            
            {/* Header overlay on media - animated */}
            <Animated.View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }, headerAnimatedStyle]}>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Icon name="close" size="lg" color="white" />
              </TouchableOpacity>
              <View style={styles.dateLocationPill}>
                <Text style={styles.dateLocationText}>
                  {formatDate(currentTime)} • {formatTime(currentTime)} • {selectedTrip.location}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Content Section */}
        <View style={styles.contentSection}>
          <TripSelector selectedTrip={selectedTrip} onSelectTrip={handleSelectTrip} />
          <TextInput
            ref={inputRef}
            style={styles.storyInput}
            placeholder="Tell your story... What made this moment special? How did it make you feel?"
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            onFocus={handleInputFocus}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setInputY(layout.y);
            }}
          />
        </View>
      </AnimatedScrollView>
      
      {/* Floating Save Button */}
      <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Memory</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Simplified and Re-organized Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6, // Taller for better visual impact
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%', // Taller gradient for a stronger fade
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLocationPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dateLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  contentSection: {
    backgroundColor: '#000',
    padding: 24,
    marginTop: -1, // Slight overlap to ensure no gap
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  tripSelectorContainer: {
    marginBottom: 32,
  },
  tripsScrollView: {
    paddingLeft: 0,
  },
  tripCard: {
    width: 140,
    height: 120,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  selectedTripCard: {
    borderWidth: 2,
    borderColor: '#999',
  },
  tripImage: {
    width: '100%',
    height: 70,
  },
  tripCardContent: {
    padding: 8,
  },
  tripName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedTripName: {
    color: '#999',
  },
  tripLocation: {
    color: '#666',
    fontSize: 10,
  },
  selectedTripLocation: {
    color: '#999',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInput: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#000', // Match content background
  },
  saveButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 