import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';

// --- MOCK DATA ---
const user = {
  name: 'Samantha',
  avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop&q=80',
  level: 'World Wanderer',
  progress: 72, // Percentage to next level
  stats: {
    countries: 14,
    trips: 21,
    photos: 873,
    kilometers: '48,209',
  },
};

const achievements = [
  { id: '1', icon: 'airplane', title: 'First Flight', unlocked: true },
  { id: '2', icon: 'earth', title: 'Continent Hopper', unlocked: true },
  { id: '3', icon: 'flag', title: '5 Countries', unlocked: true },
  { id: '4', icon: 'camera', title: '100 Photos', unlocked: true },
  { id: '5', icon: 'compass', title: 'Epic Roadtrip', unlocked: true },
  { id: '6', icon: 'star', title: '7 Wonders', unlocked: false },
  { id: '7', icon: 'key', title: 'Solo Traveler', unlocked: false },
  { id: '8', icon: 'mountain', title: 'Mountain Peak', unlocked: false },
];
// --- END MOCK DATA ---

export default function ProfileTab() {
  const { colors, isDark, toggleTheme } = useTheme();
  const animatedProgress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: user.progress,
      duration: 1000,
      useNativeDriver: false,
      delay: 500,
    }).start();
  }, [user.progress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const StatBox = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
    <View style={[styles.statBox, { backgroundColor: colors.surface.secondary }]}>
      <Icon name={icon} size="xl" color={colors.text.tertiary} />
      <Text style={[styles.statValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{label}</Text>
    </View>
  );

  const AchievementBadge = ({ icon, title, unlocked }: { icon: string; title: string; unlocked: boolean }) => (
    <View style={[styles.badgeContainer, { opacity: unlocked ? 1 : 0.4 }]}>
      <View style={[
        styles.badgeIconCircle, 
        { backgroundColor: colors.surface.secondary },
        unlocked && { backgroundColor: colors.success[500] }
      ]}>
        <Icon name={icon} size="lg" color={unlocked ? '#FFFFFF' : colors.text.tertiary} />
      </View>
      <Text style={[styles.badgeTitle, { color: colors.text.tertiary }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.border.secondary }]} />
          <Text style={[styles.name, { color: colors.text.primary }]}>{user.name}</Text>
          <Text style={[styles.level, { color: colors.text.secondary }]}>{user.level}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surface.secondary }]}>
            <Animated.View style={[styles.progressBar, { backgroundColor: colors.success[500], width: progressWidth }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>Next Level: Globetrotter</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBox icon="earth" value={user.stats.countries} label="Countries" />
          <StatBox icon="briefcase" value={user.stats.trips} label="Trips" />
          <StatBox icon="camera" value={user.stats.photos} label="Photos" />
          <StatBox icon="map" value={user.stats.kilometers} label="Kilometers" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((badge) => (
              <AchievementBadge key={badge.id} {...badge} />
            ))}
          </View>
        </View>

        {/* Theme Toggle Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Appearance</Text>
          <View style={[styles.themeToggleContainer, { backgroundColor: colors.surface.secondary }]}>
            <View style={styles.themeToggleContent}>
              <Icon name={isDark ? 'moon' : 'sun'} size="lg" color={colors.primary[500]} />
              <View style={styles.themeToggleText}>
                <Text style={[styles.themeToggleTitle, { color: colors.text.primary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.themeToggleSubtitle, { color: colors.text.secondary }]}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border.secondary, true: colors.primary[500] }}
                thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable><Text style={[styles.footerLink, { color: colors.text.tertiary }]}>Privacy Policy</Text></Pressable>
          <Text style={[styles.footerSeparator, { color: colors.text.tertiary }]}>•</Text>
          <Pressable><Text style={[styles.footerLink, { color: colors.text.tertiary }]}>Terms of Service</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  name: { ...TYPOGRAPHY.styles.h2, marginTop: SPACING.md },
  level: { ...TYPOGRAPHY.styles.body, marginTop: SPACING.xs },
  
  progressSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%' },
  progressLabel: { ...TYPOGRAPHY.styles.caption, alignSelf: 'center', marginTop: SPACING.sm },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  statBox: { flex: 1, alignItems: 'center', marginHorizontal: SPACING.xs, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  statValue: { ...TYPOGRAPHY.styles.h3, marginVertical: SPACING.xs },
  statLabel: { ...TYPOGRAPHY.styles.body },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.styles.h4, marginBottom: SPACING.md },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  badgeContainer: { alignItems: 'center', width: '22%' },
  badgeIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  badgeTitle: { ...TYPOGRAPHY.styles.caption, marginTop: SPACING.sm, textAlign: 'center' },
  
  // Theme Toggle Styles
  themeToggleContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  themeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  themeToggleText: {
    flex: 1,
  },
  themeToggleTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  themeToggleSubtitle: {
    ...TYPOGRAPHY.styles.bodySmall,
  },
  
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.lg },
  footerLink: { ...TYPOGRAPHY.styles.body },
  footerSeparator: { marginHorizontal: SPACING.sm },
});