import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { Timeline, TimelineEntry } from '../components/Timeline';
import { TimelineNavigation, TimelineDate } from '../components/TimelineNavigation';
import { PhotoGallery, PhotoItem } from '../components/PhotoGallery';
import { TripSettingsSheet } from '../components/TripSettingsSheet';
import { TripSharingSheet } from '../components/TripSharingSheet';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TripEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  photos: string[];
  weather?: {
    condition: string;
    temperature: number;
    icon: string;
  };
  tags: string[];
  mood?: 'happy' | 'excited' | 'peaceful' | 'adventurous' | 'tired';
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  description: string;
  totalDistance: string;
  totalDays: number;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  entries: TripEntry[];
  stats: {
    entriesCount: number;
    photosCount: number;
    placesVisited: number;
    favoriteLocation: string;
  };
}

interface TripDetailScreenProps {
  tripId: string; // Would come from navigation params
}

// Mock photo data
const mockPhotos: PhotoItem[] = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200',
    title: 'Eiffel Tower at Sunset',
    date: '2024-06-01',
    location: 'Paris, France',
    entryId: '1',
    entryTitle: 'Arrival in Paris',
    tags: ['landmark', 'sunset', 'architecture'],
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=200',
    title: 'Delicious Croissants',
    date: '2024-06-01',
    location: 'Local Bakery, Paris',
    entryId: '1',
    entryTitle: 'Arrival in Paris',
    tags: ['food', 'breakfast', 'french'],
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200',
    title: 'Mona Lisa',
    date: '2024-06-02',
    location: 'Louvre Museum, Paris',
    entryId: '2',
    entryTitle: 'Louvre Museum',
    tags: ['art', 'museum', 'famous'],
  },
  {
    id: '4',
    uri: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=200',
    title: 'Louvre Architecture',
    date: '2024-06-02',
    location: 'Louvre Museum, Paris',
    entryId: '2',
    entryTitle: 'Louvre Museum',
    tags: ['architecture', 'glass', 'modern'],
  },
  {
    id: '5',
    uri: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=200',
    title: 'Roman Colosseum',
    date: '2024-06-05',
    location: 'Rome, Italy',
    entryId: '3',
    entryTitle: 'Rome at Last',
    tags: ['history', 'ancient', 'rome'],
  },
  {
    id: '6',
    uri: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400',
    thumbnail: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=200',
    title: 'Roman Street Life',
    date: '2024-06-05',
    location: 'Rome, Italy',
    entryId: '3',
    entryTitle: 'Rome at Last',
    tags: ['street', 'culture', 'people'],
  },
];

