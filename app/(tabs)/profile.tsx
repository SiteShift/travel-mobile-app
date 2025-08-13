import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Switch, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { getMissions, progressMission, getLevelingState, xpToNextLevel } from '../../src/utils/leveling';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
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
  const [missions, setMissions] = React.useState<{ id: string; title: string; rewardXp: number; maxProgress: number; progress: number }[]>([]);
  const [xpSummary, setXpSummary] = React.useState<{ level: number; gained: number; span: number }>({ level: 1, gained: 0, span: 100 });
  const [avatarUri, setAvatarUri] = React.useState(user.avatar);
  const [displayName, setDisplayName] = React.useState(user.name);
  const [isEditProfileVisible, setIsEditProfileVisible] = React.useState(false);

  // Level badge images removed from XP bar sides

  React.useEffect(() => {
    // Animate XP bar based on current level progress
    const pct = xpSummary.span > 0 ? Math.max(0, Math.min(100, (xpSummary.gained / xpSummary.span) * 100)) : 0;
    Animated.timing(animatedProgress, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [xpSummary.gained, xpSummary.span]);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await getMissions();
        setMissions(list);
        const state = await getLevelingState();
        const info = xpToNextLevel(state.xp || 0);
        setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp });
      } catch {}
    })();
  }, []);

  // Refresh on tab focus so new missions appear
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const list = await getMissions();
          const state = await getLevelingState();
          const info = xpToNextLevel(state.xp || 0);
          if (!active) return;
          setMissions(list);
          setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp });
        } catch {}
      })();
      return () => { active = false; };
    }, [])
  );

  const completeShareMission = async () => {
    try {
      await progressMission('share_app', 1);
      const list = await getMissions();
      setMissions(list);
      const state = await getLevelingState();
      const info = xpToNextLevel(state.xp || 0);
      setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp });
    } catch {}
  };

  const refreshXpSummary = async () => {
    try {
      const state = await getLevelingState();
      const info = xpToNextLevel(state.xp || 0);
      setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp });
    } catch {}
  };

  const handleChangeAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
      // Update avatar locally so UI reflects immediately
      setAvatarUri(res.assets[0].uri);
      // Progress the mission
      await progressMission('add_profile_picture', 1);
      const list = await getMissions();
      setMissions(list);
      await refreshXpSummary();
    } catch {}
  };

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
          <Pressable
            onPress={() => setIsEditProfileVisible(true)}
            style={[styles.editProfileBtn]}
            accessibilityLabel="Edit profile"
          >
            <Image
              source={require('../../public/assets/pencil-icon.svg')}
              style={{ width: 16, height: 16 }}
              contentFit="contain"
            />
          </Pressable>
          <Pressable onPress={handleChangeAvatar} accessibilityLabel="Change profile picture">
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: colors.border.secondary }]} />
          </Pressable>
          <Text style={[styles.name, { color: colors.text.primary }]}>{displayName}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}> 
            <View style={[styles.progressBarContainer]}> 
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
          </View>
          <Text style={[styles.progressLevelTitle, { color: colors.text.primary }]}>
            {`Level ${xpSummary.level}`}
          </Text>
          <Text style={[styles.progressXpSmall, { color: colors.text.secondary }]}>
            {`${xpSummary.gained}/${xpSummary.span} XP`}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBox icon="earth" value={user.stats.countries} label="Countries" />
          <StatBox icon="briefcase" value={user.stats.trips} label="Trips" />
          <StatBox icon="camera" value={user.stats.photos} label="Photos" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Missions</Text>
          <FlatList
            data={missions}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            renderItem={({ item: m, index }) => {
              const pct = m.maxProgress > 0 ? Math.min(1, (m.progress || 0) / m.maxProgress) : 0;
              const iconName = m.id === 'share_app' ? 'share' : m.id.includes('photos') ? 'camera' : m.id.includes('map') ? 'map' : m.id.includes('entry') ? 'edit' : 'award';
              const isDone = pct >= 1;
              return (
                <View style={styles.missionTileWrap}>
                  <View style={[styles.missionTile, { backgroundColor: colors.surface.secondary }]}>
                    {isDone && (
                      <View style={[styles.missionDonePill, { backgroundColor: '#22C55E' }]}> 
                        <Text style={styles.missionDonePillText}>Done</Text>
                      </View>
                    )}
                    <View style={[styles.missionIconCircleLg, { backgroundColor: 'rgba(239, 97, 68, 0.12)' }]}> 
                      <Icon name={iconName} size="xl" color={'#EF6144'} />
                    </View>
                    <Text style={[styles.missionTitleCenter, { color: colors.text.primary }]} numberOfLines={2}>{m.title}</Text>
                    <Text style={[styles.missionMetaCenter, { color: colors.text.secondary }]}>{`+${m.rewardXp} XP • ${m.progress}/${m.maxProgress}`}</Text>
                    <View style={styles.missionBarTrackSmall}>
                      <View style={[styles.missionBarFill, { width: `${pct * 100}%` }]} />
                    </View>
                    {m.id === 'share_app' && m.progress < m.maxProgress && (
                      <View style={{ marginTop: SPACING.xs }}>
                        <Button title="Share" onPress={completeShareMission} variant="primary" />
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
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

        {/* Edit Profile Modal */}
        <Modal
          transparent
          visible={isEditProfileVisible}
          animationType="fade"
          onRequestClose={() => setIsEditProfileVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface.primary }]}> 
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Profile</Text>
              <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
                <Image source={{ uri: avatarUri }} style={[styles.modalAvatar, { borderColor: colors.border.secondary }]} />
                <Button title="Change Photo" onPress={handleChangeAvatar} variant="secondary" />
              </View>
              <Input
                label="Name"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
                variant="outlined"
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setIsEditProfileVisible(false)} variant="ghost" />
                <Button title="Save" onPress={() => setIsEditProfileVisible(false)} variant="primary" />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  name: { ...TYPOGRAPHY.styles.h2, marginTop: SPACING.md },
  level: { ...TYPOGRAPHY.styles.body, marginTop: SPACING.xs },
  editProfileBtn: { position: 'absolute', right: SPACING.lg, top: SPACING.lg, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 97, 68, 0.12)' },
  
  progressSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl, alignItems: 'center' },
  progressRow: { width: '100%' },
  progressBarContainer: { height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  progressBar: { height: '100%', backgroundColor: '#EF6144' },
  progressLevelTitle: { ...TYPOGRAPHY.styles.h3, marginTop: SPACING.sm },
  progressXpSmall: { ...TYPOGRAPHY.styles.caption, marginTop: 2 },

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
  // Missions grid
  missionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  missionTileWrap: { width: '48%' },
  missionTile: { width: '100%', aspectRatio: 1, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  missionIconCircleLg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  missionTitleCenter: { ...TYPOGRAPHY.styles.body, fontWeight: '700', textAlign: 'center' },
  missionMetaCenter: { ...TYPOGRAPHY.styles.caption, marginTop: 2, textAlign: 'center' },
  missionBarTrackSmall: { marginTop: SPACING.xs, width: '100%', height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  missionBarFill: { height: '100%', backgroundColor: '#22C55E' },
  missionDonePill: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  missionDonePillText: { ...TYPOGRAPHY.styles.caption, color: '#FFFFFF', fontWeight: '800' },

  // Edit Profile Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  modalTitle: { ...TYPOGRAPHY.styles.h3, marginBottom: SPACING.md },
  modalAvatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, marginBottom: SPACING.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
});