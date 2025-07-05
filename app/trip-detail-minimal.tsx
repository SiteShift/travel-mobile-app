import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

// Components
import { MinimalDayCard } from '../src/components/minimal/MinimalDayCard';
import { MinimalPhotoCard } from '../src/components/minimal/MinimalPhotoCard';
import { Icon } from '../src/components/Icon';

// Context & Types
import { useTheme } from '../src/contexts/ThemeContext';
import { MinimalTrip, MinimalMemory, ViewPreferences } from '../src/types/tripDetailMinimal';

// Data & Utils
import { minimalTripData, formatTripDates } from '../src/data/minimalMockData';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TripDetailMinimal() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // State
  const [trip] = useState<MinimalTrip>(minimalTripData);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState<ViewPreferences['mode']>('story');
  const [showCaptions, setShowCaptions] = useState(true);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  
  // Animation Values
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // Computed
  const currentDay = trip.days.find(d => d.day === selectedDay);
  const hasPhotos = currentDay && currentDay.memories.length > 0;
  
  // Effects
  useEffect(() => {
    translateY.setValue(screenHeight);
    Animated.spring(translateY, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
    
    StatusBar.setBarStyle('light-content', true);
  }, [translateY]);
  
  // Handlers
  const handleGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      if (gestureY > 150 || velocityY > 1200) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }).start(() => router.back());
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [translateY, router]);
  
  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );
  
  const handleDaySelect = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);
  
  const handlePhotoPress = useCallback((memory: MinimalMemory) => {
    console.log('Open photo viewer:', memory.id);
  }, []);
  
  const handleCaptionEdit = useCallback((memoryId: string) => {
    setEditingCaptionId(memoryId);
    console.log('Edit caption for:', memoryId);
  }, []);
  
  const handleAddDay = useCallback((dayNumber: number) => {
    console.log('Add day:', dayNumber);
    // Future: Navigate to photo picker or day setup
  }, []);
  
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'story' ? 'grid' : 'story');
  }, [viewMode]);
  
  const renderAddNextDay = () => {
    // Find the first day that has no memories.
    const nextDayToAdd = trip.days.find(d => d.memories.length === 0);
    if (!nextDayToAdd) return null;

    // Don't show if the user is currently viewing the day that needs to be added.
    if (currentDay && currentDay.day === nextDayToAdd.day && !hasPhotos) return null;

    return (
      <View style={styles.addNextDayContainer}>
        <TouchableOpacity
          style={[styles.addDayButton, {
            backgroundColor: colors.primary[100],
            borderColor: colors.primary[300],
          }]}
          onPress={() => handleAddDay(nextDayToAdd.day)}
        >
          <Icon name="plus" size="md" color={colors.primary[600]} />
          <Text style={[styles.addDayText, { color: colors.primary[700] }]}>
            Add Day {nextDayToAdd.day}
          </Text>
          {nextDayToAdd.location && (
            <Text style={[styles.addDayLocation, { color: colors.text.secondary }]}>
              {nextDayToAdd.location}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render Methods
  const renderHeader = () => (
    <View style={styles.header}>
             {/* Hero Background */}
       <Image
         source={typeof trip.coverImage === 'string' ? { uri: trip.coverImage } : trip.coverImage}
         style={styles.heroImage}
         contentFit="cover"
       />
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
        style={styles.heroGradient}
      />
      
             {/* No navigation buttons in header anymore */}
       <View style={styles.headerNav} />
      
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.tripTitle}>{trip.title}</Text>
        <Text style={styles.tripDates}>
          {formatTripDates(trip.startDate, trip.endDate)}
        </Text>
        <Text style={styles.photoCountTotal}>
          {trip.totalPhotos} memories
        </Text>
      </View>
    </View>
  );
  
  const renderDaySelector = () => (
    <View style={styles.daySelector}>
      {/* View Mode Toggle */}
      <View style={styles.daySelectorHeader}>
        <Text style={[styles.daySelectorTitle, { color: colors.text.primary }]}>
          Your Journey
        </Text>
        
        <TouchableOpacity
          style={[styles.viewModeToggle, { borderColor: colors.border.secondary }]}
          onPress={toggleViewMode}
        >
          <Icon 
            name={viewMode === 'story' ? 'grid' : 'journal'} 
            size="sm" 
            color={colors.text.primary} 
          />
          <Text style={[styles.viewModeText, { color: colors.text.primary }]}>
            {viewMode === 'story' ? 'Grid View' : 'Story View'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getProgressiveDays()}
        keyExtractor={item => `day-${item.day}`}
        renderItem={({ item }) => (
          <MinimalDayCard
            day={item}
            isSelected={item.day === selectedDay}
            onPress={handleDaySelect}
            variant={viewMode === 'grid' ? 'compact' : 'full'}
          />
        )}
        contentContainerStyle={styles.daySelectorContent}
        bounces={false}
      />
    </View>
  );
  
  const getProgressiveDays = () => {
    // Show days progressively: completed days + the next empty day
    const completedDays = trip.days.filter(d => d.memories.length > 0);
    const nextEmptyDay = trip.days.find(d => d.memories.length === 0);
    
    if (nextEmptyDay) {
      return [...completedDays, nextEmptyDay];
    }
    return completedDays;
  };
  
  const renderStoryView = () => {
    if (!currentDay) return null;
    
    // Check for next available day to add
    const nextDayToAdd = trip.days.find(d => d.memories.length === 0 && d.day !== selectedDay);
    
    return (
      <View style={styles.storyContainer}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleRow}>
            <Text style={[styles.dayNumber, { color: colors.text.primary }]}>
              Day {currentDay.day}
            </Text>
          </View>
        </View>
        
        {/* Photos */}
        <View style={styles.photosContainer}>
          {currentDay.memories.map(memory => (
            <MinimalPhotoCard
              key={memory.id}
              memory={memory}
              onPress={handlePhotoPress}
              onCaptionEdit={handleCaptionEdit}
              showCaption={showCaptions}
              isEditingCaption={editingCaptionId === memory.id}
              borderRadius={BORDER_RADIUS.md}
            />
          ))}
          
          {/* Add Memory Placeholder */}
          <TouchableOpacity 
            style={[styles.addMemoryPlaceholder, { 
              backgroundColor: colors.surface.secondary,
              borderColor: colors.border.secondary,
            }]}
            onPress={() => console.log('Add memory')}
          >
            <Icon name="plus" size="lg" color={colors.text.tertiary} />
            <Text style={[styles.addMemoryText, { color: colors.text.secondary }]}>
              Add Memory
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Empty state if no photos at all and no more days */}
        {!hasPhotos && !nextDayToAdd && (
          <View style={styles.emptyState}>
            <Icon name="camera" size="xxl" color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No photos yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Add your first memory from {currentDay.location || 'this day'}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderGridView = () => {
    const allMemories = trip.days.flatMap(day => 
      day.memories.map(memory => ({ ...memory, day: day.day }))
    );
    
    if (allMemories.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="grid" size="xxl" color={colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No photos in your trip
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Start adding memories to see them here
          </Text>
        </View>
      );
    }
    
    const gridWidth = screenWidth - SPACING.lg * 2;
    const photoSpacing = SPACING.xs;
    const photoWidth = (gridWidth - photoSpacing) / 2;
    
    return (
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridColumn}>
            {allMemories
              .filter((_, index) => index % 2 === 0)
              .map(memory => (
                <MinimalPhotoCard
                  key={memory.id}
                  memory={memory}
                  onPress={handlePhotoPress}
                  showCaption={false}
                  width={photoWidth}
                  borderRadius={BORDER_RADIUS.sm}
                />
              ))}
          </View>
          
          <View style={[styles.gridColumn, { marginLeft: photoSpacing }]}>
            {allMemories
              .filter((_, index) => index % 2 === 1)
              .map(memory => (
                <MinimalPhotoCard
                  key={memory.id}
                  memory={memory}
                  onPress={handlePhotoPress}
                  showCaption={false}
                  width={photoWidth}
                  borderRadius={BORDER_RADIUS.sm}
                />
              ))}
          </View>
        </View>
      </View>
    );
  };
  
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <PanGestureHandler 
        onGestureEvent={handleGesture} 
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View 
          style={[
            styles.modal,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Scrollable Content */}
          <Animated.ScrollView
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            {renderHeader()}
            
            <View style={styles.contentArea}>
              {/* Day Selector */}
              {renderDaySelector()}
              
              {/* Main Content */}
              {viewMode === 'story' ? renderStoryView() : renderGridView()}
            </View>
            
            {/* Add Next Day Button */}
            {viewMode === 'story' && renderAddNextDay()}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  modal: {
    flex: 1,
    backgroundColor: colors.surface.secondary, // Light grey background
    overflow: 'hidden',
  },
  
  dragHandleContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 3,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  
  // Header
  header: {
    height: 350, // Increased from 300
    position: 'relative',
    overflow: 'hidden',
  },
  
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  headerNav: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  titleContainer: {
    position: 'absolute',
    bottom: SPACING.xl * 2.5, // Moved up more from SPACING.xl * 2
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center', // Center align the text
  },
  
  tripTitle: {
    fontSize: 38,
    fontWeight: '400',
    color: 'white',
    marginBottom: SPACING.xs * 0.5, // Reduced from SPACING.xs
    fontFamily: 'Merienda',
    letterSpacing: -0.5,
  },
  
  tripDates: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.xs * 0.5, // Reduced gap to memories count
  },
  
  photoCountTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
  
  // Day Selector
  daySelector: {
    paddingBottom: SPACING.lg,
    marginTop: -SPACING.md, // Add negative margin to move up
  },
  
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg, // Increased from SPACING.md for bigger gap
  },
  
  daySelectorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    borderWidth: 1,
  },
  
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  daySelectorContent: {
    paddingHorizontal: SPACING.md,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  
  contentArea: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.xxl * 1.5, // Much more rounded
    borderTopRightRadius: BORDER_RADIUS.xxl * 1.5,
    marginTop: -BORDER_RADIUS.xxl * 1.5, // Increased negative margin for more overlap
    paddingTop: SPACING.xl * 1.5, // More padding to compensate
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  
  // Story View
  storyContainer: {
    paddingHorizontal: SPACING.lg,
  },
  
  dayHeader: {
    marginBottom: SPACING.xl,
  },
  
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  
  dayNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  
  dayLocation: {
    fontSize: 18,
    fontWeight: '500',
  },
  
  photosContainer: {
    gap: SPACING.lg,
  },
  
  addMemoryPlaceholder: {
    height: 120,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  
  addMemoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  addNextDayContainer: {
    padding: SPACING.lg,
  },

  addDayButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  
  addDayText: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  addDayLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Grid View
  gridContainer: {
    paddingHorizontal: SPACING.lg,
  },
  
  gridRow: {
    flexDirection: 'row',
  },
  
  gridColumn: {
    flex: 1,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.md,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  bottomSpacing: {
    height: 100,
  },
}); 