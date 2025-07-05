import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  Animated as RNAnimated,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
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

// Writing prompts for better UX
const WRITING_PROMPTS = [
  "What made this moment special?",
  "How did this make you feel?",
  "What story does this tell?",
  "What would you tell a friend about this?",
  "What emotions does this bring back?",
];

// --- Mock Data with enhanced trip information ---
const mockTrips = [
    { 
      id: '1', 
      name: 'California Road Trip',
      image: require('../../assets/images/california-road-trip.jpg'),
      location: 'San Francisco, CA',
      status: 'active' as const,
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      color: '#3B82F6'
    },
    { 
      id: '2', 
      name: 'Yosemite Adventure',
      image: require('../../public/assets/yosemite_compressed.webp'),
      location: 'Yosemite National Park',
      status: 'recent' as const,
      startDate: '2024-01-10',
      endDate: '2024-01-14',
      color: '#10B981'
    },
    { 
      id: '3', 
      name: 'Lake Tahoe Getaway',
      image: require('../../public/assets/lake-tahoe.webp'),
      location: 'Lake Tahoe, NV',
      status: 'completed' as const,
      startDate: '2024-01-05',
      endDate: '2024-01-09',
      color: '#8B5CF6'
    },
    { 
      id: '4', 
      name: 'LA City Vibes',
      image: require('../../public/assets/los-angeles-city-skyline_compressed.webp'),
      location: 'Los Angeles, CA',
      status: 'completed' as const,
      startDate: '2023-12-20',
      endDate: '2023-12-25',
      color: '#F59E0B'
    },
];

