import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, FlatList, Modal, Easing, Share, ActivityIndicator } from 'react-native';
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
const TrippinGameLazy = React.lazy(() => import('../../src/games/trippin/TrippinGame'));

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
  const themeToggleScale = React.useRef(new Animated.Value(1)).current;
  const [missions, setMissions] = React.useState<{ id: string; title: string; rewardXp: number; maxProgress: number; progress: number }[]>([]);
  const [xpSummary, setXpSummary] = React.useState<{ level: number; gained: number; span: number; totalXp: number }>({ level: 1, gained: 0, span: 100, totalXp: 0 });
  const [avatarUri, setAvatarUri] = React.useState(user.avatar);
  const [displayName, setDisplayName] = React.useState(user.name);
  const [isEditProfileVisible, setIsEditProfileVisible] = React.useState(false);
  const [tempName, setTempName] = React.useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = React.useState<boolean>(false);
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

  // Trip mission badge images by target count
  const TRIP_MISSION_BADGES: Record<number, any> = {
    1: require('../../public/assets/Tripmission-badgeimages/tripmission-1_compressed.webp'),
    2: require('../../public/assets/Tripmission-badgeimages/tripmission-2_compressed.webp'),
    3: require('../../public/assets/Tripmission-badgeimages/tripmission-3_compressed.webp'),
    5: require('../../public/assets/Tripmission-badgeimages/tripmission-5_compressed.webp'),
    10: require('../../public/assets/Tripmission-badgeimages/tripmission-10_compressed.webp'),
    15: require('../../public/assets/Tripmission-badgeimages/tripmission-15_compressed.webp'),
    20: require('../../public/assets/Tripmission-badgeimages/tripmission-20_compressed.webp'),
    25: require('../../public/assets/Tripmission-badgeimages/tripmission-25_compressed.webp'),
    30: require('../../public/assets/Tripmission-badgeimages/tripmission-30_compressed.webp'),
    40: require('../../public/assets/Tripmission-badgeimages/tripmission-40_compressed.webp'),
    50: require('../../public/assets/Tripmission-badgeimages/tripmission-50_compressed.webp'),
  };

  const getTripMissionBadgeSource = (target: number) => {
    if (TRIP_MISSION_BADGES[target]) return TRIP_MISSION_BADGES[target];
    // Fallback: pick the nearest lower available badge, or 1 as last resort
    const available = Object.keys(TRIP_MISSION_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= target) chosen = v;
      else break;
    }
    return TRIP_MISSION_BADGES[chosen] || TRIP_MISSION_BADGES[1];
  };

  // Photo mission badge images by target count (extended thresholds)
  const PHOTO_MISSION_BADGES: Record<number, any> = {
    5: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-5_compressed.webp'),
    10: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-10_compressed.webp'),
    25: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-25_compressed.webp'),
    50: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-50_compressed.webp'),
    100: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-100_compressed.webp'),
    250: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-250_compressed.webp'),
    500: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-500_compressed.webp'),
    1000: require('../../public/assets/tripmemo-addphotomission-badges/addphotosmission-1000_compressed.webp'),
  };

  const getPhotoMissionBadgeSource = (target: number) => {
    if (PHOTO_MISSION_BADGES[target]) return PHOTO_MISSION_BADGES[target];
    const available = Object.keys(PHOTO_MISSION_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= target) chosen = v;
      else break;
    }
    return PHOTO_MISSION_BADGES[chosen] || PHOTO_MISSION_BADGES[5];
  };

  // Visit countries mission badge images by target count
  const VISIT_COUNTRIES_BADGES: Record<number, any> = {
    1: require('../../public/assets/visitcountry-missionbadges/visitcountry-1_compressed.webp'),
    2: require('../../public/assets/visitcountry-missionbadges/visitcountry-2_compressed.webp'),
    3: require('../../public/assets/visitcountry-missionbadges/visitcountry-3_compressed.webp'),
    4: require('../../public/assets/visitcountry-missionbadges/visitcountry-4_compressed.webp'),
    5: require('../../public/assets/visitcountry-missionbadges/visitcountry-5_compressed.webp'),
    6: require('../../public/assets/visitcountry-missionbadges/visitcountry-6_compressed.webp'),
    7: require('../../public/assets/visitcountry-missionbadges/visitcountry-7_compressed.webp'),
    8: require('../../public/assets/visitcountry-missionbadges/visitcountry-8_compressed.webp'),
    9: require('../../public/assets/visitcountry-missionbadges/visitcountry-9_compressed.webp'),
    10: require('../../public/assets/visitcountry-missionbadges/visitcountry-10_compressed.webp'),
    15: require('../../public/assets/visitcountry-missionbadges/visitcountry-15_compressed.webp'),
    25: require('../../public/assets/visitcountry-missionbadges/visitcountry-25_compressed.webp'),
    50: require('../../public/assets/visitcountry-missionbadges/visitcountry-50_compressed.webp'),
    100: require('../../public/assets/visitcountry-missionbadges/visitcountry-100_compressed.webp'),
  };

  const getVisitCountriesBadgeSource = (target: number) => {
    if (VISIT_COUNTRIES_BADGES[target]) return VISIT_COUNTRIES_BADGES[target];
    const available = Object.keys(VISIT_COUNTRIES_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= target) chosen = v;
      else break;
    }
    return VISIT_COUNTRIES_BADGES[chosen] || VISIT_COUNTRIES_BADGES[1];
  };

  // One-off mission: Add a profile picture badge
  const ADD_PROFILE_PICTURE_BADGE = require('../../public/assets/addprofilepicture-missionbadge_compressed.webp');
  const SHARE_APP_BADGE = require('../../public/assets/tripmemo-sharetheappmission_compressed.webp');
  const PLAY_TRIPPIN_BADGE = require('../../public/assets/playtrippin-mission_compressed.webp');

  // Day streak mission badges
  const DAY_STREAK_BADGES: Record<number, any> = {
    3: require('../../public/assets/daystreakmission-badges/daystreakmission-3_compressed.webp'),
    5: require('../../public/assets/daystreakmission-badges/daystreakmission-5_compressed.webp'),
    7: require('../../public/assets/daystreakmission-badges/daystreakmission-7_compressed.webp'),
    10: require('../../public/assets/daystreakmission-badges/daystreakmission-10_compressed.webp'),
    30: require('../../public/assets/daystreakmission-badges/daystreakmission-30_compressed.webp'),
  };

  const getDayStreakBadgeSource = (target: number) => {
    if (DAY_STREAK_BADGES[target]) return DAY_STREAK_BADGES[target];
    const available = Object.keys(DAY_STREAK_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= target) chosen = v;
      else break;
    }
    return DAY_STREAK_BADGES[chosen] || DAY_STREAK_BADGES[3];
  };

  // Level achievement badges (levels 1-10)
  const LEVEL_BADGES: Record<number, any> = {
    1: require('../../public/assets/Trip Memo Level Badges for home page/level-1-level-badge_compressed.webp'),
    2: require('../../public/assets/Trip Memo Level Badges for home page/level-2-level-badge_compressed.webp'),
    3: require('../../public/assets/Trip Memo Level Badges for home page/level-3-level-badge_compressed.webp'),
    4: require('../../public/assets/Trip Memo Level Badges for home page/level-4-level-badge_compressed.webp'),
    5: require('../../public/assets/Trip Memo Level Badges for home page/level-5-level-badge_compressed.webp'),
    6: require('../../public/assets/Trip Memo Level Badges for home page/level-6-level-badge_compressed.webp'),
    7: require('../../public/assets/Trip Memo Level Badges for home page/level-7-level-badge_compressed.webp'),
    8: require('../../public/assets/Trip Memo Level Badges for home page/level-8-level-badge_compressed.webp'),
    9: require('../../public/assets/Trip Memo Level Badges for home page/level-9-level-badge_compressed.webp'),
    10: require('../../public/assets/Trip Memo Level Badges for home page/level-10-level-badge_compressed.webp'),
  };

  const getLevelBadgeSource = (level: number) => {
    if (LEVEL_BADGES[level]) return LEVEL_BADGES[level];
    const available = Object.keys(LEVEL_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= level) chosen = v;
      else break;
    }
    return LEVEL_BADGES[chosen] || LEVEL_BADGES[1];
  };

  // Caption mission badges by target count
  const CAPTION_MISSION_BADGES: Record<number, any> = {
    1: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-1_compressed.webp'),
    5: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-5_compressed.webp'),
    10: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-10_compressed.webp'),
    25: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-25_compressed.webp'),
    50: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-50_compressed.webp'),
    100: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-100_compressed.webp'),
    250: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-250_compressed.webp'),
    500: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-500_compressed.webp'),
    1000: require('../../public/assets/writecaptions-mission-images/writecaptions-mission-image-1000_compressed.webp'),
  };

  const getCaptionMissionBadgeSource = (target: number) => {
    if (CAPTION_MISSION_BADGES[target]) return CAPTION_MISSION_BADGES[target];
    const available = Object.keys(CAPTION_MISSION_BADGES)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    let chosen = available[0];
    for (const v of available) {
      if (v <= target) chosen = v;
      else break;
    }
    return CAPTION_MISSION_BADGES[chosen] || CAPTION_MISSION_BADGES[1];
  };

  React.useEffect(() => {
    // Animate XP bar based on current level progress
    const pct = xpSummary.span > 0
      ? Math.max(0, Math.min(100, (xpSummary.gained / xpSummary.span) * 100))
      : 100; // At max level (span === 0), show a full bar
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

  const handleThemeTogglePressIn = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(themeToggleScale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [themeToggleScale]);

  const handleThemeTogglePressOut = React.useCallback(() => {
    Animated.spring(themeToggleScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 10,
    }).start();
  }, [themeToggleScale]);

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
        setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp, totalXp: state.xp || 0 });
        // Load local best Trippin score for CTA
        try {
          const best = await AsyncStorage.getItem(TRIPPIN_BEST_KEY);
          setBestTrippinScore(best ? Number(best) : 0);
        } catch {}
      } catch {}
    })();
  }, []);

  // Initialize edit form state when opening the modal
  React.useEffect(() => {
    if (isEditProfileVisible) {
      setTempName(displayName);
    }
  }, [isEditProfileVisible, displayName]);

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

  // Stable handlers for Trippin CTA
  const handleTrippinPressIn = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.spring(trippinHoldScale, { toValue: 0.98, useNativeDriver: true, tension: 300, friction: 14 }),
      Animated.spring(trippinHoldTranslateY, { toValue: -1, useNativeDriver: true, tension: 300, friction: 14 }),
    ]).start();
  }, [trippinHoldScale, trippinHoldTranslateY]);

  const handleTrippinPressOut = React.useCallback(() => {
    Animated.parallel([
      Animated.spring(trippinHoldScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }),
      Animated.spring(trippinHoldTranslateY, { toValue: 0, useNativeDriver: true, tension: 300, friction: 12 }),
    ]).start();
  }, [trippinHoldScale, trippinHoldTranslateY]);

  const handleTrippinPress = React.useCallback(async () => {
    setIsGameVisible(true);
    try {
      await progressMission('play_trippin', 1);
      const list = await getMissions();
      setMissions(list);
      // Refresh XP bar immediately after mission XP award
      const state = await getLevelingState();
      const info = xpToNextLevel(state.xp || 0);
      setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp, totalXp: state.xp || 0 });
    } catch {}
  }, [setIsGameVisible, setMissions]);

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
          // Force ladders to reflect any changes made off-screen (e.g., captions)
          try {
            const leveling = require('../../src/utils/leveling');
            if (typeof leveling.updateMissionLadders === 'function') {
              await leveling.updateMissionLadders();
            }
          } catch {}

          const list = await getMissions();
          const state = await getLevelingState();
          const info = xpToNextLevel(state.xp || 0);
          if (!active) return;
          setMissions(list);
          setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp, totalXp: state.xp || 0 });
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
      setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp, totalXp: state.xp || 0 });
    } catch {}
  };

  const refreshXpSummary = async () => {
    try {
      const state = await getLevelingState();
      const info = xpToNextLevel(state.xp || 0);
      setXpSummary({ level: info.currentLevel, gained: (state.xp || 0) - info.currentLevelXp, span: info.nextLevelXp - info.currentLevelXp, totalXp: state.xp || 0 });
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

  const GamifiedStatCardBase = ({
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
          <Animated.View pointerEvents="none" style={[styles.gShimmerBand, { transform: [{ translateX: bandTranslate }] }]} />

          {/* Icon */}
          <View style={styles.gHeaderRow}>
            <View style={[styles.gIconBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}> 
              <Icon name={icon} size="md" color="#FFFFFF" />
            </View>
          </View>

          {/* Value */}
          <Text style={styles.gValue}>{value}</Text>
          <Text style={styles.gLabel}>{label}</Text>

          {/* Progress elements removed per request */}
        </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const GamifiedStatCard = React.memo(GamifiedStatCardBase, (prev, next) => {
    if (prev.label !== next.label) return false;
    if (prev.icon !== next.icon) return false;
    if (prev.value !== next.value) return false;
    if (prev.gradient[0] !== next.gradient[0] || prev.gradient[1] !== next.gradient[1]) return false;
    if (prev.milestones.length !== next.milestones.length) return false;
    for (let i = 0; i < prev.milestones.length; i += 1) {
      if (prev.milestones[i] !== next.milestones[i]) return false;
    }
    return true;
  });

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
            <View style={[styles.progressOuter, { borderColor: colors.primary[200] }]}> 
              <View style={[styles.progressBarContainer]}> 
                <Animated.View style={[styles.progressBar, { width: progressWidth }]}> 
                  <View pointerEvents="none" style={styles.progressStripes}>
                    {React.useMemo(() => Array.from({ length: 28 }).map((_, i) => (
                      <View
                        key={`xp-stripe-${i}`}
                        style={[styles.progressStripe, { left: i * 14 }]}
                      />
                    )), [])}
                  </View>
                </Animated.View>
              </View>
            </View>
          </View>
          <Text style={[styles.progressLevelTitle, { color: colors.text.primary }]}>
            {`Level ${xpSummary.level}`}
          </Text>
          <Text style={[styles.progressXpSmall, { color: colors.text.secondary }]}>
            {`${xpSummary.totalXp} XP`}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {(() => {
            const countriesGradient = React.useMemo(() => ["#34d399", "#059669"] as [string, string], []);
            const tripsGradient = React.useMemo(() => ["#60a5fa", "#2563eb"] as [string, string], []);
            const photosGradient = React.useMemo(() => ["#f59e0b", "#ef4444"] as [string, string], []);
            const countriesMilestones = React.useMemo(() => [5, 10, 20, 50], []);
            const tripsMilestones = React.useMemo(() => [3, 10, 25, 50], []);
            const photosMilestones = React.useMemo(() => [100, 500, 1000, 5000], []);
            return (
              <>
                <GamifiedStatCard
                  label="Countries"
                  value={uniqueCountries}
                  icon="earth"
                  gradient={countriesGradient}
                  milestones={countriesMilestones}
                />
                <GamifiedStatCard
                  label="Trips"
                  value={tripCount}
                  icon="map"
                  gradient={tripsGradient}
                  milestones={tripsMilestones}
                />
                <GamifiedStatCard
                  label="Photos"
                  value={photoCount}
                  icon="camera"
                  gradient={photosGradient}
                  milestones={photosMilestones}
                />
              </>
            );
          })()}
        </View>

        {/* Trippin' Game CTA - moved above Missions */}
        <View style={[styles.section, { marginBottom: SPACING.lg }]}> 
          <Pressable
            onPressIn={handleTrippinPressIn}
            onPressOut={handleTrippinPressOut}
            onPress={handleTrippinPress}
            accessibilityLabel="Play Trippin – global game"
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
                  <Text style={styles.trippinSubtitle}>Compete against other travellers in a global game</Text>
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
                      cachePolicy={'memory-disk'}
                      priority="high"
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
          {/* Share the app – full-width tile on top row */}
          {(() => {
            const shareMission = React.useMemo(() => missions.find(m => m.id === 'share_app'), [missions]);
            if (!shareMission) return null;
            const pct = shareMission.maxProgress > 0 ? Math.min(1, (shareMission.progress || 0) / shareMission.maxProgress) : 0;
            const isDone = pct >= 1;
            const handleShareApp = async () => {
              try {
                const result = await Share.share({
                  message: 'Loving TripMemo! Check out this travel journal app.',
                  url: 'https://tripmemo.app',
                  title: 'TripMemo – Travel Journal',
                });
                if (result?.action === Share.sharedAction) {
                  await completeShareMission();
                }
              } catch {}
            };
            return (
              <View style={[styles.shareMissionTile, { backgroundColor: colors.surface.secondary, borderWidth: 2, borderColor: colors.surface.tertiary }]}>
                {/* Completed pill removed; "Completed!" text shown below instead */}
                <View style={styles.shareMissionLeft}>
                  <Image
                    source={SHARE_APP_BADGE}
                    style={{ width: 100, height: 100 }}
                    cachePolicy={'memory-disk'}
                    contentFit="contain"
                    accessibilityLabel="Share the app badge"
                  />
                </View>
                <View style={styles.shareMissionRight}>
                  <Text style={[styles.missionTitleCenter, { textAlign: 'left', color: colors.text.primary }]} numberOfLines={2}>
                    {shareMission.title}
                  </Text>
                  {isDone ? (
                    <Text style={[styles.missionMetaCenter, { textAlign: 'left', color: '#22C55E', fontWeight: '800' }]}>Completed!</Text>
                  ) : (
                    <>
                      <Text style={[styles.missionMetaCenter, { textAlign: 'left', color: colors.text.secondary }]}>
                        {`+${shareMission.rewardXp} XP • ${shareMission.progress}/${shareMission.maxProgress}`}
                      </Text>
                      <View style={[styles.missionBarTrackSmall, { marginTop: SPACING.xs }]}>
                        <View style={[styles.missionBarFill, { width: `${pct * 100}%` }]} />
                      </View>
                    </>
                  )}
                  {shareMission.progress < shareMission.maxProgress && (
                    <View style={{ marginTop: SPACING.sm }}>
                      <Button title="Share" onPress={handleShareApp} variant="primary" style={{ backgroundColor: '#f59e0b' }} />
                    </View>
                  )}
                </View>
              </View>
            );
          })()}
          <FlatList
            data={React.useMemo(() => missions.filter(m => m.id !== 'share_app'), [missions])}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            initialNumToRender={6}
            renderItem={React.useCallback(({ item: m, index }: { item: { id: string; title: string; rewardXp: number; maxProgress: number; progress: number }; index: number }) => {
              const pct = m.maxProgress > 0 ? Math.min(1, (m.progress || 0) / m.maxProgress) : 0;
              const iconName = m.id === 'share_app' ? 'share' : m.id.includes('photos') ? 'camera' : m.id.includes('map') ? 'map' : m.id.includes('entry') ? 'edit' : 'award';
              const isDone = pct >= 1;
              return (
                <View style={styles.missionTileWrap}>
                  <View style={[styles.missionTile, { backgroundColor: colors.surface.secondary, borderWidth: 2, borderColor: colors.surface.tertiary }]}>
                    {/* Completed pill removed; "Completed!" text shown below instead */}
                    {m.id === 'ladder_create_trips' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getTripMissionBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Create ${m.maxProgress} trip badge`}
                        />
                      </View>
                    ) : m.id === 'ladder_add_photos' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getPhotoMissionBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Add ${m.maxProgress} photos badge`}
                        />
                      </View>
                    ) : m.id === 'ladder_visit_countries' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getVisitCountriesBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Visit ${m.maxProgress} countries badge`}
                        />
                      </View>
                    ) : m.id === 'ladder_add_captions' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getCaptionMissionBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Add ${m.maxProgress} captions badge`}
                        />
                      </View>
                    ) : m.id === 'add_profile_picture' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={ADD_PROFILE_PICTURE_BADGE}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Add a profile picture badge`}
                        />
                      </View>
                    ) : m.id === 'ladder_open_streak' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getDayStreakBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`${m.maxProgress} day streak badge`}
                        />
                      </View>
                    ) : m.id === 'ladder_achieve_level' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={getLevelBadgeSource(m.maxProgress)}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Achieve Level ${m.maxProgress} badge`}
                        />
                      </View>
                    ) : m.id === 'play_trippin' ? (
                      <View style={{ marginBottom: SPACING.sm }}>
                        <Image
                          source={PLAY_TRIPPIN_BADGE}
                          style={{ width: 84, height: 84 }}
                          cachePolicy={'memory-disk'}
                          contentFit="contain"
                          accessibilityLabel={`Play Trippin badge`}
                        />
                      </View>
                    ) : (
                      <View style={[styles.missionIconCircleLg, { backgroundColor: 'rgba(239, 97, 68, 0.12)' }]}> 
                        <Icon name={iconName} size="xl" color={'#EF6144'} />
                      </View>
                    )}
                    <Text style={[styles.missionTitleCenter, { color: colors.text.primary }]} numberOfLines={2}>{m.title}</Text>
                    {isDone ? (
                      <Text style={[styles.missionMetaCenter, { color: '#22C55E', fontWeight: '800' }]}>Completed!</Text>
                    ) : (
                      <>
                        <Text style={[styles.missionMetaCenter, { color: colors.text.secondary }]}>{`+${m.rewardXp} XP • ${m.progress}/${m.maxProgress}`}</Text>
                        <View style={styles.missionBarTrackSmall}>
                          <View style={[styles.missionBarFill, { width: `${pct * 100}%` }]} />
                        </View>
                      </>
                    )}
                    {m.id === 'share_app' && m.progress < m.maxProgress && (
                      <View style={{ marginTop: SPACING.xs }}>
                        <Button title="Share" onPress={completeShareMission} variant="primary" />
                      </View>
                    )}
                  </View>
                </View>
              );
            }, [colors])}
          />
        </View>

        {/* Old Trippin CTA removed (replaced by banner above) */}

        
        {/* Centered Theme Toggle above footer */}
        <View style={styles.themeToggleWrapper}>
          <Animated.View style={{ transform: [{ scale: themeToggleScale }] }}>
          <Pressable
            onPressIn={handleThemeTogglePressIn}
            onPressOut={handleThemeTogglePressOut}
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
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable><Text style={[styles.footerLink, { color: colors.text.tertiary }]}>Privacy Policy</Text></Pressable>
          <Text style={[styles.footerSeparator, { color: colors.text.tertiary }]}>•</Text>
          <Pressable><Text style={[styles.footerLink, { color: colors.text.tertiary }]}>Terms of Service</Text></Pressable>
        </View>

        {/* Edit Profile Modal */}
        {isEditProfileVisible && (
          <Modal
            transparent
            visible={isEditProfileVisible}
            animationType="fade"
            onRequestClose={() => setIsEditProfileVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { backgroundColor: colors.surface.primary, borderColor: colors.border.primary }]}> 
                {/* Gradient header */}
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeader}
                />
                {/* Avatar */}
                <View style={styles.modalAvatarWrap}>
                  <Image
                    source={{ uri: avatarUri }}
                    style={[styles.modalAvatar, { borderColor: '#ffffff' }]}
                    cachePolicy={'memory-disk'}
                    contentFit="cover"
                    accessibilityLabel="Profile picture preview"
                  />
                </View>
                {/* Title moved into header */}
                <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
                  <Button title="Change Photo" onPress={handleChangeAvatar} variant="secondary" />
                </View>
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={tempName}
                  onChangeText={setTempName}
                  variant="outlined"
                />
                <View style={styles.modalActions}>
                  <Button title="Cancel" onPress={() => setIsEditProfileVisible(false)} variant="ghost" />
                  <Button
                    title={isSavingProfile ? 'Saving…' : 'Save'}
                    onPress={async () => {
                      if (isSavingProfile) return;
                      const trimmed = (tempName || '').trim();
                      const hasNameChanged = trimmed !== displayName;
                      if (!hasNameChanged) {
                        setIsEditProfileVisible(false);
                        return;
                      }
                      try {
                        setIsSavingProfile(true);
                        const nameToSave = trimmed || user.name;
                        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: nameToSave, avatarUri }));
                        setDisplayName(nameToSave);
                      } catch {}
                      setIsSavingProfile(false);
                      setIsEditProfileVisible(false);
                    }}
                    variant="primary"
                    disabled={isSavingProfile}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>

      {/* Trippin' Fullscreen Modal */}
      <Modal
        transparent={false}
        visible={isGameVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        hardwareAccelerated
        onRequestClose={() => setIsGameVisible(false)}
      >
        <React.Suspense fallback={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#f4845f" /></View>}>
          <TrippinGameLazy onClose={() => setIsGameVisible(false)} />
        </React.Suspense>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  name: { ...TYPOGRAPHY.styles.h2, marginTop: SPACING.md, fontFamily: 'MagnoliaScript', fontSize: 48, lineHeight: 50, letterSpacing: -0.5 },
  level: { ...TYPOGRAPHY.styles.body, marginTop: SPACING.xs },
  editProfileBtn: { position: 'absolute', right: SPACING.lg, top: SPACING.lg, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 97, 68, 0.12)' },
  
  progressSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl, alignItems: 'center' },
  progressRow: { width: '100%' },
  progressOuter: { padding: 2, borderRadius: 11, borderWidth: 1 },
  progressBarContainer: { height: 18, borderRadius: 9, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  progressBar: { height: '100%', backgroundColor: '#EF6144', position: 'relative' },
  progressStripes: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  progressStripe: { position: 'absolute', top: -8, bottom: -8, width: 6, backgroundColor: 'rgba(245, 166, 107, 0.18)', transform: [{ rotate: '18deg' }] },
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

  // Share mission full-width tile
  shareMissionTile: { width: '100%', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', position: 'relative', marginBottom: SPACING.md },
  shareMissionLeft: { width: 110, alignItems: 'center', justifyContent: 'center' },
  shareMissionRight: { flex: 1, paddingLeft: SPACING.sm, paddingRight: SPACING.sm },

  // Edit Profile Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, borderWidth: 1, overflow: 'hidden' },
  modalHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  
  modalAvatarWrap: { alignItems: 'center', marginTop: 30, marginBottom: SPACING.sm },
  modalTitle: { ...TYPOGRAPHY.styles.h3, marginBottom: SPACING.md, textAlign: 'center' },
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