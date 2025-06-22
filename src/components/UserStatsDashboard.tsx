import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from './Card';
import { Icon } from './Icon';
import { Badge } from './Badge';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface UserStats {
  totalTrips: number;
  totalEntries: number;
  totalPhotos: number;
  totalCountries: number;
  totalDays: number;
  totalWords: number;
  streakDays: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

export interface UserStatsDashboardProps {
  stats: UserStats;
  compact?: boolean;
  style?: any;
}

export const UserStatsDashboard: React.FC<UserStatsDashboardProps> = ({
  stats,
  compact = false,
  style,
}) => {
  const { colors } = useTheme();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getLevelProgress = (): number => {
    if (stats.nextLevelExp === 0) return 100;
    return (stats.experience / stats.nextLevelExp) * 100;
  };

  const renderStatCard = (label: string, value: string, icon: string, color: string) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size="sm" color={colors.text.inverse} />
      </View>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
    </Card>
  );

  const renderLevelCard = () => (
    <Card style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <Text style={[styles.levelTitle, { color: colors.text.primary }]}>
          Level {stats.level}
        </Text>
        <Badge
          label={`${Math.round(getLevelProgress())}%`}
          variant="default"
          size="small"
        />
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.primary }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary[500],
                width: `${getLevelProgress()}%`,
              }
            ]}
          />
        </View>
      </View>
      
      <Text style={[styles.levelSubtitle, { color: colors.text.secondary }]}>
        {stats.experience}/{stats.nextLevelExp} XP
      </Text>
    </Card>
  );

  if (compact) {
    return (
      <View style={style}>
        <View style={styles.compactGrid}>
          {renderStatCard('Trips', formatNumber(stats.totalTrips), 'map', colors.primary[500])}
          {renderStatCard('Countries', formatNumber(stats.totalCountries), 'earth', colors.secondary[500])}
          {renderStatCard('Entries', formatNumber(stats.totalEntries), 'notebook', colors.info[500])}
          {renderStatCard('Photos', formatNumber(stats.totalPhotos), 'camera', colors.warning[500])}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={style} showsVerticalScrollIndicator={false}>
      {renderLevelCard()}
      
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Travel Stats
      </Text>
      
      <View style={styles.statsGrid}>
        {renderStatCard('Trips', formatNumber(stats.totalTrips), 'map', colors.primary[500])}
        {renderStatCard('Countries', formatNumber(stats.totalCountries), 'earth', colors.secondary[500])}
        {renderStatCard('Entries', formatNumber(stats.totalEntries), 'notebook', colors.info[500])}
        {renderStatCard('Photos', formatNumber(stats.totalPhotos), 'camera', colors.warning[500])}
        {renderStatCard('Days', formatNumber(stats.totalDays), 'calendar', colors.success[500])}
        {renderStatCard('Words', formatNumber(stats.totalWords), 'text', colors.neutral[500])}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '45%',
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 100,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TYPOGRAPHY.styles.h3,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  levelCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  levelTitle: {
    ...TYPOGRAPHY.styles.h3,
  },
  levelSubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
}); 