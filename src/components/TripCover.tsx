import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ViewStyle,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TripCoverSize = 'small' | 'medium' | 'large' | 'hero';
export type TripCoverVariant = 'default' | 'minimal' | 'detailed';

export interface TripCoverProps {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUri?: string;
  size?: TripCoverSize;
  variant?: TripCoverVariant;
  status?: 'upcoming' | 'active' | 'completed';
  entryCount?: number;
  photoCount?: number;
  onPress?: () => void;
  onImagePress?: () => void;
  showStats?: boolean;
  showStatus?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const TripCover: React.FC<TripCoverProps> = ({
  title,
  destination,
  startDate,
  endDate,
  coverImageUri,
  size = 'medium',
  variant = 'default',
  status = 'completed',
  entryCount = 0,
  photoCount = 0,
  onPress,
  onImagePress,
  showStats = true,
  showStatus = true,
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const getCoverHeight = () => {
    switch (size) {
      case 'small':
        return 120;
      case 'medium':
        return 180;
      case 'large':
        return 240;
      case 'hero':
        return 320;
      default:
        return 180;
    }
  };

  const getContainerStyles = (): ViewStyle => {
    return {
      height: getCoverHeight(),
      borderRadius: size === 'hero' ? 0 : BORDER_RADIUS.lg,
      overflow: 'hidden',
      ...SHADOWS.md,
    };
  };

  const formatDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'upcoming':
        return colors.primary[500];
      case 'completed':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'In Progress';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };

  const renderDefaultImage = () => (
    <View style={[styles.defaultImageContainer, { backgroundColor: colors.surface.secondary }]}>
      <Icon 
        name="camera" 
        size={size === 'hero' ? 'xxl' : size === 'large' ? 'xl' : 'lg'} 
        color={colors.text.tertiary} 
      />
      <Text style={[styles.defaultImageText, { color: colors.text.tertiary }]}>
        No Cover Photo
      </Text>
    </View>
  );

  const renderOverlayContent = () => {
    if (variant === 'minimal') {
      return (
        <View style={styles.minimalOverlay}>
          <Text style={[styles.minimalTitle, { color: colors.text.inverse }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.overlayContent}>
        {/* Status Badge */}
        {showStatus && (
          <View style={styles.statusContainer}>
                         <Badge
               variant={status === 'active' ? 'success' : status === 'upcoming' ? 'primary' : 'default'}
               size="small"
               label={getStatusText()}
             />
          </View>
        )}

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <Text style={[styles.tripTitle, { color: colors.text.inverse }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.tripDestination, { color: colors.text.inverse }]} numberOfLines={1}>
            {destination}
          </Text>
          <Text style={[styles.tripDates, { color: colors.text.inverse }]}>
            {formatDateRange()}
          </Text>

          {/* Stats */}
          {showStats && variant === 'detailed' && (
            <View style={styles.statsRow}>
              {entryCount > 0 && (
                <View style={styles.statItem}>
                  <Icon name="book" size="xs" color={colors.text.inverse} />
                  <Text style={[styles.statText, { color: colors.text.inverse }]}>
                    {entryCount}
                  </Text>
                </View>
              )}
              {photoCount > 0 && (
                <View style={styles.statItem}>
                  <Icon name="camera" size="xs" color={colors.text.inverse} />
                  <Text style={[styles.statText, { color: colors.text.inverse }]}>
                    {photoCount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Button */}
        {onImagePress && (
          <TouchableOpacity style={styles.imageAction} onPress={onImagePress}>
            <Icon name="expand" size="md" color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => (
    <>
      {coverImageUri ? (
        <ImageBackground
          source={{ uri: coverImageUri }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          >
            {renderOverlayContent()}
          </LinearGradient>
        </ImageBackground>
      ) : (
        <>
          {renderDefaultImage()}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
            style={styles.gradient}
          >
            {renderOverlayContent()}
          </LinearGradient>
        </>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getContainerStyles(), style]}
        onPress={onPress}
        activeOpacity={0.9}
        testID={testID}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getContainerStyles(), style]} testID={testID}>
      {renderContent()}
    </View>
  );
};

// Convenience components for common use cases
export const HeroTripCover: React.FC<Omit<TripCoverProps, 'size' | 'variant'>> = (props) => (
  <TripCover {...props} size="hero" variant="detailed" />
);

export const CompactTripCover: React.FC<Omit<TripCoverProps, 'size' | 'variant'>> = (props) => (
  <TripCover {...props} size="small" variant="minimal" showStats={false} />
);

export const DetailedTripCover: React.FC<Omit<TripCoverProps, 'variant'>> = (props) => (
  <TripCover {...props} variant="detailed" />
);

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  defaultImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  defaultImageText: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  tripInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tripTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tripDestination: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tripDates: {
    ...TYPOGRAPHY.styles.caption,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    ...TYPOGRAPHY.styles.caption,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageAction: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
  },
  minimalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  minimalTitle: {
    ...TYPOGRAPHY.styles.h4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 