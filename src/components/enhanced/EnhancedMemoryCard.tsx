import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from '../Icon';
import { Avatar } from '../Avatar';
import { MemoryCardProps } from '../../types/tripDetail';
import { getMoodEmoji } from '../../data/enhancedMockData';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

const EnhancedMemoryCard: React.FC<MemoryCardProps> = memo(({
  memory,
  onPress,
  onLongPress,
  showMetadata = true,
  showPeople = true,
  style
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => onPress(memory);
  const handleLongPress = () => onLongPress?.(memory);
  
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const renderVideoOverlay = () => {
    if (memory.type !== 'video') return null;
    
    return (
      <View style={styles.videoOverlay}>
        <View style={styles.playButton}>
          <Icon name="play" size="md" color="white" />
        </View>
        {memory.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(memory.duration)}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderRating = () => {
    if (!memory.rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        {Array.from({ length: memory.rating }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size="xs"
            color={colors.warning[500]}
          />
        ))}
      </View>
    );
  };
  
  const renderHighlightBadge = () => {
    if (!memory.isHighlight) return null;
    
    return (
      <View style={styles.highlightBadge}>
        <Icon name="star" size="xs" color={colors.warning[500]} />
      </View>
    );
  };
  
  const renderPeopleIndicators = () => {
    if (!showPeople || !memory.people || memory.people.length === 0) return null;
    
    return (
      <View style={styles.peopleContainer}>
        {memory.people.slice(0, 3).map((person, index) => (
          <Avatar
            key={person.id}
            size="xs"
            source={person.avatar ? { uri: person.avatar } : undefined}
            fallbackText={person.name}
            style={{
              ...styles.personAvatar,
              marginLeft: index > 0 ? -8 : 0
            }}
          />
        ))}
        {memory.people.length > 3 && (
          <View style={[styles.personAvatar, styles.moreIndicator]}>
            <Text style={styles.moreText}>+{memory.people.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderEngagementStats = () => {
    if (!memory.viewCount && !memory.shareCount) return null;
    
    return (
      <View style={styles.engagementContainer}>
        {memory.viewCount && memory.viewCount > 0 && (
          <View style={styles.engagementStat}>
            <Icon name="eye" size="xs" color="rgba(255,255,255,0.8)" />
            <Text style={styles.engagementText}>{memory.viewCount}</Text>
          </View>
        )}
        
        {memory.shareCount && memory.shareCount > 0 && (
          <View style={styles.engagementStat}>
            <Icon name="share" size="xs" color="rgba(255,255,255,0.8)" />
            <Text style={styles.engagementText}>{memory.shareCount}</Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderMetadataOverlay = () => {
    if (!showMetadata) return null;
    
    return (
      <LinearGradient
        colors={[
          'transparent',
          'rgba(0,0,0,0.2)',
          'rgba(0,0,0,0.8)'
        ]}
        style={styles.metadataOverlay}
      >
        {/* Top Row - Highlights and Rating */}
        <View style={styles.topMetadata}>
          {renderHighlightBadge()}
          {renderRating()}
        </View>
        
        {/* Middle Row - People */}
        <View style={styles.middleMetadata}>
          {renderPeopleIndicators()}
        </View>
        
        {/* Bottom Row - Details */}
        <View style={styles.bottomMetadata}>
          {/* Time and Location */}
          <View style={styles.timeLocationContainer}>
            <Text style={styles.timeText}>
              {formatTime(memory.timestamp)}
            </Text>
            {memory.location && (
              <View style={styles.locationContainer}>
                <Icon name="map-pin" size="xs" color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {memory.location.name}
                </Text>
              </View>
            )}
          </View>
          
          {/* Weather and Mood */}
          <View style={styles.weatherMoodContainer}>
            {memory.weather && (
              <Text style={styles.weatherText}>
                {memory.weather.icon} {memory.weather.temperature}°
              </Text>
            )}
            {memory.mood && (
              <Text style={styles.moodText}>
                {getMoodEmoji(memory.mood)}
              </Text>
            )}
          </View>
          
          {/* Caption */}
          {memory.caption && (
            <Text style={styles.captionText} numberOfLines={2}>
              {memory.caption}
            </Text>
          )}
          
          {/* Engagement */}
          {renderEngagementStats()}
        </View>
      </LinearGradient>
    );
  };
  
  const aspectRatio = memory.width / memory.height;
  const cardHeight = 180 / aspectRatio;
  
  const dynamicStyles = createDynamicStyles(colors, isPressed, cardHeight);
  
  return (
    <Pressable
      style={[dynamicStyles.container, style]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      {/* Main Image */}
              <Image
          source={{ uri: memory.uri }} // ALWAYS use full-quality image, never thumbnails
          style={dynamicStyles.image}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
          decodeFormat="rgb"
          transition={50}
          enableLiveTextInteraction={false}
          accessible={false}
        />
      
      {/* Video Overlay */}
      {renderVideoOverlay()}
      
      {/* Metadata Overlay */}
      {renderMetadataOverlay()}
      
      {/* Selection State */}
      {isPressed && (
        <View style={dynamicStyles.pressedOverlay}>
          <View style={dynamicStyles.checkmark}>
            <Icon name="check" size="sm" color="white" />
          </View>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  
  metadataOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    justifyContent: 'flex-end',
  },
  
  topMetadata: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  middleMetadata: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  
  bottomMetadata: {
    gap: SPACING.xs,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  
  highlightBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  personAvatar: {
    borderWidth: 1,
    borderColor: 'white',
  },
  
  moreIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  
  moreText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  
  timeLocationContainer: {
    gap: 2,
  },
  
  timeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    flex: 1,
  },
  
  weatherMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  weatherText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
  },
  
  moodText: {
    fontSize: 12,
  },
  
  captionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  
  engagementContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 2,
  },
  
  engagementStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  
  engagementText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '500',
  },
});

const createDynamicStyles = (colors: any, isPressed: boolean, height: number) => StyleSheet.create({
  container: {
    height,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface.secondary,
    marginBottom: SPACING.sm,
    transform: [{ scale: isPressed ? 0.98 : 1 }],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isPressed ? 0.3 : 0.15,
    shadowRadius: isPressed ? 8 : 4,
    elevation: isPressed ? 8 : 4,
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  pressedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

EnhancedMemoryCard.displayName = 'EnhancedMemoryCard';

export { EnhancedMemoryCard }; 