// Smart ordering function
const getSortedTrips = (trips: typeof mockTrips) => {
  return [...trips].sort((a, b) => {
    // Active trips first
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    
    // Recent trips next
    if (a.status === 'recent' && b.status !== 'recent' && b.status !== 'active') return -1;
    if (b.status === 'recent' && a.status !== 'recent' && a.status !== 'active') return 1;
    
    // Then by date (most recent first)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
};

// --- Compact Trip Selector Button ---
const TripSelectorButton = React.memo(({ selectedTrip, onPress, styles }: { selectedTrip: any, onPress: () => void, styles: any }) => {
    return (
        <TouchableOpacity style={styles.tripSelectorButton} onPress={onPress}>
            <View style={styles.tripButtonContent}>
                <View style={[styles.tripButtonIndicator, { backgroundColor: selectedTrip.color }]} />
                <View style={styles.tripButtonText}>
                    <Text style={styles.tripButtonName}>{selectedTrip.name}</Text>
                    <Text style={styles.tripButtonLocation}>{selectedTrip.location}</Text>
                </View>
                <Icon name="chevron-down" size="sm" color="#666" />
            </View>
        </TouchableOpacity>
    );
});

// --- Trip Selection Modal ---
const TripSelectionModal = React.memo(({ 
    visible, 
    selectedTrip, 
    onSelectTrip, 
    onClose,
    styles
}: { 
    visible: boolean, 
    selectedTrip: any, 
    onSelectTrip: (trip: any) => void, 
    onClose: () => void,
    styles: any 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const sortedTrips = getSortedTrips(mockTrips);
    const filteredTrips = sortedTrips.filter(trip => 
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectTrip = (trip: any) => {
        onSelectTrip(trip);
        onClose();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return { text: 'Active', color: '#10B981' };
            case 'recent': return { text: 'Recent', color: '#3B82F6' };
            default: return null;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Trip</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <Icon name="close" size="lg" color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Icon name="search" size="sm" color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search trips..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                        />
                    </View>

                    {/* Trip List */}
                    <RNScrollView style={styles.tripList} showsVerticalScrollIndicator={false}>
                        {filteredTrips.map((trip) => (
                            <TouchableOpacity
                                key={trip.id}
                                style={[
                                    styles.tripListItem,
                                    selectedTrip.id === trip.id && styles.tripListItemSelected
                                ]}
                                onPress={() => handleSelectTrip(trip)}
                            >
                                <Image source={trip.image} style={styles.tripListImage} />
                                <View style={styles.tripListContent}>
                                    <View style={styles.tripListHeader}>
                                        <Text style={styles.tripListName}>{trip.name}</Text>
                                        {getStatusBadge(trip.status) && (
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(trip.status)!.color }]}>
                                                <Text style={styles.statusBadgeText}>{getStatusBadge(trip.status)!.text}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.tripListLocation}>{trip.location}</Text>
                                    <Text style={styles.tripListDates}>
                                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                    </Text>
                                </View>
                                {selectedTrip.id === trip.id && (
                                    <Icon name="checkmark" size="lg" color="#10B981" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </RNScrollView>
                </View>
            </View>
        </Modal>
    );
});

export default function StreamlinedEntryEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string; isVideo?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const scrollRef = useRef<RNScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const [content, setContent] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(getSortedTrips(mockTrips)[0]);
  const [currentTime] = useState(new Date());
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showTripModal, setShowTripModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const styles = createStyles(colors);

  // Auto-save functionality
  const autosaveDraft = useCallback((text: string) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      // Save draft to AsyncStorage
      console.log('Auto-saving draft:', text);
    }, 1000); // Save after 1 second of inactivity
  }, []);

  // Optimized content change handler
  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    
    if (text.length > 10) { // Only auto-save if there's meaningful content
      autosaveDraft(text);
    }
  }, [autosaveDraft]);

  // Clean up auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  const scrollY = useSharedValue(0);
  const isVideo = params.isVideo === 'true';

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleClose = useCallback(() => router.back(), [router]);
  const handleSelectTrip = useCallback((trip: any) => setSelectedTrip(trip), []);

  // Simplified focus management
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Random writing prompt
  const placeholder = useMemo(() => {
    return WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
  }, []);

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert("Tell your story", "Share what made this moment special");
      return;
    }
    
    // Clear auto-save timer
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    console.log("Saving entry:", {
      content: content.trim(),
      media: params.photoUri,
      mediaType: isVideo ? 'video' : 'photo',
      trip: selectedTrip,
      time: currentTime,
      wordCount,
    });
    Alert.alert("Memory saved! ✨", "Your story has been added to your journal.", [
      { text: "Done", onPress: () => router.back() },
    ]);
  };

  const filteredTrips = mockTrips.filter(trip =>
    trip.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fixed Header - stays on top */}
      {params.photoUri && (
        <View style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Icon name="close" size="lg" color="white" />
          </TouchableOpacity>
        </View>
      )}

      <AnimatedScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        bounces={false} // Prevent bouncing to avoid pulling down the image
        overScrollMode="never" // Android equivalent of bounces={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* Media Section - scrolls with content but can't be pulled down */}
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
              <Image source={{ uri: params.photoUri }} style={styles.media} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,1)']}
              locations={[0, 0.4, 1.0]}
              style={styles.mediaGradient}
            />
          </View>
        )}

        {/* Content Section */}
        <View style={styles.contentSection}>
          <TripSelectorButton selectedTrip={selectedTrip} onPress={() => setShowTripModal(true)} styles={styles} />
          
          {/* Enhanced Text Input */}
          <View style={styles.textInputContainer}>
            <TextInput
              ref={inputRef}
              style={[
                styles.storyInput,
                isFocused && styles.storyInputFocused
              ]}
              placeholder={placeholder}
              placeholderTextColor={colors.text.tertiary}
              value={content}
              onChangeText={handleContentChange}
              multiline
              textAlignVertical="top"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              maxLength={2000}
              autoCapitalize="sentences"
              autoCorrect={true}
              spellCheck={true}
              scrollEnabled={true}
            />
            
            {/* Simplified footer - only show when there's content */}
            {content.trim().length > 0 && (
              <View style={styles.textInputFooter}>
                <Text style={styles.wordCount}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </Text>
                {isFocused && content.length < 50 && (
                  <Text style={styles.writingTip}>
                    ✨ Keep going, you're doing great!
                  </Text>
                )}
              </View>
            )}

            {/* Date/Time/Location moved here */}
            <View style={styles.dateLocationContainer}>
              <Text style={styles.dateLocationText}>
                {formatDate(currentTime)} • {formatTime(currentTime)} • {selectedTrip.location}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedScrollView>
      
      {/* Floating Save Button */}
      <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[
            styles.saveButton,
            content.trim().length > 0 && styles.saveButtonActive
          ]}
        >
          <Text style={[
            styles.saveButtonText,
            content.trim().length > 0 && styles.saveButtonTextActive
          ]}>
            Save Memory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trip Selection Modal */}
      <TripSelectionModal
        visible={showTripModal}
        selectedTrip={selectedTrip}
        onSelectTrip={handleSelectTrip}
        onClose={() => setShowTripModal(false)}
        styles={styles}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start', // Only close button on left
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.35, // Reduced from 0.45 to make image shorter
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    backgroundColor: '#000',
    paddingHorizontal: 0, // Remove horizontal padding to allow full-width carousel
    paddingTop: 8, // Reduced from 16 to move content up
    marginTop: -1, // Slight overlap to ensure no gap
  },
  tripSelectorButton: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  tripButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripButtonIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tripButtonText: {
    flexDirection: 'column',
  },
  tripButtonName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tripButtonLocation: {
    color: '#666',
    fontSize: 10,
  },
  textInputContainer: {
    marginHorizontal: 8, // Reduced from 16
    marginTop: 8, // Move text input up
  },
  textInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  wordCount: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  writingTip: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  dateLocationContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  dateLocationText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#222',
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
  saveButtonActive: {
    backgroundColor: 'white',
  },
  saveButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextActive: {
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  tripList: {
    maxHeight: 400,
  },
  tripListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tripListItemSelected: {
    borderColor: '#10B981',
  },
  tripListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  tripListContent: {
    flex: 1,
  },
  tripListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripListName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  tripListLocation: {
    color: '#999',
    fontSize: 12,
    marginBottom: 2,
  },
  tripListDates: {
    color: '#666',
    fontSize: 11,
  },
  storyInput: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200, // Good height for writing
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    marginHorizontal: 8, // Reduced from 16 for less left/right padding
    borderWidth: 1,
    borderColor: 'transparent',
  },
  storyInputFocused: {
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  characterCount: {
    position: 'absolute',
  },
}); 