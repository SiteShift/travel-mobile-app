import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  animationDuration?: number;
  borderRadius?: number;
  testID?: string;
}

// Base skeleton component with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  style,
  animationDuration = 1500,
  borderRadius = BORDER_RADIUS.sm,
  testID,
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [animatedValue, animationDuration]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          backgroundColor: colors.neutral[200],
          borderRadius,
        },
        style,
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.neutral[100],
            opacity,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

// Text skeleton with multiple lines
export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lineSpacing?: number;
  lastLineWidth?: string | number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  lineSpacing = SPACING.xs,
  lastLineWidth = '60%',
  style,
  testID,
}) => {
  return (
    <View style={[styles.textContainer, style]} testID={testID}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{
            marginBottom: index < lines - 1 ? lineSpacing : 0,
          }}
          testID={`${testID}-line-${index}`}
        />
      ))}
    </View>
  );
};

// Avatar skeleton (circular)
export interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 40,
  style,
  testID,
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      testID={testID}
    />
  );
};

// Card skeleton layout
export interface SkeletonCardProps {
  showAvatar?: boolean;
  showImage?: boolean;
  imageHeight?: number;
  avatarSize?: number;
  titleLines?: number;
  bodyLines?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  showImage = false,
  imageHeight = 200,
  avatarSize = 40,
  titleLines = 1,
  bodyLines = 3,
  style,
  testID,
}) => {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {/* Header with avatar and title */}
      <View style={styles.cardHeader}>
        {showAvatar && (
          <SkeletonAvatar
            size={avatarSize}
            testID={`${testID}-avatar`}
          />
        )}
        <View style={styles.cardHeaderText}>
          <SkeletonText
            lines={titleLines}
            lineHeight={18}
            lastLineWidth="80%"
            testID={`${testID}-title`}
          />
        </View>
      </View>

      {/* Image */}
      {showImage && (
        <Skeleton
          height={imageHeight}
          style={styles.cardImage}
          testID={`${testID}-image`}
        />
      )}

      {/* Body text */}
      <View style={styles.cardBody}>
        <SkeletonText
          lines={bodyLines}
          lineHeight={16}
          testID={`${testID}-body`}
        />
      </View>

      {/* Footer with action buttons */}
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={32} borderRadius={BORDER_RADIUS.md} />
        <Skeleton width={60} height={32} borderRadius={BORDER_RADIUS.md} />
      </View>
    </View>
  );
};

// List item skeleton
export interface SkeletonListItemProps {
  showAvatar?: boolean;
  showImage?: boolean;
  avatarSize?: number;
  imageSize?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  showAvatar = true,
  showImage = false,
  avatarSize = 48,
  imageSize = 60,
  style,
  testID,
}) => {
  return (
    <View style={[styles.listItem, style]} testID={testID}>
      {/* Left side - Avatar or Image */}
      {showAvatar && (
        <SkeletonAvatar
          size={avatarSize}
          style={styles.listItemAvatar}
          testID={`${testID}-avatar`}
        />
      )}
      {showImage && (
        <Skeleton
          width={imageSize}
          height={imageSize}
          borderRadius={BORDER_RADIUS.md}
          style={styles.listItemImage}
          testID={`${testID}-image`}
        />
      )}

      {/* Content */}
      <View style={styles.listItemContent}>
        <Skeleton
          width="80%"
          height={18}
          style={styles.listItemTitle}
          testID={`${testID}-title`}
        />
        <SkeletonText
          lines={2}
          lineHeight={14}
          lastLineWidth="60%"
          testID={`${testID}-subtitle`}
        />
      </View>

      {/* Right side - Action */}
      <Skeleton
        width={24}
        height={24}
        borderRadius={12}
        testID={`${testID}-action`}
      />
    </View>
  );
};

