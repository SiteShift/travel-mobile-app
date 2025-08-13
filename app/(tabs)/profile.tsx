import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, FlatList, Modal, Easing } from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import TrippinGame from '../../src/games/trippin/TrippinGame';

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
  const PROFILE_KEY = 'profile_settings_v1';
  const animatedProgress = React.useRef(new Animated.Value(0)).current;
  const themeAnim = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const [missions, setMissions] = React.useState<{ id: string; title: string; rewardXp: number; maxProgress: number; progress: number }[]>([]);
  const [xpSummary, setXpSummary] = React.useState<{ level: number; gained: number; span: number }>({ level: 1, gained: 0, span: 100 });
  const [avatarUri, setAvatarUri] = React.useState(user.avatar);
  const [displayName, setDisplayName] = React.useState(user.name);
  const [isEditProfileVisible, setIsEditProfileVisible] = React.useState(false);
  const [uniqueCountries, setUniqueCountries] = React.useState<number>(0);
  const [tripCount, setTripCount] = React.useState<number>(0);
  const [photoCount, setPhotoCount] = React.useState<number>(0);
  const [isGameVisible, setIsGameVisible] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const parrotBob = React.useRef(new Animated.Value(0)).current;
  const parrotBobLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const trippinHoldScale = React.useRef(new Animated.Value(1)).current;
  const trippinHoldTranslateY = React.useRef(new Animated.Value(0)).current;
  const trippinShimmer = React.useRef(new Animated.Value(0)).current;
  const [bestTrippinScore, setBestTrippinScore] = React.useState<number>(0);
  const TRIPPIN_BEST_KEY = 'trippin_best_score_v1';

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

  // Animate theme toggle knob when theme changes
  React.useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  React.useEffect(() => {
    (async () => {
      try {
        // Load persisted profile settings (name, avatar)
        const saved = await AsyncStorage.getItem(PROFILE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (typeof parsed?.name === 'string') setDisplayName(parsed.name);
            if (typeof parsed?.avatarUri === 'string') setAvatarUri(parsed.avatarUri);
          } catch {}
        }
        const list = await getMissions();
        setMissions(list);
        const state = await getLevelingState();
        const info = xpToNextLevel(state.xp || 0);
        setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp });
        // Load local best Trippin score for CTA
        try {
          const best = await AsyncStorage.getItem(TRIPPIN_BEST_KEY);
          setBestTrippinScore(best ? Number(best) : 0);
        } catch {}
      } catch {}
    })();
  }, []);

  // Parrot bobbing loop; pauses during scroll to avoid jank
  const startParrotBob = React.useCallback(() => {
    parrotBob.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(parrotBob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(parrotBob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    parrotBobLoopRef.current = anim;
    anim.start();
  }, [parrotBob]);

  React.useEffect(() => {
    if (isScrolling) {
      if (parrotBobLoopRef.current) parrotBobLoopRef.current.stop();
    } else {
      startParrotBob();
    }
    return () => { if (parrotBobLoopRef.current) parrotBobLoopRef.current.stop(); };
  }, [isScrolling, startParrotBob]);

  // Shimmer sweep across the card every ~7s
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(trippinShimmer, { toValue: 1, duration: 6800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(trippinShimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [trippinShimmer]);

  const computeUniqueCountries = React.useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tripKeys = keys.filter((k: string) => k.startsWith('trip_'));
      if (tripKeys.length === 0) {
        setUniqueCountries(0);
        return;
      }
      const pairs = await AsyncStorage.multiGet(tripKeys);
      const countries = new Set<string>();
      for (const [, v] of pairs) {
        if (!v) continue;
        try {
          const parsed = JSON.parse(v);
          const c = typeof parsed?.country === 'string' ? String(parsed.country).trim() : '';
          if (c) countries.add(c);
        } catch {}
      }
      setUniqueCountries(countries.size);
    } catch {
      setUniqueCountries(0);
    }
  }, []);

  React.useEffect(() => {
    computeUniqueCountries();
    // Also compute trips/photos on mount
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const tripKeys = keys.filter((k: string) => k.startsWith('trip_'));
        if (tripKeys.length === 0) {
          setTripCount(0);
          setPhotoCount(0);
        } else {
          const pairs = await AsyncStorage.multiGet(tripKeys);
          let trips = 0;
          let photos = 0;
          for (const [, v] of pairs) {
            if (!v) continue;
            try {
              const parsed = JSON.parse(v);
              if (parsed?.id && parsed?.title) trips += 1;
              if (typeof parsed?.totalPhotos === 'number') {
                photos += parsed.totalPhotos;
              } else if (Array.isArray(parsed?.days)) {
                photos += parsed.days.reduce((sum: number, d: any) => sum + (Array.isArray(d?.memories) ? d.memories.length : 0), 0);
              }
            } catch {}
          }
          setTripCount(trips);
          setPhotoCount(photos);
        }
      } catch {}
    })();
  }, [computeUniqueCountries]);

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
          await computeUniqueCountries();
          // refresh trips/photos too
          try {
            const keys = await AsyncStorage.getAllKeys();
            const tripKeys = keys.filter((k: string) => k.startsWith('trip_'));
            const pairs = await AsyncStorage.multiGet(tripKeys);
            let trips = 0; let photos = 0;
            for (const [, v] of pairs) {
              if (!v) continue;
              try {
                const parsed = JSON.parse(v);
                if (parsed?.id && parsed?.title) trips += 1;
                if (typeof parsed?.totalPhotos === 'number') photos += parsed.totalPhotos;
                else if (Array.isArray(parsed?.days)) photos += parsed.days.reduce((s: number, d: any) => s + (Array.isArray(d?.memories) ? d.memories.length : 0), 0);
              } catch {}
            }
            setTripCount(trips);
            setPhotoCount(photos);
          } catch {}
        } catch {}
      })();
      return () => { active = false; };
    }, [computeUniqueCountries])
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
      const newUri = res.assets[0].uri;
      setAvatarUri(newUri);
      // Persist immediately so it survives reloads
      try {
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: displayName, avatarUri: newUri }));
      } catch {}
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

  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    ).start();
  }, [pulse]);

  const getNextMilestone = (value: number, milestones: number[]) => {
    const sorted = [...milestones].sort((a, b) => a - b);
    const target = sorted.find(m => m > value) ?? sorted[sorted.length - 1];
    const progress = Math.min(1, value / target);
    const remaining = Math.max(0, target - value);
    return { target, progress, remaining };
  };

  const GamifiedStatCard = ({
    label,
    value,
    icon,
    gradient,
    milestones,
  }: {
    label: string;
    value: number;
    icon: string;
    gradient: [string, string];
    milestones: number[];
  }) => {
    const { target, progress, remaining } = React.useMemo(() => getNextMilestone(value, milestones), [value, milestones]);
    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
    const bandTranslate = pulse.interpolate({ inputRange: [0, 1], outputRange: [-60, 180] });
    const holdScale = React.useRef(new Animated.Value(1)).current;
    const holdTranslateY = React.useRef(new Animated.Value(0)).current;

    const onPressIn = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(holdScale, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 12 }),
        Animated.spring(holdTranslateY, { toValue: -2, useNativeDriver: true, tension: 300, friction: 12 }),
      ]).start();
    };

    const onPressOut = () => {
      Animated.parallel([
        Animated.spring(holdScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
        Animated.spring(holdTranslateY, { toValue: 0, useNativeDriver: true, tension: 300, friction: 10 }),
      ]).start();
    };
    return (
      <Animated.View style={[styles.gStatCardWrap, { transform: [{ scale }, { scale: holdScale }, { translateY: holdTranslateY }] }]}> 
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gStatCard, SHADOWS.md]}> 
          {/* Shimmer band */}
          <Animated.View style={[styles.gShimmerBand, { transform: [{ translateX: bandTranslate }] }]} />

          {/* Icon */}
          <View style={styles.gHeaderRow}>
            <View style={[styles.gIconBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}> 
              <Icon name={icon} size="md" color="#FFFFFF" />
            </View>
          </View>

          {/* Value */}
          <Text style={styles.gValue}>{value}</Text>
          <Text style={styles.gLabel}>{label}</Text>

          {/* Progress to next milestone */}
          <View style={[styles.gProgressTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}> 
            <View style={[styles.gProgressFill, { width: `${Math.max(6, progress * 100)}%`, backgroundColor: '#FFFFFF' }]} />
          </View>
          <Text style={styles.gProgressText}>
            {remaining === 0 ? 'Milestone reached!' : `${remaining} to ${target}`}
          </Text>
        </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxxl + SPACING.xl + SPACING.sm + SPACING.xs + SPACING.xs }}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        onMomentumScrollEnd={() => setIsScrolling(false)}
      >
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
          <View accessibilityLabel="Profile picture">
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: colors.accent[500] }]} />
          </View>
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
          <GamifiedStatCard
            label="Countries"
            value={uniqueCountries}
            icon="earth"
            gradient={["#34d399", "#059669"]}
            milestones={[5, 10, 20, 50]}
          />
          <GamifiedStatCard
            label="Trips"
            value={tripCount}
            icon="map"
            gradient={["#60a5fa", "#2563eb"]}
            milestones={[3, 10, 25, 50]}
          />
          <GamifiedStatCard
            label="Photos"
            value={photoCount}
            icon="camera"
            gradient={["#f59e0b", "#ef4444"]}
            milestones={[100, 500, 1000, 5000]}
          />
        </View>

        {/* Trippin' Game CTA - moved above Missions */}
        <View style={[styles.section, { marginBottom: SPACING.lg }]}> 
          <Pressable
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Animated.parallel([
                Animated.spring(trippinHoldScale, { toValue: 0.98, useNativeDriver: true, tension: 300, friction: 14 }),
                Animated.spring(trippinHoldTranslateY, { toValue: -1, useNativeDriver: true, tension: 300, friction: 14 }),
              ]).start();
            }}
            onPressOut={() => {
              Animated.parallel([
                Animated.spring(trippinHoldScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }),
                Animated.spring(trippinHoldTranslateY, { toValue: 0, useNativeDriver: true, tension: 300, friction: 12 }),
              ]).start();
            }}
            onPress={() => setIsGameVisible(true)}
            accessibilityLabel="Play Trippin – global leaderboard"
          >
            <Animated.View style={{ transform: [{ scale: trippinHoldScale }, { translateY: trippinHoldTranslateY }] }}>
              <LinearGradient
              colors={[ '#f59e0b', '#ef4444' ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.trippinCard, SHADOWS.xl]}
            >
                {/* Shimmer band (diagonal soft glow) */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.trippinShimmerBand,
                    { transform: [{ translateX: trippinShimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 400] }) }, { rotate: '18deg' }] },
                  ]}
                >
                  <LinearGradient
                    colors={[ 'rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)' ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              <View style={styles.trippinContentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trippinTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Play Trippin!</Text>
                  <Text style={styles.trippinSubtitle}>Compete against other travellers in a global leaderboard</Text>
                  <View style={styles.trippinCTAButtons}>
                    <View style={styles.trippinPlayPill}>
                      <Icon name="game-controller" size="sm" color="#111827" />
                      <Text style={styles.trippinPlayPillText}>Play Now</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.trippinArtWrap}>
                  <View style={styles.trippinArtCircleOuter} />
                  <View style={styles.trippinArtCircle} />
                    <Animated.View style={[styles.trippinArtShadowWrap, { transform: [{ translateY: parrotBob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}>
                    <Image
                      source={require('../../public/assets/TripMemo-parrot-logo-Photoroom_compressed.webp')}
                      style={styles.trippinArt}
                      contentFit="contain"
                    />
                    </Animated.View>
                </View>
              </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
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

        {/* Old Trippin CTA removed (replaced by banner above) */}

        
        {/* Centered Theme Toggle above footer */}
        <View style={styles.themeToggleWrapper}>
          <Pressable
            onPress={toggleTheme}
            accessibilityLabel="Toggle light or dark mode"
            style={[
              styles.themeTogglePill,
              { backgroundColor: colors.surface.secondary, borderColor: colors.border.secondary }
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.themeToggleKnob,
                {
                  backgroundColor: isDark ? '#6b7280' : '#f5a66b',
                  transform: [{ translateX: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 66] }) }],
                },
              ]}
            />
            <View style={styles.themeToggleIconsRow}>
              <Icon name={'sun'} size="md" color={isDark ? colors.text.tertiary : '#FFFFFF'} />
              <Icon name={'moon'} size="md" color={isDark ? '#FFFFFF' : colors.text.tertiary} />
            </View>
          </Pressable>
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
                <Image source={{ uri: avatarUri }} style={[styles.modalAvatar, { borderColor: colors.accent[500] }]} />
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
                <Button
                  title="Save"
                  onPress={async () => {
                    try {
                      const nameToSave = (displayName || '').trim() || user.name;
                      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: nameToSave, avatarUri }));
                      setDisplayName(nameToSave);
                    } catch {}
                    setIsEditProfileVisible(false);
                  }}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Trippin' Fullscreen Modal */}
      <Modal
        transparent={false}
        visible={isGameVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsGameVisible(false)}
      >
        <TrippinGame onClose={() => setIsGameVisible(false)} />
      </Modal>
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
  // Gamified cards
  gStatCardWrap: { flex: 1, marginHorizontal: SPACING.xs },
  gStatCard: { borderRadius: 16, padding: SPACING.md, overflow: 'hidden' },
  gHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  gIconBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gValue: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginTop: SPACING.sm, letterSpacing: -0.4 },
  gLabel: { ...TYPOGRAPHY.styles.caption, color: 'rgba(255,255,255,0.9)', marginTop: -4 },
  gProgressTrack: { height: 8, borderRadius: 4, marginTop: SPACING.sm, overflow: 'hidden' },
  gProgressFill: { height: '100%', borderRadius: 4 },
  gProgressText: { ...TYPOGRAPHY.styles.caption, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  gCornerBadge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gShimmerBand: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ rotate: '18deg' }] },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.styles.h4, marginBottom: SPACING.md },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  badgeContainer: { alignItems: 'center', width: '22%' },
  badgeIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  badgeTitle: { ...TYPOGRAPHY.styles.caption, marginTop: SPACING.sm, textAlign: 'center' },
  
  // Theme Toggle Styles
  themeToggleWrapper: { alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  themeTogglePill: { width: 122, height: 44, borderRadius: 22, padding: 4, borderWidth: 1, justifyContent: 'center' },
  themeToggleIconsRow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  themeToggleKnob: { position: 'absolute', left: 4, width: 48, height: 36, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: SPACING.lg - SPACING.xs, paddingBottom: SPACING.lg },
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

  // Trippin CTA styles
  trippinCard: { borderRadius: 18, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, paddingTop: SPACING.md, overflow: 'hidden' },
  trippinContentRow: { flexDirection: 'row', alignItems: 'center' },
  trippinBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  trippinBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  trippinBadgeText: { ...TYPOGRAPHY.styles.caption, color: '#111827', fontWeight: '800' },
  trippinTitle: { ...TYPOGRAPHY.styles.h2, color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.3, fontFamily: 'MagnoliaScript', fontSize: 56, lineHeight: 58, marginBottom: SPACING.xs },
  trippinSubtitle: { ...TYPOGRAPHY.styles.bodySmall, color: 'rgba(255,255,255,0.9)', opacity: 0.9, marginTop: 2, lineHeight: 18 },
  trippinCTAButtons: { flexDirection: 'row', gap: 8, marginTop: SPACING.md },
  trippinPlayPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
  trippinPlayPillText: { ...TYPOGRAPHY.styles.buttonSmall, color: '#111827', fontWeight: '900' },
  trippinArtWrap: { width: 140, height: 140, marginLeft: 12, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: 10 }] },
  trippinArtCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  trippinArtCircleOuter: { position: 'absolute', width: 134, height: 134, borderRadius: 67, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  trippinArtShadowWrap: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  trippinArt: { width: 140, height: 140, transform: [{ rotate: '-10deg' }] },
  trippinShimmerBand: { position: 'absolute', top: -28, bottom: -28, width: 140, backgroundColor: 'transparent', shadowColor: '#ffffff', shadowOpacity: 0.18, shadowRadius: 18 },
});