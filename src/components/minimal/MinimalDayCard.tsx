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
import { MinimalDay } from '../../types/tripDetailMinimal';
import { getDayOfWeek } from '../../data/minimalMockData';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Icon } from '../Icon';

interface MinimalDayCardProps {
  day: MinimalDay;
  isSelected: boolean;
  onPress: (day: number) => void;
  variant?: 'full' | 'compact';
}

const MinimalDayCard: React.FC<MinimalDayCardProps> = memo(({
  day,
  isSelected,
  onPress,
  variant = 'full'
}) => {
  const { colors } = useTheme();
  
  const handlePress = () => onPress(day.day);
  
  // Get hero image (first memory)
  const heroImage = day.memories[0];
  const photoCount = day.memories.length;
  const dayOfWeek = getDayOfWeek(day.date);
  const hasMemories = photoCount > 0;
  
  if (variant === 'compact') {
    // Simple circular day indicator
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: isSelected ? '#4A4A4A' : colors.surface.secondary, // Dark grey instead of blue
            borderColor: isSelected ? '#000000' : '#E5E5E5', // Dark black border for selected
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.compactDay,
          { color: isSelected ? 'white' : colors.text.primary }
        ]}>
          {day.day}
        </Text>
      </TouchableOpacity>
    );
  }
  
  // Full card with hero image
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: colors.border.secondary,
          borderWidth: 1,
          backgroundColor: hasMemories ? 'white' : colors.surface.secondary,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Hero Image or Empty State */}
      {hasMemories && heroImage ? (
        <>
                      <Image
              source={{ uri: heroImage.uri }} // ALWAYS use full-quality image, never thumbnails
              style={styles.heroImage}
              contentFit="cover"
              priority="high"
              cachePolicy="memory-disk"
              decodeFormat="rgb"
              transition={50}
              enableLiveTextInteraction={false}
              accessible={false}
            />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
        </>
      ) : (
        <View style={styles.emptyImage}>
          <Icon name="plus" size="xl" color={colors.text.tertiary} />
          <Text style={[styles.emptyDayLabel, { color: colors.text.secondary }]}>
            Day {day.day}
          </Text>
        </View>
      )}
      
      {/* Selected indicator - white tick on top right */}
      {isSelected && hasMemories && (
        <View style={styles.selectedIndicator}>
          <Icon name="check" size="sm" color="white" />
        </View>
      )}
      
      {/* Clean info overlay, only for days with memories */}
      {hasMemories && (
        <View style={styles.infoOverlay}>
          <Text style={[styles.dayLabel, { color: 'white' }]}>
            Day {day.day}
          </Text>
          <Text style={styles.photoCount}>
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  // Full card styles
  container: {
    width: 95, // Slightly smaller for better proportions
    height: 120, // Slightly smaller for better proportions
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
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
  
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  
  emptyImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  emptyDayLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  emptySubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'flex-start',
  },
  
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  
  dayLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans',
  },
  
  dayOfWeek: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  
  location: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  
  photoCount: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Compact circular day styles
  compactContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    position: 'relative',
  },
  
  compactDay: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

MinimalDayCard.displayName = 'MinimalDayCard';

export { MinimalDayCard }; 