// Trip card skeleton
export const SkeletonTripCard: React.FC<{ style?: ViewStyle; testID?: string }> = ({
  style,
  testID,
}) => {
  return (
    <View style={[styles.tripCard, style]} testID={testID}>
      {/* Cover image */}
      <Skeleton
        height={200}
        style={styles.tripCardImage}
        testID={`${testID}-image`}
      />
      
      {/* Content overlay */}
      <View style={styles.tripCardContent}>
        <Skeleton
          width="70%"
          height={24}
          style={styles.tripCardTitle}
          testID={`${testID}-title`}
        />
        <Skeleton
          width="50%"
          height={16}
          style={styles.tripCardSubtitle}
          testID={`${testID}-subtitle`}
        />
        
        {/* Stats */}
        <View style={styles.tripCardStats}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={styles.tripCardStat}>
              <Skeleton width={30} height={12} />
              <Skeleton width={40} height={10} style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Entry card skeleton
export const SkeletonEntryCard: React.FC<{ style?: ViewStyle; testID?: string }> = ({
  style,
  testID,
}) => {
  return (
    <View style={[styles.entryCard, style]} testID={testID}>
      {/* Header */}
      <View style={styles.entryCardHeader}>
        <Skeleton width="60%" height={20} testID={`${testID}-title`} />
        <Skeleton width="30%" height={14} testID={`${testID}-date`} />
      </View>

      {/* Content */}
      <SkeletonText
        lines={4}
        lineHeight={16}
        lastLineWidth="40%"
        style={styles.entryCardContent}
        testID={`${testID}-content`}
      />

      {/* Media thumbnails */}
      <View style={styles.entryCardMedia}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            width={60}
            height={60}
            borderRadius={BORDER_RADIUS.md}
            style={styles.entryCardMediaItem}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.entryCardFooter}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

// Gallery skeleton
export interface SkeletonGalleryProps {
  columns?: number;
  items?: number;
  itemAspectRatio?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonGallery: React.FC<SkeletonGalleryProps> = ({
  columns = 2,
  items = 6,
  itemAspectRatio = 1,
  style,
  testID,
}) => {
  const itemWidth = `${(100 / columns) - 2}%`;
  
  return (
    <View style={[styles.gallery, style]} testID={testID}>
      {Array.from({ length: items }, (_, index) => (
        <Skeleton
          key={index}
          width={itemWidth}
          height={120 / itemAspectRatio}
          borderRadius={BORDER_RADIUS.md}
          style={styles.galleryItem}
          testID={`${testID}-item-${index}`}
        />
      ))}
    </View>
  );
};

// Loading states for different screens
export const SkeletonScreens = {
  // Profile screen
  Profile: ({ testID }: { testID?: string }) => (
    <View style={styles.screenContainer} testID={testID}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <SkeletonAvatar size={80} />
        <View style={styles.profileInfo}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} style={{ marginTop: SPACING.xs }} />
          <SkeletonText lines={2} lineHeight={14} style={{ marginTop: SPACING.sm }} />
        </View>
      </View>
      
      {/* Stats */}
      <View style={styles.profileStats}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.profileStat}>
            <Skeleton width={40} height={20} />
            <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      
      {/* Recent activity */}
      <View style={styles.profileActivity}>
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonListItem key={index} showImage style={{ marginBottom: SPACING.md }} />
        ))}
      </View>
    </View>
  ),

  // Trips list
  TripsList: ({ testID }: { testID?: string }) => (
    <View style={styles.screenContainer} testID={testID}>
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonTripCard key={index} style={{ marginBottom: SPACING.lg }} />
      ))}
    </View>
  ),

  // Trip detail
  TripDetail: ({ testID }: { testID?: string }) => (
    <View style={styles.screenContainer} testID={testID}>
      {/* Hero image */}
      <Skeleton height={250} style={{ marginBottom: SPACING.lg }} />
      
      {/* Title and info */}
      <Skeleton width="80%" height={28} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width="60%" height={16} style={{ marginBottom: SPACING.lg }} />
      
      {/* Timeline entries */}
      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonEntryCard key={index} style={{ marginBottom: SPACING.lg }} />
      ))}
    </View>
  ),

  // Entries list
  EntriesList: ({ testID }: { testID?: string }) => (
    <View style={styles.screenContainer} testID={testID}>
      {Array.from({ length: 5 }, (_, index) => (
        <SkeletonEntryCard key={index} style={{ marginBottom: SPACING.md }} />
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
  },
  
  // Card styles
  card: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardImage: {
    marginHorizontal: -SPACING.md,
    marginBottom: SPACING.md,
  },
  cardBody: {
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.md,
  },
  listItemAvatar: {
    marginRight: SPACING.md,
  },
  listItemImage: {
    marginRight: SPACING.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: SPACING.xs,
  },

  // Trip card styles
  tripCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: 'white',
    position: 'relative',
  },
  tripCardImage: {
    borderRadius: 0,
  },
  tripCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tripCardTitle: {
    marginBottom: SPACING.xs,
  },
  tripCardSubtitle: {
    marginBottom: SPACING.sm,
  },
  tripCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripCardStat: {
    alignItems: 'center',
  },

  // Entry card styles
  entryCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  entryCardContent: {
    marginBottom: SPACING.md,
  },
  entryCardMedia: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  entryCardMediaItem: {
    marginRight: SPACING.sm,
  },
  entryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Gallery styles
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    marginBottom: SPACING.sm,
  },

  // Screen styles
  screenContainer: {
    padding: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileActivity: {
    flex: 1,
  },
}); 