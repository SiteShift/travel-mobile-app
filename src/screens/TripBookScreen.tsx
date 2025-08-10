import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ScrollView, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

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

export default function TripBookScreen({ tripId }: TripBookScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState<{ id: string; title: string; description: string; coverImage: string; monthYear: string; startDate?: Date; endDate?: Date } | null>(null);
  const [useRNImage, setUseRNImage] = useState(false);
  const [dayPhotos, setDayPhotos] = useState<Record<number, string[]>>({});

  // Horizontal pager
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);

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
      // If the stored cover is missing, attempt to read the pending cover as last resort
      if (!t.coverImage) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const pending = await AsyncStorage.getItem('pending_cover_image');
          if (pending) t.coverImage = pending;
        } catch {}
      }
      setTrip(t);
      // Initialize days photos arrays based on duration
      const days: Record<number, string[]> = {};
      const start = t.startDate ?? new Date();
      const end = t.endDate ?? start;
      const msPerDay = 24 * 60 * 60 * 1000;
      const total = Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / msPerDay) + 1);
      for (let i = 1; i <= total; i++) days[i] = [];
      setDayPhotos(days);
    })();
  }, [tripId]);

  // Run sequential entrance animation once trip is loaded
  useEffect(() => {
    if (!trip) return;
    titleOpacity.setValue(0);
    dateOpacity.setValue(0);
    imageOpacity.setValue(0);
    descOpacity.setValue(0);
    arrowOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(dateOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(descOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(arrowOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [trip]);

  // Fade the day title on page change
  useEffect(() => {
    if (pageIndex > 0) {
      dayTitleOpacity.setValue(0);
      Animated.timing(dayTitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
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
      const uris: string[] = [];
      for (const a of res.assets) {
        const u = await ensureFileUriAsync(a.uri);
        uris.push(u);
      }
      setDayPhotos(prev => ({ ...prev, [day]: [...(prev[day] || []), ...uris] }));
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
        {/* Tiny close arrow top-left */}
        <TouchableOpacity accessibilityLabel="Close" onPress={() => router.replace('/(tabs)')} style={styles.topLeftClose}>
          <Text style={styles.topLeftCloseText}>×</Text>
        </TouchableOpacity>

        <View style={[styles.coverContent, { paddingTop: 90 }]}>
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
          <Animated.View style={[styles.nextArrowRow, { width: POLAROID_WIDTH, marginTop: 68, opacity: arrowOpacity }]}> 
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
            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingTop: 190, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              {/* Add Photos placeholder at top if no photos yet */}
              {photos.length === 0 && (
                <TouchableOpacity onPress={() => handleAddPhotos(day)} activeOpacity={0.9} style={[styles.addPolaroidContainer, { marginTop: 16 }] }>
                  <View style={styles.polaroidSmall}> 
                    <View style={[styles.polaroidPlaceholder, { backgroundColor: '#F0F0F0' }]} />
                    <View style={[styles.addCircle, { position: 'absolute', top: 24 }]}><Text style={styles.addPlus}>+</Text></View>
                    <Text numberOfLines={1} style={[styles.polaroidCaption, { fontFamily: 'ZingScriptRust' }]}>Add Photos</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Each photo as its own polaroid row */}
              {photos.map((uri, i) => (
                <View key={`${uri}-${i}`} style={{ alignItems: 'center', marginBottom: 28 }}>
                  <View style={[
                    styles.polaroidSmall,
                    {
                      transform: [{ rotate: i % 2 === 0 ? '-2deg' : '2deg' }],
                      alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
                      marginLeft: i % 2 === 0 ? 24 : 0,
                      marginRight: i % 2 === 1 ? 24 : 0,
                    },
                  ]}> 
                    {/* Image first, then tape overlay to appear above */}
                    <Image source={{ uri }} style={styles.polaroidImage} contentFit="cover" />
                    {i % 2 === 0 ? (
                      <RNImage source={require('../../public/assets/tape-top-left (1)_compressed.webp')} style={[styles.tapeTopLeft as any, { width: 110, height: 72 }]} />
                    ) : (
                      <RNImage source={require('../../public/assets/tape-top-right (1)_compressed.webp')} style={[styles.tapeTopRight as any, { width: 110, height: 72 }]} />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Bottom page indicator with arrows */}
            <View style={[styles.pageIndicatorRow, { position: 'relative' }]}>
              <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day - 1), animated: true })} style={styles.pageArrowCircle}>
                <Text style={styles.pageArrowText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicatorText}>Page {day} of {totalDays}</Text>
              <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (day + 1), animated: true })} style={styles.pageArrowCircle}>
                <Text style={styles.pageArrowText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      </ScrollView>

      {/* Fixed header overlay for day pages */}
      {/* Always render header overlay; visible on all pages; hidden elements on cover */}
      <View pointerEvents="box-none" style={[styles.fixedDayHeader, { paddingTop: insets.top + 72, paddingBottom: 20 }]}> 
        <TouchableOpacity
          accessibilityLabel="Back to cover"
          onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })}
          style={styles.fixedHeaderButton}
        >
          <Text style={[styles.backText, { opacity: pageIndex > 0 ? 1 : 0.4 }]}>{'←'}</Text>
        </TouchableOpacity>
        <Animated.Text style={[styles.dayTitle, { color: '#000', opacity: pageIndex > 0 ? 1 : 0.4 }]}>{pageIndex > 0 ? `Day ${currentDayNumber}` : ' '}</Animated.Text>
        <TouchableOpacity accessibilityLabel="Edit Day" activeOpacity={0.8} style={[styles.editBadge, { marginRight: 18, opacity: pageIndex > 0 ? 1 : 0.4 }]}> 
          <Image source={require('../../public/assets/pencil-icon.svg')} style={{ width: 16, height: 16 }} contentFit="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  polaroidImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 0,
    backgroundColor: '#DDD',
  },
  coverImage: {
    width: SCREEN_WIDTH * 0.84,
    aspectRatio: 4 / 5,
    borderRadius: 10,
    backgroundColor: '#DDD',
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
    height: 140,
    paddingTop: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 64,
  },
  pageIndicatorText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'TimesCondensed',
  },
  pageArrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageArrowText: {
    fontSize: 22,
    color: '#000',
  },
});


