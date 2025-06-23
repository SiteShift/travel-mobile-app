import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock trips for selection
const mockTrips = [
  { id: '1', title: 'California Road Trip', emoji: '🚗' },
  { id: '2', title: 'European Adventure', emoji: '🏰' },
  { id: '3', title: 'Tokyo Discovery', emoji: '🏮' },
  { id: '4', title: 'Iceland Adventure', emoji: '🏔️' },
];

export default function StreamlinedEntryEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string }>();
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(mockTrips[0]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [currentLocation] = useState('San Francisco, CA');
  const [currentTime] = useState(new Date());

  // Animation for photo header
  const scrollY = useRef(new Animated.Value(0)).current;
  const photoOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Save your memory?",
        "Your story will be saved as a draft.",
        [
          { text: "Keep Writing", style: "cancel" },
          {
            text: "Save & Close",
            onPress: () => {
              console.log("Saving entry...");
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Add a title", "Give your memory a beautiful title");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Tell your story", "Share what made this moment special");
      return;
    }

    console.log("Saving entry:", {
      title: title.trim(),
      content: content.trim(),
      trip: selectedTrip,
      photo: params.photoUri,
      location: currentLocation,
      time: currentTime,
    });

    Alert.alert("Memory saved! ✨", "Your story has been added to your journal.", [
      { text: "View Entry", onPress: () => router.back() },
    ]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
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
      day: 'numeric' 
    });
  };

  const TripSelector = () => (
    <Modal
      visible={showTripSelector}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTripSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.tripSelectorModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Trip</Text>
            <TouchableOpacity 
              onPress={() => setShowTripSelector(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size="md" color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.tripsList}>
            {mockTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.tripOption,
                  selectedTrip.id === trip.id && styles.selectedTripOption
                ]}
                onPress={() => {
                  setSelectedTrip(trip);
                  setShowTripSelector(false);
                }}
              >
                <Text style={styles.tripEmoji}>{trip.emoji}</Text>
                <Text style={[
                  styles.tripOptionText,
                  selectedTrip.id === trip.id && styles.selectedTripOptionText
                ]}>
                  {trip.title}
                </Text>
                {selectedTrip.id === trip.id && (
                  <Icon name="check" size="sm" color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with close and save */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Icon name="close" size="lg" color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Photo Hero Section */}
        {params.photoUri && (
          <Animated.View style={[styles.photoContainer, { opacity: photoOpacity }]}>
            <Image source={{ uri: params.photoUri }} style={styles.photo} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.photoGradient}
            />
          </Animated.View>
        )}

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Trip Selection */}
          <TouchableOpacity 
            style={styles.tripSelector}
            onPress={() => setShowTripSelector(true)}
          >
            <Text style={styles.tripEmoji}>{selectedTrip.emoji}</Text>
            <Text style={styles.tripTitle}>{selectedTrip.title}</Text>
            <Icon name="down" size="sm" color="#666" />
          </TouchableOpacity>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="What happened today?"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={100}
          />

          {/* Story Input */}
          <TextInput
            style={styles.storyInput}
            placeholder="Tell your story... What made this moment special? How did it make you feel?"
            placeholderTextColor="#555"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Time and Location - Minimal */}
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              {formatDate(currentTime)} • {formatTime(currentTime)} • {currentLocation}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TripSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentSection: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingTop: 24,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  tripSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  tripEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tripTitle: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  titleInput: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Times New Roman',
    lineHeight: 34,
    marginBottom: 24,
    minHeight: 40,
  },
  storyInput: {
    color: '#E0E0E0',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400',
    minHeight: 200,
    marginBottom: 32,
  },
  metaInfo: {
    paddingBottom: 40,
  },
  metaText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripSelectorModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  tripsList: {
    maxHeight: 300,
  },
  tripOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedTripOption: {
    backgroundColor: '#007AFF20',
  },
  tripOptionText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  selectedTripOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
}); 