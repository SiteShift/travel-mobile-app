import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ScrollView, Image as RNImage, Easing, TextInput, Modal } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import Reanimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Icon } from '../components/Icon';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import LottieView from 'lottie-react-native';

interface TripBookScreenProps {
  tripId?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to read simple trip structure saved by creation flow
const normalizeUri = (uri?: string): string | undefined => {
  if (!uri) return undefined;
  try {
    const decoded = decodeURIComponent(uri);
    return decoded;
  } catch {
    return uri;
  }
};

const loadSimpleTrip = async (tripId?: string) => {
  try {
    if (!tripId) return null;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const storedTripData = await AsyncStorage.getItem(`trip_${tripId}`);
    if (!storedTripData) return null;
    const t = JSON.parse(storedTripData);
    return {
      id: t.id,
      title: String(t.title || '').slice(0, 11),
      description: String(t.description || ''),
      coverImage: normalizeUri(t.coverImage),
      startDate: t.startDate ? new Date(t.startDate) : undefined,
      endDate: t.endDate ? new Date(t.endDate) : undefined,
      // Month Year format
      monthYear: new Date(t.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    } as const;
  } catch (e) {
    console.error('TripBookScreen: failed to load trip', e);
    return null;
  }
};

// Ensure a renderable file:// URI (best-effort). Lazy require for MediaLibrary.
let MediaLibrary: any;
try { MediaLibrary = require('expo-media-library'); } catch {}
async function ensureFileUriAsync(originalUri: string): Promise<string> {
  if (!originalUri) return originalUri;
  if (originalUri.startsWith('file://')) return originalUri;
  try {
    const manipulated = await ImageManipulator.manipulateAsync(originalUri, [], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
    if (manipulated?.uri) return manipulated.uri;
  } catch {}
  try {
    if (MediaLibrary && originalUri.startsWith('ph://')) {
      const perm = await MediaLibrary.requestPermissionsAsync?.();
      if (!perm || perm.status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(originalUri);
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        if (info?.localUri) return info.localUri as string;
      }
    }
  } catch {}
  if (originalUri.startsWith('/')) return `file://${originalUri}`;
  return originalUri;
}

// Copy an image/video into a stable, app-managed location so it persists across navigations/app restarts.
// Returns a file:// URI inside the app's documentDirectory. Falls back to the best available URI if copy fails.
async function persistAssetToTripDir(originalUri: string, tripId: string, day: number): Promise<string> {
  try {
    const fileUri = await ensureFileUriAsync(originalUri);
    const guessedExt = (() => {
      try {
        const clean = fileUri.split('?')[0];
        const ext = clean.includes('.') ? clean.split('.').pop() : '';
        return (ext || 'jpg').toLowerCase();
      } catch { return 'jpg'; }
    })();

    const baseDir = `${FileSystem.documentDirectory}trips/${tripId}/day-${day}/`;
    try { await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true }); } catch {}
    const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${guessedExt}`;
    const dest = baseDir + filename;
    try {
      await FileSystem.copyAsync({ from: fileUri, to: dest });
      return dest;
    } catch {
      return fileUri;
    }
  } catch {
    return originalUri;
  }
}

export default function TripBookScreen({ tripId }: TripBookScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 56;
  const [trip, setTrip] = useState<{ id: string; title: string; description: string; coverImage: string; monthYear: string; startDate?: Date; endDate?: Date } | null>(null);
  const [useRNImage, setUseRNImage] = useState(false);
  type CropState = { scale: number; offsetX: number; offsetY: number };
  type DayPhoto = { id: string; uri: string; caption?: string; crop: CropState };
  const [dayPhotos, setDayPhotos] = useState<Record<number, DayPhoto[]>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [optionsSheet, setOptionsSheet] = useState<{ visible: boolean; day: number | null; index: number | null }>({ visible: false, day: null, index: null });
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  
  // Persist current dayPhotos into AsyncStorage under trip_<id> using the minimal structure
  const persistAllDayPhotos = useCallback(async (all: Record<number, DayPhoto[]>) => {
    try {
      const effectiveTripId = trip?.id ?? (tripId ? String(tripId) : undefined);
      if (!effectiveTripId) return;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(`trip_${effectiveTripId}`);
      const base = stored ? JSON.parse(stored) : {};
      // Build days array using the provided state; fall back to the highest day index if dates are not ready
      const start = (trip?.startDate instanceof Date ? trip.startDate : (base?.startDate ? new Date(base.startDate) : new Date()));
      const msPerDay = 24 * 60 * 60 * 1000;
      const maxDay = Math.max(1, ...Object.keys(all).map(k => Number(k)).filter(n => Number.isFinite(n) && n > 0));
      const days = [] as any[];
      for (let i = 1; i <= maxDay; i++) {
        const date = new Date(start.getTime() + (i - 1) * msPerDay);
        const list = all[i] || [];
        const memories = list.map((p) => ({
          id: p.id,
          uri: p.uri,
          caption: p.caption || '',
          timestamp: new Date().toISOString(),
          aspectRatio: 1,
          crop: p.crop,
        }));
        days.push({ day: i, date, memories, location: base.country || 'Adventure' });
      }
      const totalPhotos = days.reduce((sum: number, d: any) => sum + (Array.isArray(d.memories) ? d.memories.length : 0), 0);
      const next = {
        ...base,
        id: effectiveTripId,
        title: base.title || trip?.title || base.title,
        coverImage: base.coverImage || trip?.coverImage || base.coverImage,
        startDate: base.startDate || (trip?.startDate?.toISOString?.() || base.startDate),
        endDate: base.endDate || (trip?.endDate?.toISOString?.() || base.endDate),
        days,
        totalPhotos,
      };
      await AsyncStorage.setItem(`trip_${effectiveTripId}`, JSON.stringify(next));
    } catch (e) {
      console.error('TripBookScreen: persistAllDayPhotos error', e);
    }
  }, [trip?.id, trip?.title, trip?.coverImage, trip?.startDate, trip?.endDate, tripId]);

  // Horizontal pager
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationRef = useRef<LottieView>(null);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [celebrationReady, setCelebrationReady] = useState(false);

  // Entrance animation opacities
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const dayTitleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const t = await loadSimpleTrip(tripId);
      if (!t) return;
      // Resolve cover image without mutating the original object
      let resolvedCover = t.coverImage || '';
      if (!resolvedCover) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const pending = await AsyncStorage.getItem('pending_cover_image');
          if (pending) resolvedCover = pending;
        } catch {}
      }
      const normalizedTrip = {
        id: String(t.id),
        title: t.title,
        description: t.description,
        coverImage: resolvedCover,
        monthYear: t.monthYear,
        startDate: t.startDate,
        endDate: t.endDate,
      };
      setTrip(normalizedTrip);
      // Initialize days photos from storage if present, otherwise empty arrays
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const stored = await AsyncStorage.getItem(`trip_${t.id}`);
        const days: Record<number, DayPhoto[]> = {};
        const start = t.startDate ?? new Date();
        const end = t.endDate ?? start;
        const msPerDay = 24 * 60 * 60 * 1000;
        const total = Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / msPerDay) + 1);
        for (let i = 1; i <= total; i++) days[i] = [];
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.days)) {
            for (const d of parsed.days) {
              const idx = Number(d?.day) || 1;
              const list = Array.isArray(d?.memories) ? d.memories : [];
              days[idx] = list.map((m: any) => ({ id: String(m.id || `${Date.now()}`), uri: m.uri, caption: m.caption || '', crop: m.crop || { scale: 1, offsetX: 0, offsetY: 0 } }));
            }
          }
        }
        setDayPhotos(days);
      } catch {}
    })();
  }, [tripId]);

  // Load per-trip celebration flag so we only play once per trip
  useEffect(() => {
    if (!trip?.id) return;
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const v = await AsyncStorage.getItem(`celebrated_trip_${trip.id}`);
        setHasCelebrated(!!v);
        // Also try to reload any persisted day photos in case we arrived from cold start
        const stored = await AsyncStorage.getItem(`trip_${trip.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.days)) {
            const days: Record<number, DayPhoto[]> = {};
            for (const d of parsed.days) {
              const idx = Number(d?.day) || 1;
              const list = Array.isArray(d?.memories) ? d.memories : [];
              days[idx] = list.map((m: any) => ({ id: String(m.id || `${Date.now()}`), uri: m.uri, caption: m.caption || '', crop: m.crop || { scale: 1, offsetX: 0, offsetY: 0 } }));
            }
            setDayPhotos(days);
          }
        }
      } catch {}
      setCelebrationReady(true);
    })();
  }, [trip?.id]);

  // Run entrance animation once when trip is loaded and ready.
  // Do not depend on hasCelebrated to avoid a second fade when the flag flips after confetti finishes.
  useEffect(() => {
    if (!trip || !celebrationReady) return;
    titleOpacity.setValue(0);
    dateOpacity.setValue(0);
    imageOpacity.setValue(0);
    descOpacity.setValue(0);
    arrowOpacity.setValue(0);

    Animated.timing(titleOpacity, { toValue: 1, duration: 450, useNativeDriver: true }).start(() => {
      Animated.timing(dateOpacity, { toValue: 1, duration: 450, useNativeDriver: true }).start(() => {
        Animated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start(({ finished }) => {
          if (finished) {
            // Trigger the celebration right after the image settles (only once per trip)
            if (!hasCelebrated) {
              setTimeout(() => setShowCelebration(true), 100);
            }
          }
          // Continue with description and arrow fades
          Animated.sequence([
            Animated.timing(descOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(arrowOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          ]).start();
        });
      });
    });
  }, [trip, celebrationReady]);

  // Fade the day title on page change
  useEffect(() => {
    if (pageIndex > 0) {
      // Start slightly visible for smoother transition instead of a hard fade-from-zero
      dayTitleOpacity.setValue(0.4);
      Animated.timing(dayTitleOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [pageIndex]);

  const totalDays = useMemo(() => {
    if (!trip) return 1;
    const start = trip.startDate ?? new Date();
    const end = trip.endDate ?? start;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
  }, [trip?.startDate, trip?.endDate]);

  const currentDayNumber = useMemo(() => {
    // pageIndex 0 = cover; clamp to [1, totalDays]
    const n = Math.max(1, pageIndex);
    return Math.min(totalDays, n);
  }, [pageIndex, totalDays]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prevEditing => {
      const willBeEditing = !prevEditing;
      if (prevEditing) {
        // Commit drafts to photos when leaving edit mode, then persist and update ladders in order
        const prev = dayPhotos;
        const dayArr = prev[currentDayNumber] || [];
        const updated = dayArr.map(p => ({ ...p, caption: captionDrafts[p.id] ?? p.caption ?? '' }));
        const next = { ...prev, [currentDayNumber]: updated };
        setDayPhotos(next);
        (async () => {
          try {
            await persistAllDayPhotos(next);
          } catch {}
          try {
            const leveling = require('../utils/leveling');
            if (typeof leveling.updateMissionLadders === 'function') {
              await leveling.updateMissionLadders();
            }
            // Rebuild and persist missions so Profile reads latest immediately
            if (typeof leveling.getMissions === 'function') {
              await leveling.getMissions();
            }
          } catch {}
        })();
        // Clear drafts after save
        setCaptionDrafts({});
      }
      return willBeEditing;
    });
  }, [currentDayNumber, captionDrafts, dayPhotos, persistAllDayPhotos]);

  const currentDayHasPhotos = useMemo(() => {
    const list = dayPhotos[currentDayNumber] || [];
    return list.length > 0;
  }, [dayPhotos, currentDayNumber]);

  useEffect(() => {
    if (!currentDayHasPhotos && isEditMode) {
      setIsEditMode(false);
    }
  }, [currentDayHasPhotos, isEditMode]);

  const handleAddPhotos = useCallback(async (day: number) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 1,
        exif: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const items: DayPhoto[] = [];
      for (const a of res.assets) {
        const u = await persistAssetToTripDir(a.uri, (trip?.id ? String(trip.id) : String(tripId)), day);
        items.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, uri: u, caption: '', crop: { scale: 1, offsetX: 0, offsetY: 0 } });
      }
      setDayPhotos(prev => {
        const next = { ...prev, [day]: [...(prev[day] || []), ...items] };
        persistAllDayPhotos(next);
        return next;
      });
      // Leveling: award +1 XP per image added and refresh ladders/missions snapshot
      try {
        const leveling = require('../utils/leveling');
        await leveling.awardPhotosAdded(items.length);
        if (typeof leveling.updateMissionLadders === 'function') {
          await leveling.updateMissionLadders();
        }
        if (typeof leveling.getMissions === 'function') {
          await leveling.getMissions();
        }
      } catch {}
    } catch (e) {
      console.error('Add photos error', e);
    }
  }, []);

  const goToNext = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ x: SCREEN_WIDTH, animated: true });
  }, []);

  if (!trip) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  const POLAROID_WIDTH = SCREEN_WIDTH * 0.84;
  const POLAROID_PADDING = 18; // thicker frame
  const IMAGE_WIDTH = POLAROID_WIDTH - POLAROID_PADDING * 2; // inner image width

  return (
    <View style={{ flex: 1, backgroundColor: '#EFEFEF' }}>
      <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(e) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setPageIndex(newIndex);
      }}
      style={{ flex: 1, backgroundColor: '#EFEFEF' }}
    >
      {/* Front Cover */}
      <View style={[styles.page, { width: SCREEN_WIDTH }]}> 
        {/* Close button aligned to match day page header position */}
        <TouchableOpacity
          accessibilityLabel="Close"
          onPress={() => router.replace('/(tabs)')}
          style={[
            styles.topLeftClose,
            {
              top: insets.top + 12,
              left: 26,
              width: 32,
              height: 32,
              padding: 0,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={styles.topLeftCloseText}>×</Text>
        </TouchableOpacity>

        <View style={[styles.coverContent, { paddingTop: 90 }]}>
          {showCelebration && !hasCelebrated && (
            <View pointerEvents="none" style={styles.celebrationOverlay}>
              <LottieView
                ref={celebrationRef}
                source={require('../../public/assets/create-trip-celebration.json')}
                autoPlay
                loop={false}
                style={styles.celebrationLottie}
                onAnimationFinish={async () => {
                  setShowCelebration(false);
                  if (trip?.id) {
                    try {
                      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                      await AsyncStorage.setItem(`celebrated_trip_${trip.id}`, '1');
                    } catch {}
                    setHasCelebrated(true);
                  }
                }}
              />
            </View>
          )}
          {/* Title (single line, 11 char limit enforced on load) */}
          <Animated.Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[
              styles.title,
              {
                width: POLAROID_WIDTH + 6, // nudge to visually match image width
                color: '#000',
                fontFamily: 'TimesCondensed',
                letterSpacing: -4.0,
                fontSize: 120, // start large, will shrink to fit width
                textAlign: 'center',
                opacity: titleOpacity,
              },
            ]}
          >
            {trip.title}
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { color: '#E0663A', marginTop: -10, marginBottom: 28, fontSize: 18, fontWeight: '600', opacity: dateOpacity }]}>{trip.monthYear}</Animated.Text>

          {/* Large cover image (no polaroid frame) */}
          <Animated.View style={{ opacity: imageOpacity }}>
            {!useRNImage && trip.coverImage ? (
              <Image
                source={{ uri: trip.coverImage }}
                style={[styles.coverImage]}
                contentFit="cover"
                onError={() => setUseRNImage(true)}
              />
            ) : trip.coverImage ? (
              <RNImage
                source={{ uri: trip.coverImage }}
                style={[styles.coverImage as any]}
                resizeMode="cover"
              />
            ) : null}
          </Animated.View>

          {/* Description below image */}
          {!!trip.description && (
            <Animated.Text
              numberOfLines={3}
              style={[styles.coverCaption, { fontFamily: 'ZingScriptRust', opacity: descOpacity }]}
            >
              {trip.description}
            </Animated.Text>
          )}

          {/* Navigation arrow (next only) */}
          <Animated.View style={[styles.nextArrowRow, { width: POLAROID_WIDTH, marginTop: 54, opacity: arrowOpacity }]}> 
            <View style={{ flex: 1 }} />
            <TouchableOpacity accessibilityLabel="Open Day 1" onPress={goToNext} style={styles.arrowHitbox}> 
              <Image
                source={require('../../public/assets/TripMemo Level designs (2).svg')}
                style={{ width: 24, height: 24, tintColor: '#8A8A8A' }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Day pages */}
      {Array.from({ length: totalDays }).map((_, idx) => {
        const day = idx + 1;
        const photos = dayPhotos[day] || [];
        return (
          <View key={`day-${day}`} style={[styles.page, { width: SCREEN_WIDTH }]}> 
            {isEditMode && photos.length > 0 ? (
              <DraggableFlatList
                data={photos}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setDayPhotos(prev => { const next = { ...prev, [day]: data as any }; persistAllDayPhotos(next); return next; })}
                containerStyle={{ flex: 1, width: '100%' }}
                contentContainerStyle={{
                  paddingTop: headerHeight + 12,
                  paddingBottom: insets.bottom + 24,
                  minHeight: SCREEN_HEIGHT - headerHeight - insets.bottom - 16,
                }}
                extraData={dayPhotos[day]}
                showsVerticalScrollIndicator={false} 
                renderItem={({ item, index, drag, isActive }: RenderItemParams<any>) => {
                  const id = item.id as string;
                  const handleCaptionChange = (text: string) => {
                    setCaptionDrafts(prev => ({ ...prev, [id]: text }));
                    setDayPhotos(prev => {
                      const nextDay = [...(prev[day] || [])];
                      const target = nextDay[index];
                      if (!target) return prev;
                      nextDay[index] = { ...target, caption: text } as any;
                      const next = { ...prev, [day]: nextDay };
                      // Persist first, then recompute ladders/missions so AsyncStorage reflects latest captions
                      persistAllDayPhotos(next).then(async () => {
                        try {
                          const leveling = require('../utils/leveling');
                          if (typeof leveling.updateMissionLadders === 'function') {
                            await leveling.updateMissionLadders();
                          }
                          if (typeof leveling.getMissions === 'function') {
                            await leveling.getMissions();
                          }
                        } catch {}
                      });
                      return next;
                    });
                  };
                  const handleCropChange = (partial: Partial<{ scale: number; offsetX: number; offsetY: number }>) => {
                    setDayPhotos(prev => {
                      const next = [...(prev[day] || [])];
                      const target = next[index];
                      if (!target) return prev;
                      next[index] = { ...target, crop: { ...target.crop, ...partial } } as any;
                      return { ...prev, [day]: next };
                    });
                  };
                  return (
                    <DayPhotoPolaroid
                      photo={item}
                      index={index}
                      editMode
                      dragging={!!isActive}
                      draftCaption={captionDrafts[id] ?? item.caption ?? ''}
                      onUpdateCaption={handleCaptionChange}
                      onUpdateCrop={handleCropChange}
                      onStartDrag={() => { Haptics.selectionAsync(); drag(); }}
                      onOpenOptions={() => setOptionsSheet({ visible: true, day, index })}
                    />
                  );
                }}
                ListFooterComponent={
                  <View>
                    {/* Add-more placeholder aligned opposite of last item */}
                    <TouchableOpacity
                      onPress={() => handleAddPhotos(day)}
                      activeOpacity={0.9}
                      style={{
                        alignSelf: (photos.length - 1) % 2 === 0 ? 'flex-end' : 'flex-start',
                        marginTop: 6,
                        marginLeft: (photos.length - 1) % 2 === 0 ? 0 : 24,
                        marginRight: (photos.length - 1) % 2 === 0 ? 24 : 0,
                      }}
                    >
                      <View style={styles.polaroidSmall}>
                        <View style={[styles.polaroidPlaceholder, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                          <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
                        </View>
                        <Text numberOfLines={1} style={[styles.polaroidCaption, { fontFamily: 'ZingScriptRust' }]}>Add Photos</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Pager */}
                    <View style={[styles.pageIndicatorRow]}>
                      <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day - 1), animated: true })} style={styles.pageArrowCircle}>
                        <Text style={styles.pageArrowText}>←</Text>
                      </TouchableOpacity>
                      <Text style={styles.pageIndicatorText}>Day {day} of {totalDays}</Text>
                      <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day + 1), animated: true })} style={styles.pageArrowCircle}>
                        <Text style={styles.pageArrowText}>→</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                }
              />
            ) : (
              <ScrollView
                style={{ flex: 1, width: '100%' }}
                contentContainerStyle={{
                  paddingTop: headerHeight + 12,
                  // Keep a comfortable bottom area while letting the pager start near the bottom
                  paddingBottom: insets.bottom + 24,
                  // Ensure the content at least fills the viewport so the pager sits near bottom when few/no photos
                  minHeight: SCREEN_HEIGHT - headerHeight - insets.bottom - 16,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* Add Photos placeholder at top if no photos yet */}
                {photos.length === 0 && (
                  <TouchableOpacity onPress={() => handleAddPhotos(day)} activeOpacity={0.9} style={[styles.addPolaroidContainer, { marginTop: 16 }] }>
                    <View style={styles.polaroidSmall}> 
                      <View style={[styles.polaroidPlaceholder, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                        <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
                      </View>
                      <Text numberOfLines={1} style={[styles.polaroidCaption, { fontFamily: 'ZingScriptRust' }]}>Add Photos</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Small offset when photos exist so content breathes below header */}
                {photos.length > 0 && <View style={{ height: 12 }} />}

                {/* Each photo as its own polaroid row with staggered fade-in */}
                {photos.map((photo, i) => (
                  <DayPhotoPolaroid
                    key={photo.id}
                    photo={photo}
                    index={i}
                    editMode={isEditMode}
                    draftCaption={captionDrafts[photo.id] ?? photo.caption ?? ''}
                    onUpdateCaption={(text) => {
                      setCaptionDrafts(prev => ({ ...prev, [photo.id]: text }));
                      setDayPhotos(prev => {
                        const nextDay = [...(prev[day] || [])];
                        const target = nextDay[i];
                        if (!target) return prev;
                        nextDay[i] = { ...target, caption: text } as any;
                        const next = { ...prev, [day]: nextDay };
                        // Persist first, then recompute ladders/missions
                        persistAllDayPhotos(next).then(async () => {
                          try {
                            const leveling = require('../utils/leveling');
                            if (typeof leveling.updateMissionLadders === 'function') {
                              await leveling.updateMissionLadders();
                            }
                            if (typeof leveling.getMissions === 'function') {
                              await leveling.getMissions();
                            }
                          } catch {}
                        });
                        return next;
                      });
                    }}
                    onUpdateCrop={(partial) => {
                      setDayPhotos(prev => {
                        const nextDay = [...(prev[day] || [])];
                        const target = nextDay[i];
                        if (!target) return prev;
                        nextDay[i] = { ...target, crop: { ...target.crop, ...partial } } as any;
                        const next = { ...prev, [day]: nextDay };
                        persistAllDayPhotos(next);
                        return next;
                      });
                    }}
                    onOpenOptions={() => setOptionsSheet({ visible: true, day, index: i })}
                  />
                ))}

                {/* Edit mode: add-more placeholder aligned opposite of the last photo */}
                {isEditMode && photos.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleAddPhotos(day)}
                    activeOpacity={0.9}
                    style={{
                      alignSelf: (photos.length - 1) % 2 === 0 ? 'flex-end' : 'flex-start',
                      marginTop: 6,
                      marginLeft: (photos.length - 1) % 2 === 0 ? 0 : 24,
                      marginRight: (photos.length - 1) % 2 === 0 ? 24 : 0,
                    }}
                  >
                    <View style={styles.polaroidSmall}>
                      <View
                        style={[
                          styles.polaroidPlaceholder,
                          { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
                        ]}
                      >
                        <View style={styles.addCircle}>
                          <Text style={styles.addPlus}>+</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} style={[styles.polaroidCaption, { fontFamily: 'ZingScriptRust' }]}>Add Photos</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Spacer to push pager closer to the bottom on short content */}
                <View style={{ flexGrow: 1, minHeight: SCREEN_HEIGHT * 0.22 }} />

                {/* Bottom page indicator with arrows (non-sticky) */}
                <View style={[styles.pageIndicatorRow]}>
                  <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day - 1), animated: true })} style={styles.pageArrowCircle}>
                    <Text style={styles.pageArrowText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageIndicatorText}>Day {day} of {totalDays}</Text>
                  <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day + 1), animated: true })} style={styles.pageArrowCircle}>
                    <Text style={styles.pageArrowText}>→</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        );
      })}
      </ScrollView>

      {/* Fixed header overlay for day pages */}
      <View
        pointerEvents={pageIndex > 0 ? 'auto' : 'none'}
        style={[
          styles.fixedDayHeader,
          { paddingTop: insets.top, height: headerHeight, opacity: pageIndex > 0 ? 1 : 0 },
        ]}
      > 
        <TouchableOpacity
          accessibilityLabel="Close"
          onPress={() => router.replace('/(tabs)')}
          style={[styles.fixedHeaderButton, { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }]}
        >
          <Text style={styles.topLeftCloseText}>×</Text>
        </TouchableOpacity>
        <Animated.Text style={[styles.dayTitle, { color: '#000', opacity: dayTitleOpacity, textAlign: 'center', flex: 1 }]}>
          {pageIndex > 0 ? `Day ${currentDayNumber}` : ' '}
        </Animated.Text>
        <TouchableOpacity
          accessibilityLabel={isEditMode ? 'Done editing' : 'Edit Day'}
          activeOpacity={0.8}
          disabled={!currentDayHasPhotos}
          onPress={toggleEditMode}
          style={[
            styles.editBadge,
            { marginRight: 8 },
            isEditMode && currentDayHasPhotos && styles.editBadgeActive,
            !currentDayHasPhotos && styles.editBadgeDisabled,
          ]}
        >
          {isEditMode && currentDayHasPhotos ? (
            <Icon library="Ionicons" name="checkmark" size="sm" color="white" />
          ) : (
            <Image
              source={require('../../public/assets/pencil-icon.svg')}
              style={{ width: 16, height: 16, tintColor: !currentDayHasPhotos ? '#9E9E9E' : undefined }}
              contentFit="contain"
            />
          )}
        </TouchableOpacity>
      </View>

      {optionsSheet.visible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setOptionsSheet({ visible: false, day: null, index: null })}>
          <TouchableOpacity style={styles.optionsBackdrop} activeOpacity={1} onPress={() => setOptionsSheet({ visible: false, day: null, index: null })}>
            <View style={styles.optionsCard}>
              <TouchableOpacity
                style={styles.optionsItem}
                onPress={async () => {
                  const d = optionsSheet.day; const i = optionsSheet.index;
                  if (d == null || i == null) return;
                  try {
                    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: false, quality: 1, exif: true });
                    if (res.canceled || !res.assets?.length) return;
                    const newUri = trip?.id ? await persistAssetToTripDir(res.assets[0].uri, trip.id, d) : await ensureFileUriAsync(res.assets[0].uri);
                      setDayPhotos(prev => {
                        const updatedDay = (prev[d] || []).map((p, idx) => (idx === i ? { ...p, uri: newUri, crop: { scale: 1, offsetX: 0, offsetY: 0 } } : p));
                        const next = { ...prev, [d]: updatedDay };
                        persistAllDayPhotos(next);
                        return next;
                      });
                  } finally {
                    setOptionsSheet({ visible: false, day: null, index: null });
                  }
                }}
              >
                <Text style={styles.optionsText}>Change image</Text>
              </TouchableOpacity>
              <View style={styles.optionsDivider} />
              <TouchableOpacity
                style={styles.optionsItem}
                onPress={async () => {
                  const d = optionsSheet.day; const i = optionsSheet.index;
                  if (d == null || i == null) return;
                  setDayPhotos(prev => {
                    const next = { ...prev, [d]: (prev[d] || []).filter((_, idx) => idx !== i) };
                    persistAllDayPhotos(next);
                    return next;
                  });
                  // After deletion, refresh ladders/missions so photo counts reflect correctly
                  try {
                    const leveling = require('../utils/leveling');
                    if (typeof leveling.updateMissionLadders === 'function') {
                      await leveling.updateMissionLadders();
                    }
                    if (typeof leveling.getMissions === 'function') {
                      await leveling.getMissions();
                    }
                  } catch {}
                  setOptionsSheet({ visible: false, day: null, index: null });
                }}
              >
                <Text style={[styles.optionsText, { color: '#EF6144' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

// Staggered polaroid item for day photos
const DayPhotoPolaroid: React.FC<{
  photo: { uri: string; caption?: string; crop: { scale: number; offsetX: number; offsetY: number } };
  index: number;
  editMode?: boolean;
  dragging?: boolean;
  draftCaption?: string;
  onUpdateCaption?: (text: string) => void;
  onUpdateCrop?: (partial: Partial<{ scale: number; offsetX: number; offsetY: number }>) => void;
  onStartDrag?: () => void;
  onOpenOptions?: () => void;
}> = ({ photo, index, editMode = false, dragging = false, draftCaption = '', onUpdateCaption, onUpdateCrop, onStartDrag, onOpenOptions }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = 300 * index;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, fadeAnim]);

  // Gesture-driven crop state (local animated values mirror props.crop)
  const scale = useSharedValue(photo.crop?.scale ?? 1);
  const translateX = useSharedValue(photo.crop?.offsetX ?? 0);
  const translateY = useSharedValue(photo.crop?.offsetY ?? 0);

  useEffect(() => {
    // Sync if external state changes
    scale.value = photo.crop?.scale ?? 1;
    translateX.value = photo.crop?.offsetX ?? 0;
    translateY.value = photo.crop?.offsetY ?? 0;
  }, [photo.crop?.scale, photo.crop?.offsetX, photo.crop?.offsetY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      // clamp scale between 1 and 3
      const next = Math.max(1, Math.min(3, (photo.crop?.scale ?? 1) * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      if (onUpdateCrop) runOnJS(onUpdateCrop)({ scale: scale.value });
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = (photo.crop?.offsetX ?? 0) + e.translationX;
      translateY.value = (photo.crop?.offsetY ?? 0) + e.translationY;
    })
    .onEnd(() => {
      if (onUpdateCrop) runOnJS(onUpdateCrop)({ offsetX: translateX.value, offsetY: translateY.value });
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={{ alignItems: 'center', marginBottom: 28, opacity: fadeAnim }}>
      <View
        style={[
          styles.polaroidSmall,
          {
            transform: [{ rotate: index % 2 === 0 ? '-2deg' : '2deg' }],
            alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
            marginLeft: index % 2 === 0 ? 24 : 0,
            marginRight: index % 2 === 1 ? 24 : 0,
          },
          dragging && styles.draggingCard,
        ]}
      >
        {/* Drag handle (edit mode only) */}
        {editMode && (
          <TouchableOpacity
            accessibilityLabel="Reorder"
            onLongPress={onStartDrag}
            activeOpacity={0.7}
            style={[
              styles.dragHandle,
              index % 2 === 0 ? { right: -38 } : { left: -38 },
            ]}
          >
            {/* 2x3 dots grid */}
            <View style={styles.dotsRow}>
              <View style={styles.dotsColumn}>
                {[0,1,2].map((k) => (<View key={`l-${k}`} style={styles.dot} />))}
              </View>
              <View style={[styles.dotsColumn, { marginLeft: 4 }]}>
                {[0,1,2].map((k) => (<View key={`r-${k}`} style={styles.dot} />))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.cropFrame}>
          {editMode ? (
            <GestureDetector gesture={composed}>
              <Reanimated.View style={[StyleSheet.absoluteFillObject]}>
                <Reanimated.Image
                  source={{ uri: photo.uri }}
                  style={[styles.polaroidImageInner as any, animatedImageStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
                  resizeMode="cover"
                />
              </Reanimated.View>
            </GestureDetector>
          ) : (
            <Image
              source={{ uri: photo.uri }}
              style={[
                styles.polaroidImageInner,
                {
                  transform: [
                    { translateX: photo.crop?.offsetX ?? 0 },
                    { translateY: photo.crop?.offsetY ?? 0 },
                    { scale: photo.crop?.scale ?? 1 },
                  ],
                },
              ]}
              contentFit="cover"
            />
          )}
        </View>
        {index % 2 === 0 ? (
          <RNImage
            source={require('../../public/assets/tape-top-left (1)_compressed.webp')}
            style={[styles.tapeTopLeft as any, { width: 120, height: 78 }]}
          />
        ) : (
          <RNImage
            source={require('../../public/assets/tape-top-right (1)_compressed.webp')}
            style={[styles.tapeTopRight as any, { width: 120, height: 78 }]}
          />
        )}
        {/* Ellipsis options (edit mode only) - anchored to image inner corner */}
        {editMode && (
          <TouchableOpacity
            accessibilityLabel="Photo options"
            onPress={onOpenOptions}
            style={[
              styles.ellipsisButton,
              { zIndex: 5 },
              index % 2 === 0 ? { top: 18, right: 18 } : { top: 18, left: 18 },
            ]}
          >
            <View style={styles.ellipsisDotsRow}>
              <View style={styles.ellipsisDot} />
              <View style={styles.ellipsisDot} />
              <View style={styles.ellipsisDot} />
            </View>
          </TouchableOpacity>
        )}
        {editMode ? (
          <TextInput
            style={styles.captionInput}
            value={draftCaption}
            onChangeText={onUpdateCaption}
            placeholder="Add a caption..."
            placeholderTextColor="#A0A0A0"
            accessibilityLabel="Edit caption"
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
          />
        ) : (
          !!photo.caption && (
            <Text numberOfLines={2} style={[styles.polaroidCaption, { fontFamily: 'ZingScriptRust' }]}>
              {photo.caption}
            </Text>
          )
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
  },
  coverContent: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 28,
  },
  title: {
    fontSize: 64,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 16,
  },
  polaroidShadow: {
    // Shadows removed for a clean flat polaroid frame
  },
  polaroid: {
    width: SCREEN_WIDTH * 0.84,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 18,
    paddingBottom: 36,
    alignItems: 'center',
  },
  polaroidSmall: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 14,
    paddingBottom: 26,
    alignItems: 'center',
  },
  draggingCard: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 20,
  },
  dragHandle: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 32,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsColumn: {
    justifyContent: 'space-between',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#9C9C9C',
    margin: 2,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 0,
    backgroundColor: '#DDD',
  },
  cropFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    backgroundColor: '#DDD',
  },
  polaroidImageInner: {
    width: '100%',
    aspectRatio: 4 / 5,
  },
  coverImage: {
    width: SCREEN_WIDTH * 0.84,
    aspectRatio: 4 / 5,
    borderRadius: 10,
    backgroundColor: '#DDD',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  celebrationLottie: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  polaroidCaption: {
    marginTop: 14,
    fontSize: 22,
    color: '#000',
  },
  coverCaption: {
    marginTop: 18,
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: 24,
    width: SCREEN_WIDTH * 0.84,
  },
  nextArrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowHitbox: {
    padding: 8,
  },
  topLeftClose: {
    position: 'absolute',
    top: 46,
    left: 18,
    padding: 10,
    zIndex: 10,
  },
  topLeftCloseText: {
    fontSize: 24,
    color: '#AFAFAF',
    lineHeight: 24,
  },
  nextArrowInline: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nextArrowTextGrey: {
    fontSize: 28,
    color: '#8A8A8A',
  },
  dayHeaderRow: {
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixedDayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    elevation: 12,
    backgroundColor: '#EFEFEF',
  },
  fixedHeaderButton: {
    padding: 6,
  },
  dayTitle: {
    fontSize: 32,
    fontFamily: 'TimesCondensed',
  },
  backText: {
    fontSize: 22,
    color: '#000',
  },
  editBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 97, 68, 0.12)', // subtle orange at low opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeActive: {
    backgroundColor: '#EF6144',
  },
  editBadgeDisabled: {
    backgroundColor: '#E6E6E6',
  },
  dayPolaroidWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPolaroidContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  addCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E9E9E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  addPlus: {
    fontSize: 34,
    color: '#9E9E9E',
    lineHeight: 34,
  },
  captionInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFFFFF',
  },
  tapeTopLeft: {
    position: 'absolute',
    top: -8,
    left: -6,
    width: 90,
    height: 60,
    resizeMode: 'contain',
  },
  tapeTopRight: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 90,
    height: 60,
    resizeMode: 'contain',
  },
  polaroidPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#E6E6E6',
  },
  pageIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  pageIndicatorText: {
    fontSize: 18,
    color: '#8A8A8A',
    fontFamily: 'TimesCondensed',
  },
  pageArrowCircle: {
    padding: 8,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowText: {
    fontSize: 22,
    color: '#8A8A8A',
  },
  // Options lightbox styles
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsCard: {
    width: 220,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  optionsItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  optionsText: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
  },
  optionsDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  ellipsisButton: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ellipsisDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
});