// Generate mock timeline dates based on trip entries
const generateTimelineDates = (entries: TripEntry[]): TimelineDate[] => {
  const dates: TimelineDate[] = [];
  
  entries.forEach(entry => {
    const existingDate = dates.find(d => d.date === entry.date);
    if (existingDate) {
      existingDate.entryCount += 1;
      existingDate.hasPhotos = existingDate.hasPhotos || entry.photos.length > 0;
      if (!existingDate.mood && entry.mood) {
        existingDate.mood = entry.mood;
      }
    } else {
      dates.push({
        date: entry.date,
        entryCount: 1,
        hasPhotos: entry.photos.length > 0,
        mood: entry.mood,
      });
    }
  });
  
  return dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Mock trip data
const mockTrip: Trip = {
  id: '1',
  title: 'European Adventure',
  destination: 'Paris, Rome, Barcelona',
  startDate: '2024-06-01',
  endDate: '2024-06-15',
  description: 'An amazing journey through the heart of Europe, exploring historic cities, incredible cuisine, and meeting wonderful people along the way.',
  totalDistance: '2,847 km',
  totalDays: 14,
  participants: [
    { id: '1', name: 'Alex Johnson' },
    { id: '2', name: 'Sarah Chen' },
  ],
  stats: {
    entriesCount: 12,
    photosCount: 89,
    placesVisited: 8,
    favoriteLocation: 'Santorini Sunset Point',
  },
  entries: [
    {
      id: '1',
      title: 'Arrival in Paris',
      content: 'Finally made it to the City of Light! The Eiffel Tower is even more beautiful in person. Had the most amazing croissants for breakfast.',
      date: '2024-06-01',
      time: '14:30',
      location: {
        name: 'Paris, France',
        coordinates: [2.3522, 48.8566],
      },
      photos: ['paris1.jpg', 'paris2.jpg'],
      weather: {
        condition: 'Sunny',
        temperature: 22,
        icon: 'sunny',
      },
      tags: ['arrival', 'city', 'food'],
      mood: 'excited',
    },
    {
      id: '2',
      title: 'Louvre Museum',
      content: 'Spent the entire day at the Louvre. The Mona Lisa was smaller than expected but still incredible. So much art and history in one place.',
      date: '2024-06-02',
      time: '10:00',
      location: {
        name: 'Louvre Museum, Paris',
        coordinates: [2.3376, 48.8606],
      },
      photos: ['louvre1.jpg', 'louvre2.jpg', 'louvre3.jpg'],
      weather: {
        condition: 'Cloudy',
        temperature: 18,
        icon: 'cloudy',
      },
      tags: ['museum', 'art', 'culture'],
      mood: 'peaceful',
    },
    {
      id: '3',
      title: 'Rome at Last',
      content: 'The train ride to Rome was scenic. First glimpse of the Colosseum took my breath away. The history here is overwhelming in the best way.',
      date: '2024-06-05',
      time: '16:45',
      location: {
        name: 'Rome, Italy',
        coordinates: [12.4964, 41.9028],
      },
      photos: ['rome1.jpg'],
      weather: {
        condition: 'Partly Cloudy',
        temperature: 25,
        icon: 'partly-cloudy',
      },
      tags: ['arrival', 'history', 'architecture'],
      mood: 'adventurous',
    },
  ],
};

export default function TripDetailScreen({ tripId }: TripDetailScreenProps) {
  const { colors } = useTheme();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery' | 'map'>('timeline');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sharingVisible, setSharingVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTrip(mockTrip);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTripData();
    setRefreshing(false);
  };

  const handleEditTrip = () => {
    console.log('Navigate to trip edit');
    setSettingsVisible(false);
  };

  const handleShareTrip = () => {
    setSettingsVisible(false);
    setSharingVisible(true);
  };

  const handleGenerateShareLink = async (): Promise<string> => {
    // Simulate API call to generate shareable link
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://traveljournal.app/trip/${trip?.id}`);
      }, 1500);
    });
  };

  const handleCustomShare = (method: string, data: any) => {
    console.log(`Shared via ${method}:`, data);
    setSharingVisible(false);
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add memories.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Optimized helper function to flip image horizontally immediately


  const addMemoryFromSource = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        let finalImageUri = result.assets[0].uri;

        const processMemory = (imageUri: string) => {
          console.log('Added memory from', source, ':', imageUri);
          // Here you would integrate with your trip data structure
          // Navigate to entry editor or update trip state
        };

        processMemory(finalImageUri);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    }
  };

  const handleAddEntry = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Add Memory',
      'How would you like to add a photo?',
      [
        {
          text: 'Take Photo',
          onPress: () => addMemoryFromSource('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => addMemoryFromSource('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleEntryPress = (entry: TripEntry) => {
    console.log('Navigate to entry detail:', entry.id);
  };

  const handleTripSettings = () => {
    setSettingsVisible(true);
  };

  const handleArchiveTrip = () => {
    console.log('Archive trip:', tripId);
  };

  const handleDeleteTrip = () => {
    console.log('Delete trip:', tripId);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    console.log('Navigate to date:', date);
    // TODO: Scroll timeline to selected date
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysSince = (startDate: string, entryDate: string) => {
    const start = new Date(startDate);
    const entry = new Date(entryDate);
    const diffTime = Math.abs(entry.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'happy': return 'happy';
      case 'excited': return 'star';
      case 'peaceful': return 'leaf';
      case 'adventurous': return 'compass';
      case 'tired': return 'moon';
      default: return 'heart';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy': return colors.warning[500];
      case 'excited': return colors.error[500];
      case 'peaceful': return colors.success[500];
      case 'adventurous': return colors.primary[500];
      case 'tired': return colors.info[500];
      default: return colors.text.secondary;
    }
  };

  const renderTripHeader = () => (
    <Card variant="elevated" style={styles.headerCard}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={[styles.tripTitle, { color: colors.text.primary }]}>
            {trip?.title}
          </Text>
          <Text style={[styles.tripDestination, { color: colors.text.secondary }]}>
            {trip?.destination}
          </Text>
          <Text style={[styles.tripDates, { color: colors.text.tertiary }]}>
            {trip && formatDate(trip.startDate)} - {trip && formatDate(trip.endDate)}
          </Text>
        </View>
        <View style={styles.tripActions}>
          <TouchableOpacity onPress={handleEditTrip} style={styles.actionButton}>
            <Icon name="edit" size="md" color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareTrip} style={styles.actionButton}>
            <Icon name="share" size="md" color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.tripDescription, { color: colors.text.secondary }]}>
        {trip?.description}
      </Text>

      {/* Trip Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {trip?.totalDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Days
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {trip?.stats.entriesCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Entries
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {trip?.stats.photosCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Photos
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>
            {trip?.totalDistance}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Distance
          </Text>
        </View>
      </View>

      {/* Participants */}
      {trip?.participants && trip.participants.length > 0 && (
        <View style={styles.participantsContainer}>
          <Text style={[styles.participantsTitle, { color: colors.text.primary }]}>
            Travel Companions
          </Text>
          <View style={styles.participantsList}>
            {trip.participants.map((participant) => (
              <View key={participant.id} style={styles.participant}>
                <Avatar
                  size="sm"
                  fallbackText={participant.name}
                  variant="circular"
                />
                <Text style={[styles.participantName, { color: colors.text.secondary }]}>
                  {participant.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );

  const renderTabNavigation = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface.primary }]}>
      {(['timeline', 'gallery', 'map'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && { backgroundColor: colors.primary[100] },
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Icon
            name={tab === 'timeline' ? 'time' : tab === 'gallery' ? 'images' : 'map'}
            size="sm"
            color={activeTab === tab ? colors.primary[500] : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === tab ? colors.primary[500] : colors.text.secondary,
              },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );



  const renderTimelineView = () => {
    if (!trip) return null;
    
    const timelineDates = generateTimelineDates(trip.entries);
    
    return (
      <View style={styles.timelineContainer}>
        <TimelineNavigation
          dates={timelineDates}
          currentDate={selectedDate}
          onDateSelect={handleDateSelect}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          style={styles.timelineNavigation}
        />
        <Timeline
          entries={trip.entries}
          onEntryPress={handleEntryPress}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showDateSeparators={true}
          showAuthor={false}
          compactMode={false}
        />
      </View>
    );
  };

  const renderGalleryView = () => (
    <PhotoGallery
      photos={mockPhotos}
      onPhotoPress={(photo, index) => {
        console.log('Photo pressed:', photo.title, 'at index:', index);
      }}
      numColumns={2}
      showMetadata={true}
      showEntryInfo={true}
    />
  );

  const renderMapView = () => (
    <View style={styles.placeholderContainer}>
      <Icon name="map" size="xxl" color={colors.text.tertiary} />
      <Text style={[styles.placeholderTitle, { color: colors.text.primary }]}>
        Trip Map
      </Text>
      <Text style={[styles.placeholderSubtitle, { color: colors.text.secondary }]}>
        Map view coming in Phase 4
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'timeline':
        return renderTimelineView();
      case 'gallery':
        return renderGalleryView();
      case 'map':
        return renderMapView();
      default:
        return renderTimelineView();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper variant="full">
        <LoadingSpinner variant="overlay" message="Loading trip details..." />
      </SafeAreaWrapper>
    );
  }

  if (!trip) {
    return (
      <SafeAreaWrapper variant="full">
        <Header title="Trip Not Found" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size="xxl" color={colors.text.tertiary} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Trip Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.text.secondary }]}>
            The trip you're looking for doesn't exist or has been deleted.
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper variant="full">
      <Header
        title={trip.title}
        rightActions={[
          {
            icon: 'settings',
            onPress: handleTripSettings,
            badge: false,
          },
          {
            icon: 'add',
            onPress: handleAddEntry,
            badge: false,
          },
        ]}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderTripHeader()}
        {renderTabNavigation()}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>

      <TripSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        tripTitle={trip.title}
        tripId={trip.id}
        onEditTrip={handleEditTrip}
        onShareTrip={handleShareTrip}
        onArchiveTrip={handleArchiveTrip}
        onDeleteTrip={handleDeleteTrip}
        onViewOnMap={() => {
          setActiveTab('map');
          setSettingsVisible(false);
        }}
      />

      <TripSharingSheet
        visible={sharingVisible}
        onClose={() => setSharingVisible(false)}
        tripTitle={trip.title}
        tripId={trip.id}
        coverImageUrl={trip.coverImage}
        onGenerateLink={handleGenerateShareLink}
        onCustomShare={handleCustomShare}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginBottom: SPACING.xs,
  },
  tripDestination: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.xs,
  },
  tripDates: {
    ...TYPOGRAPHY.styles.caption,
  },
  tripActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  tripDescription: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.styles.caption,
  },
  participantsContainer: {
    marginTop: SPACING.md,
  },
  participantsTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.sm,
  },
  participantsList: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  participant: {
    alignItems: 'center',
  },
  participantName: {
    ...TYPOGRAPHY.styles.caption,
    marginTop: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  tabLabel: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    marginTop: SPACING.md,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineNavigation: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  entryCard: {
    marginBottom: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDay: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  entryDate: {
    ...TYPOGRAPHY.styles.caption,
  },
  entryTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.sm,
  },
  entryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  entryLocationText: {
    ...TYPOGRAPHY.styles.caption,
    flex: 1,
  },
  entryTime: {
    ...TYPOGRAPHY.styles.caption,
  },
  entryContent: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flex: 1,
  },
  tag: {
    marginRight: 0,
  },
  entryStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  entryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  entryStatText: {
    ...TYPOGRAPHY.styles.caption,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    minHeight: 300,
  },
  placeholderTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
  },
}); 