import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ViewStyle,
  ListRenderItem,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './Card';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';

export interface TimelineEntry {
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
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface TimelineProps {
  entries: TimelineEntry[];
  onEntryPress?: (entry: TimelineEntry) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showDateSeparators?: boolean;
  showAuthor?: boolean;
  compactMode?: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  onEntryPress,
  onRefresh,
  refreshing = false,
  showDateSeparators = true,
  showAuthor = false,
  compactMode = false,
  emptyStateTitle = 'No Entries Yet',
  emptyStateMessage = 'Start documenting your journey by adding your first entry.',
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
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

  const getWeatherIcon = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'sunny';
      case 'cloudy':
      case 'overcast':
        return 'cloud';
      case 'partly cloudy':
      case 'partly-cloudy':
        return 'partly-cloudy';
      case 'rainy':
      case 'rain':
        return 'rainy';
      case 'stormy':
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snowy':
      case 'snow':
        return 'snow';
      default:
        return 'thermometer';
    }
  };

  const shouldShowDateSeparator = (currentEntry: TimelineEntry, previousEntry?: TimelineEntry) => {
    if (!showDateSeparators || !previousEntry) return true;
    
    const currentDate = new Date(currentEntry.date).toDateString();
    const previousDate = new Date(previousEntry.date).toDateString();
    
    return currentDate !== previousDate;
  };

  const groupEntriesByDate = () => {
    if (!showDateSeparators) return entries;

    const grouped: (TimelineEntry | { type: 'separator'; date: string })[] = [];
    
    entries.forEach((entry, index) => {
      const previousEntry = index > 0 ? entries[index - 1] : undefined;
      
      if (shouldShowDateSeparator(entry, previousEntry)) {
        grouped.push({ type: 'separator', date: entry.date });
      }
      
      grouped.push(entry);
    });

    return grouped;
  };

  const renderDateSeparator = (date: string) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border.primary }]} />
      <View style={[styles.dateSeparatorBadge, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.dateSeparatorText, { color: colors.text.secondary }]}>
          {formatDate(date)}
        </Text>
      </View>
      <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border.primary }]} />
    </View>
  );

  const renderTimelineEntry = ({ item: entry }: { item: TimelineEntry }) => (
    <View style={styles.timelineItemContainer}>
      {/* Timeline Line */}
      <View style={styles.timelineLineContainer}>
        <View style={[styles.timelineDot, { backgroundColor: colors.primary[500] }]} />
        <View style={[styles.timelineLine, { backgroundColor: colors.border.secondary }]} />
      </View>

      {/* Entry Card */}
      <TouchableOpacity
        style={styles.entryContainer}
        onPress={() => onEntryPress?.(entry)}
        activeOpacity={0.7}
      >
        <Card variant="default" style={styles.entryCard}>
          {/* Entry Header */}
          <View style={styles.entryHeader}>
            <View style={styles.entryHeaderLeft}>
              {showAuthor && entry.author && (
                <Avatar
                  size="sm"
                  fallbackText={entry.author.name}
                  variant="circular"
                  style={styles.authorAvatar}
                />
              )}
              <View style={styles.entryMeta}>
                <Text style={[styles.entryTime, { color: colors.text.secondary }]}>
                  {formatTime(entry.time)}
                </Text>
                {showAuthor && entry.author && (
                  <Text style={[styles.authorName, { color: colors.text.tertiary }]}>
                    {entry.author.name}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.entryHeaderRight}>
              {entry.mood && (
                <Icon
                  name={getMoodIcon(entry.mood)}
                  size="sm"
                  color={getMoodColor(entry.mood)}
                  style={styles.moodIcon}
                />
              )}
              {entry.weather && (
                <View style={styles.weatherContainer}>
                  <Icon
                    name={getWeatherIcon(entry.weather.condition)}
                    size="xs"
                    color={colors.text.tertiary}
                  />
                  <Text style={[styles.weatherText, { color: colors.text.tertiary }]}>
                    {entry.weather.temperature}°
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Entry Title */}
          <Text style={[styles.entryTitle, { color: colors.text.primary }]}>
            {entry.title}
          </Text>

          {/* Entry Location */}
          <View style={styles.entryLocation}>
            <Icon name="map-pin" size="xs" color={colors.text.tertiary} />
            <Text style={[styles.entryLocationText, { color: colors.text.secondary }]}>
              {entry.location.name}
            </Text>
          </View>

          {/* Entry Content */}
          {!compactMode && (
            <Text 
              style={[styles.entryContent, { color: colors.text.secondary }]} 
              numberOfLines={compactMode ? 2 : undefined}
            >
              {entry.content}
            </Text>
          )}

          {/* Entry Footer */}
          <View style={styles.entryFooter}>
            <View style={styles.entryTags}>
              {entry.tags.slice(0, compactMode ? 2 : 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  size="small"
                  label={tag}
                  style={styles.tag}
                />
              ))}
              {entry.tags.length > (compactMode ? 2 : 3) && (
                <Badge
                  variant="default"
                  size="small"
                  label={`+${entry.tags.length - (compactMode ? 2 : 3)}`}
                  style={styles.tag}
                />
              )}
            </View>

            <View style={styles.entryStats}>
              {entry.photos.length > 0 && (
                <View style={styles.entryStat}>
                  <Icon name="camera" size="xs" color={colors.text.tertiary} />
                  <Text style={[styles.entryStatText, { color: colors.text.tertiary }]}>
                    {entry.photos.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );

  const renderItem: ListRenderItem<TimelineEntry | { type: 'separator'; date: string }> = ({ item, index }) => {
    if ('type' in item && item.type === 'separator') {
      return renderDateSeparator(item.date);
    }

    return renderTimelineEntry({ item: item as TimelineEntry });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="book" size="xxl" color={colors.text.tertiary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        {emptyStateTitle}
      </Text>
      <Text style={[styles.emptyStateMessage, { color: colors.text.secondary }]}>
        {emptyStateMessage}
      </Text>
    </View>
  );

  if (entries.length === 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {renderEmptyState()}
      </View>
    );
  }

  const timelineData = groupEntriesByDate();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <FlatList
        data={timelineData}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          'type' in item ? `separator-${item.date}-${index}` : item.id
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.md,
  },
  dateSeparatorText: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: SPACING.md,
    paddingTop: SPACING.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 60,
  },
  entryContainer: {
    flex: 1,
  },
  entryCard: {
    marginBottom: 0,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    marginRight: SPACING.sm,
  },
  entryMeta: {
    flex: 1,
  },
  entryTime: {
    ...TYPOGRAPHY.styles.caption,
    fontWeight: '600',
  },
  authorName: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 11,
  },
  entryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  moodIcon: {
    // No additional styles needed
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  weatherText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 11,
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
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 0,
    marginBottom: SPACING.xs,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    minHeight: 300,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 