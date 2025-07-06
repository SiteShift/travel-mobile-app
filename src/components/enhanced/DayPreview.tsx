import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from '../Icon';
import { DayPreviewProps } from '../../types/tripDetail';
import { getMoodEmoji, getWeatherIcon } from '../../data/enhancedMockData';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const DayPreview: React.FC<DayPreviewProps> = memo(({
  day,
  isSelected,
  onPress,
  onLongPress,
  showDetails = true
}) => {
  const { colors } = useTheme();
  
  const handlePress = () => onPress(day.day);
  const handleLongPress = () => onLongPress?.(day.day);
  
  const bestMemory = day.memories.find(m => m.id === day.bestPhoto) || day.memories[0];
  const moodEmoji = getMoodEmoji(day.mood);
  const weatherIcon = getWeatherIcon(day.weather?.condition || '');
  
  // Create rating stars
  const renderStars = () => {
    if (!day.rating) return null;
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size="xs"
            color={i < day.rating! ? colors.warning[500] : colors.neutral[300]}
          />
        ))}
      </View>
    );
  };
  
  const styles = createStyles(colors, isSelected);
  
  if (!showDetails) {
    // Simple mode - just day number and mood
    return (
      <TouchableOpacity
        style={styles.simpleContainer}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <Text style={styles.dayNumber}>{day.day}</Text>
        <Text style={styles.moodEmoji}>{moodEmoji}</Text>
        {day.memories.length > 0 && (
          <View style={styles.memoryIndicator} />
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      {/* Hero Image Background */}
      {bestMemory && (
        <Image
          source={{ uri: bestMemory.thumbnail || bestMemory.uri }}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      )}
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.1)',
          'rgba(0,0,0,0.3)',
          'rgba(0,0,0,0.7)'
        ]}
        style={styles.gradientOverlay}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayNumber}>{day.day}</Text>
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          </View>
          
          <View style={styles.weatherContainer}>
            <Text style={styles.weatherIcon}>{weatherIcon}</Text>
            <Text style={styles.temperature}>
              {day.weather?.temperature}°
            </Text>
          </View>
        </View>
        
        {/* Day Title */}
        <Text style={styles.dayTitle} numberOfLines={1}>
          {day.title}
        </Text>
        
        {/* Location */}
        <View style={styles.locationContainer}>
          <Icon name="map-pin" size="xs" color="white" />
          <Text style={styles.locationText} numberOfLines={1}>
            {day.primaryLocation?.name}
          </Text>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="camera" size="xs" color="white" />
            <Text style={styles.statText}>{day.photoCount}</Text>
          </View>
          
          {day.videoCount > 0 && (
            <View style={styles.statItem}>
              <Icon name="video" size="xs" color="white" />
              <Text style={styles.statText}>{day.videoCount}</Text>
            </View>
          )}
          
          <View style={styles.statItem}>
            <Icon name="clock" size="xs" color="white" />
            <Text style={styles.statText}>
              {Math.round((day.timeSpent || 0) / 60)}h
            </Text>
          </View>
          
          {day.distanceTraveled && (
            <View style={styles.statItem}>
              <Icon name="navigation" size="xs" color="white" />
              <Text style={styles.statText}>
                {day.distanceTraveled}mi
              </Text>
            </View>
          )}
        </View>
        
        {/* Rating */}
        {renderStars()}
        
        {/* Activity Highlights */}
        {day.activities && day.activities.length > 0 && (
          <View style={styles.activitiesContainer}>
            {day.activities.slice(0, 3).map((activity, index) => (
              <View key={index} style={styles.activityTag}>
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
            {day.activities.length > 3 && (
              <View style={styles.activityTag}>
                <Text style={styles.activityText}>
                  +{day.activities.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Highlight Indicator */}
        {day.memories.some(m => m.isHighlight) && (
          <View style={styles.highlightIndicator}>
            <Icon name="star" size="xs" color={colors.warning[500]} />
          </View>
        )}
      </View>
      
      {/* Selection Indicator */}
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Icon name="check" size="sm" color={colors.primary[500]} />
        </View>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (colors: any, isSelected: boolean) => StyleSheet.create({
  container: {
    width: 160,
    height: 200,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface.secondary,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected ? 'white' : colors.border.primary,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isSelected ? 0.3 : 0.15,
    shadowRadius: isSelected ? 8 : 4,
    elevation: isSelected ? 8 : 4,
  },
  
  simpleContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: isSelected ? colors.primary[500] : colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: isSelected ? 'white' : colors.border.primary,
    position: 'relative',
  },
  
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  dayInfo: {
    alignItems: 'center',
  },
  
  dayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'PlusJakartaSans',
  },
  
  moodEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  
  weatherContainer: {
    alignItems: 'center',
  },
  
  weatherIcon: {
    fontSize: 16,
  },
  
  temperature: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginTop: 2,
  },
  
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'PlusJakartaSans',
    marginTop: SPACING.sm,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  
  statsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  statText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
    marginLeft: 2,
  },
  
  starsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: 2,
  },
  
  activitiesContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
    gap: 4,
  },
  
  activityTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  activityText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '500',
  },
  
  highlightIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  selectionIndicator: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  memoryIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
});

DayPreview.displayName = 'DayPreview';

export { DayPreview }; 