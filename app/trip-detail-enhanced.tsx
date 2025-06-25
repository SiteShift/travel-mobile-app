import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Easing,
  Pressable,
  FlatList,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

// Enhanced Components
import { DayPreview } from '../src/components/enhanced/DayPreview';
import { EnhancedMemoryCard } from '../src/components/enhanced/EnhancedMemoryCard';

// Existing Components
import { Icon } from '../src/components/Icon';
import { Avatar } from '../src/components/Avatar';
import { Button } from '../src/components/Button';

// Context & Types
import { useTheme } from '../src/contexts/ThemeContext';
import { 
  TripStory, 
  EnhancedTripDay, 
  EnhancedMemory, 
  ViewModeConfig 
} from '../src/types/tripDetail';

// Data & Utils
import { mockTripStory, getMoodEmoji, getActivityIcon } from '../src/data/enhancedMockData';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HEADER_HEIGHT = 120;
const DAY_PREVIEW_HEIGHT = 240;
const STORY_HEADER_HEIGHT = 180;

interface TripDetailEnhancedProps {
  tripId?: string;
}

export default function TripDetailEnhanced({ tripId }: TripDetailEnhancedProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // State
  const [story, setStory] = useState<TripStory>(mockTripStory);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState<ViewModeConfig['mode']>('story');
  const [showMetadata, setShowMetadata] = useState(true);
  const [isStoryMode, setIsStoryMode] = useState(false);
  
  // Animation Values
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // Computed Values
  const currentDayData = useMemo(() => 
    story.days.find(day => day.day === selectedDay) || story.days[0],
    [story.days, selectedDay]
  );
  
  const storyStats = useMemo(() => ({
    totalMemories: story.totalPhotos + story.totalVideos,
    totalDays: story.totalDays,
    totalDistance: story.totalDistance,
    highlights: story.days.reduce((acc, day) => 
      acc + day.memories.filter(m => m.isHighlight).length, 0
    )
  }), [story]);
  
  // Effects
  useEffect(() => {
    translateY.setValue(screenHeight);
    Animated.spring(translateY, {
      toValue: 0,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
    
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [translateY, isDark]);
  
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const opacity = Math.max(0, 1 - value / 100);
      headerOpacity.setValue(opacity);
    });
    
    return () => scrollY.removeListener(listenerId);
  }, [scrollY, headerOpacity]);
  
  // Handlers
  const handleGestureStateChange = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: gestureY, velocityY } = event.nativeEvent;
      if (gestureY > 150 || velocityY > 1200) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start(() => router.back());
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
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
    
    // Haptic feedback would go here
    console.log(`Selected day ${day}`);
  }, []);
  
  const handleMemoryPress = useCallback((memory: EnhancedMemory) => {
    console.log('Open memory viewer:', memory.id);
    // Navigate to full-screen memory viewer
  }, []);
  
  const handleMemoryLongPress = useCallback((memory: EnhancedMemory) => {
    console.log('Memory actions:', memory.id);
    // Show action sheet: Share, Edit, Delete, etc.
  }, []);
  
  const toggleStoryMode = useCallback(() => {
    setIsStoryMode(!isStoryMode);
    
    // Animate the transition
    Animated.timing(headerOpacity, {
      toValue: isStoryMode ? 1 : 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isStoryMode, headerOpacity]);
  
  const handleShare = useCallback(() => {
    console.log('Share story');
  }, []);
  
  const handleSettings = useCallback(() => {
    console.log('Story settings');
  }, []);
  
  // Render Methods
  const renderStoryHeader = () => (
    <Animated.View 
      style={[
        styles.storyHeader,
        { 
          backgroundColor: colors.background.primary,
          opacity: headerOpacity 
        }
      ]}
    >
      {/* Hero Image */}
      <Image
        source={{ uri: story.coverImage }}
        style={styles.heroImage}
        contentFit="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.1)',
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.8)'
        ]}
        style={styles.heroGradient}
      />
      
      {/* Header Content */}
      <View style={styles.headerContent}>
        {/* Top Row - Navigation */}
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={router.back}
          >
            <Icon name="chevron-left" size="md" color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Icon name="share" size="md" color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleSettings}
            >
              <Icon name="more-horizontal" size="md" color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Story Info */}
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.storyDescription} numberOfLines={2}>
            {story.description}
          </Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="calendar" size="xs" color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>{story.totalDays} days</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="camera" size="xs" color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>{storyStats.totalMemories} memories</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="star" size="xs" color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>{storyStats.highlights} highlights</Text>
            </View>
            
            {story.totalDistance && (
              <View style={styles.statItem}>
                <Icon name="navigation" size="xs" color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{story.totalDistance}mi</Text>
              </View>
            )}
          </View>
          
          {/* Travelers */}
          <View style={styles.travelersRow}>
            <Text style={styles.travelersLabel}>Travelers</Text>
            <View style={styles.travelersList}>
              {story.travelers.map((traveler, index) => (
                <Avatar
                  key={traveler.id}
                  size="xs"
                  source={traveler.avatar ? { uri: traveler.avatar } : undefined}
                  fallbackText={traveler.name}
                  style={{
                    marginLeft: index > 0 ? -8 : 0,
                    borderWidth: 1,
                    borderColor: 'white'
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
      
      {/* Story Mode Toggle */}
      <TouchableOpacity 
        style={styles.storyModeToggle}
        onPress={toggleStoryMode}
      >
        <Icon 
          name={isStoryMode ? "grid" : "book"} 
          size="sm" 
          color={colors.primary[500]} 
        />
        <Text style={[styles.toggleText, { color: colors.primary[500] }]}>
          {isStoryMode ? 'Grid View' : 'Story Mode'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderDayNavigation = () => (
    <View style={[styles.dayNavigation, { backgroundColor: colors.background.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Your Journey
      </Text>
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={story.days}
        keyExtractor={(item) => `day-${item.day}`}
        renderItem={({ item }) => (
          <DayPreview
            day={item}
            isSelected={item.day === selectedDay}
            onPress={handleDaySelect}
            showDetails={!isStoryMode}
          />
        )}
        contentContainerStyle={styles.daysScrollContainer}
        bounces={false}
      />
    </View>
  );
  
  const renderDayStory = () => {
    if (!currentDayData) return null;
    
    return (
      <View style={styles.dayStoryContainer}>
        {/* Day Header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayTitleRow}>
            <View style={styles.dayNumberContainer}>
              <Text style={[styles.dayNumber, { color: colors.primary[500] }]}>
                {currentDayData.day}
              </Text>
              <Text style={styles.dayMood}>
                {getMoodEmoji(currentDayData.mood)}
              </Text>
            </View>
            
            <View style={styles.dayTitleInfo}>
              <Text style={[styles.dayTitle, { color: colors.text.primary }]}>
                {currentDayData.title}
              </Text>
              <Text style={[styles.dayDescription, { color: colors.text.secondary }]}>
                {currentDayData.description}
              </Text>
            </View>
            
            <View style={styles.dayRating}>
              {Array.from({ length: 5 }, (_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size="xs"
                  color={i < (currentDayData.rating || 0) ? colors.warning[500] : colors.neutral[300]}
                />
              ))}
            </View>
          </View>
          
          {/* Day Stats */}
          <View style={styles.dayStats}>
            <View style={styles.dayStatItem}>
              <Icon name="map-pin" size="xs" color={colors.text.secondary} />
              <Text style={[styles.dayStatText, { color: colors.text.secondary }]}>
                {currentDayData.primaryLocation?.name}
              </Text>
            </View>
            
            <View style={styles.dayStatItem}>
              <Icon name="clock" size="xs" color={colors.text.secondary} />
              <Text style={[styles.dayStatText, { color: colors.text.secondary }]}>
                {Math.round((currentDayData.timeSpent || 0) / 60)}h spent
              </Text>
            </View>
            
            {currentDayData.distanceTraveled && (
              <View style={styles.dayStatItem}>
                <Icon name="navigation" size="xs" color={colors.text.secondary} />
                <Text style={[styles.dayStatText, { color: colors.text.secondary }]}>
                  {currentDayData.distanceTraveled}mi traveled
                </Text>
              </View>
            )}
          </View>
          
          {/* Activities */}
          {currentDayData.activities && currentDayData.activities.length > 0 && (
            <View style={styles.activitiesContainer}>
              <Text style={[styles.activitiesLabel, { color: colors.text.secondary }]}>
                Activities
              </Text>
              <View style={styles.activitiesList}>
                {currentDayData.activities.map((activity, index) => (
                  <View key={index} style={[styles.activityChip, { backgroundColor: colors.surface.secondary }]}>
                    <Text style={styles.activityIcon}>
                      {getActivityIcon(activity)}
                    </Text>
                    <Text style={[styles.activityText, { color: colors.text.primary }]}>
                      {activity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Memories Grid */}
        <View style={styles.memoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Memories from this day
          </Text>
          
          {currentDayData.memories.length > 0 ? (
            <View style={styles.memoriesGrid}>
              <View style={styles.memoriesColumn}>
                {currentDayData.memories
                  .filter((_, index) => index % 2 === 0)
                  .map((memory) => (
                    <EnhancedMemoryCard
                      key={memory.id}
                      memory={memory}
                      onPress={handleMemoryPress}
                      onLongPress={handleMemoryLongPress}
                      showMetadata={showMetadata}
                      showPeople={true}
                    />
                  ))}
              </View>
              
              <View style={styles.memoriesColumn}>
                {currentDayData.memories
                  .filter((_, index) => index % 2 === 1)
                  .map((memory) => (
                    <EnhancedMemoryCard
                      key={memory.id}
                      memory={memory}
                      onPress={handleMemoryPress}
                      onLongPress={handleMemoryLongPress}
                      showMetadata={showMetadata}
                      showPeople={true}
                    />
                  ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyMemories}>
              <Icon name="camera" size="xxl" color={colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No memories yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                Add photos and videos from this day to see them here
              </Text>
              
              <Button
                title="Add Memory"
                variant="primary"
                onPress={() => console.log('Add memory')}
                style={styles.addMemoryButton}
              />
            </View>
          )}
        </View>
        
        {/* Day Highlights */}
        {currentDayData.highlights && currentDayData.highlights.length > 0 && (
          <View style={styles.highlightsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Day Highlights
            </Text>
            
            {currentDayData.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Icon name="star" size="sm" color={colors.warning[500]} />
                <Text style={[styles.highlightText, { color: colors.text.primary }]}>
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={handleGesture} onHandlerStateChange={handleGestureStateChange}>
        <Animated.View style={[styles.modal, { transform: [{ translateY }] }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Story Header */}
          {renderStoryHeader()}
          
          {/* Scrollable Content */}
          <Animated.ScrollView
            style={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Day Navigation */}
            {renderDayNavigation()}
            
            {/* Day Story Content */}
            {renderDayStory()}
            
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
    backgroundColor: colors.background.primary,
    marginTop: 60,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  
  dragHandleContainer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
  },
  
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.secondary,
    borderRadius: 2,
  },
  
  storyHeader: {
    height: STORY_HEADER_HEIGHT,
    position: 'relative',
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
  
  headerContent: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  storyInfo: {
    gap: SPACING.sm,
  },
  
  storyTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
  },
  
  storyDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  statText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  travelersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  travelersLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  travelersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  storyModeToggle: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
  },
  
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  scrollContent: {
    flex: 1,
  },
  
  dayNavigation: {
    paddingVertical: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  
  daysScrollContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  
  dayStoryContainer: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
  
  dayHeader: {
    gap: SPACING.md,
  },
  
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  
  dayNumberContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  
  dayNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  
  dayMood: {
    fontSize: 20,
    marginTop: SPACING.xs,
  },
  
  dayTitleInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  
  dayTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  
  dayDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  dayRating: {
    flexDirection: 'row',
    gap: 2,
  },
  
  dayStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  
  dayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  dayStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  activitiesContainer: {
    gap: SPACING.sm,
  },
  
  activitiesLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  activitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  
  activityIcon: {
    fontSize: 16,
  },
  
  activityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  memoriesSection: {
    gap: SPACING.md,
  },
  
  memoriesGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  memoriesColumn: {
    flex: 1,
  },
  
  emptyMemories: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  addMemoryButton: {
    marginTop: SPACING.md,
  },
  
  highlightsSection: {
    gap: SPACING.md,
  },
  
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  highlightText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  
  bottomSpacing: {
    height: 100,
  },
}); 