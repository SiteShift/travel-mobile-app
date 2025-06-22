import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Icon } from '../../src/components/Icon';
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

const StatBox = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
  <View style={styles.statBox}>
    <Icon name={icon} size="xl" color="#A1A1AA" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementBadge = ({ icon, title, unlocked }: { icon: string; title: string; unlocked: boolean }) => (
  <View style={[styles.badgeContainer, { opacity: unlocked ? 1 : 0.4 }]}>
    <View style={[styles.badgeIconCircle, unlocked && styles.badgeUnlocked]}>
      <Icon name={icon} size="lg" color={unlocked ? '#FFFFFF' : '#71717A'} />
    </View>
    <Text style={styles.badgeTitle}>{title}</Text>
  </View>
);

export default function ProfileTab() {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.level}>{user.level}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressLabel}>Next Level: Globetrotter</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBox icon="earth" value={user.stats.countries} label="Countries" />
          <StatBox icon="briefcase" value={user.stats.trips} label="Trips" />
          <StatBox icon="camera" value={user.stats.photos} label="Photos" />
          <StatBox icon="map" value={user.stats.kilometers} label="Kilometers" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((badge) => (
              <AchievementBadge key={badge.id} {...badge} />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
          <Text style={styles.footerSeparator}>•</Text>
          <Pressable><Text style={styles.footerLink}>Terms of Service</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#3F3F46' },
  name: { ...TYPOGRAPHY.styles.h2, color: '#FFFFFF', marginTop: SPACING.md },
  level: { ...TYPOGRAPHY.styles.body, color: '#A1A1AA', marginTop: SPACING.xs },
  
  progressSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  progressBarContainer: { height: 8, backgroundColor: '#1F1F22', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#34D399' },
  progressLabel: { ...TYPOGRAPHY.styles.caption, color: '#A1A1AA', alignSelf: 'center', marginTop: SPACING.sm },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#18181B', marginHorizontal: SPACING.xs, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  statValue: { ...TYPOGRAPHY.styles.h3, color: '#FFFFFF', marginVertical: SPACING.xs },
  statLabel: { ...TYPOGRAPHY.styles.body, color: '#71717A' },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.styles.h4, color: '#FFFFFF', marginBottom: SPACING.md },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  badgeContainer: { alignItems: 'center', width: '22%' },
  badgeIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1F1F22', justifyContent: 'center', alignItems: 'center' },
  badgeUnlocked: { backgroundColor: '#34D399' },
  badgeTitle: { ...TYPOGRAPHY.styles.caption, color: '#A1A1AA', marginTop: SPACING.sm, textAlign: 'center' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.lg },
  footerLink: { ...TYPOGRAPHY.styles.body, color: '#71717A' },
  footerSeparator: { color: '#71717A', marginHorizontal: SPACING.sm },
}); 