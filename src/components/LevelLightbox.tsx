import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LevelItem {
  level: number;
  unlocked: boolean;
  image: any;
}

interface LevelLightboxProps {
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const CARD_WIDTH = Math.min(screenWidth * 0.9, 420);
const CARD_HEIGHT = Math.min(screenHeight * 0.72, 680);
const CHARACTER_SIZE = Math.min(CARD_WIDTH, CARD_HEIGHT) * 0.8;
const HALO_SIZE = CHARACTER_SIZE * 1.2;

// Premium badge sizing
const BADGE_SIZE = Math.min(CARD_WIDTH, CARD_HEIGHT) * 1.24; // bigger main level image
const RING_THICKNESS = Math.round(Math.max(8, Math.min(10, BADGE_SIZE * 0.028)));
const BADGE_INNER = BADGE_SIZE - RING_THICKNESS * 2;
const BADGE_GLOW = Math.round(BADGE_INNER * 0.98);
const BADGE_IMAGE = Math.round(BADGE_INNER * 0.74);
const PROGRESS_TRACK_WIDTH = Math.round(CARD_WIDTH * 0.64);
const PROGRESS_TRACK_HEIGHT = 12;
const PAGE_PADDING_TOP = 36;
const BADGE_WRAP_MARGIN_TOP = 8; // move image a tiny bit further up
const BADGE_CENTER_Y = PAGE_PADDING_TOP + BADGE_WRAP_MARGIN_TOP + BADGE_SIZE / 2;
const RAIL_BAR_HEIGHT = 120;
const RAIL_BAR_TOP = BADGE_CENTER_Y - RAIL_BAR_HEIGHT / 2;
// Connector segment (wide pill) sizing
const CONNECT_SEGMENT_WIDTH = 16;
const CONNECT_SEGMENT_HEIGHT = 4;
const CONNECT_SEGMENT_SPACING = 8;

// Full-color level images (for reveal-all)
const LEVEL1_IMG = require('../../public/assets/Picflow Images Aug 11/level-1.webp');
const LEVEL2_IMG = require('../../public/assets/Picflow Images Aug 11/level-2.webp');
const LEVEL3_IMG = require('../../public/assets/Picflow Images Aug 11/level-3.webp');
const LEVEL4_IMG = require('../../public/assets/Picflow Images Aug 11/level-4.webp');
const LEVEL5_IMG = require('../../public/assets/Picflow Images Aug 11/level-5.webp');
const LEVEL6_IMG = require('../../public/assets/Picflow Images Aug 11/level-6.webp');
const LEVEL7_IMG = require('../../public/assets/Picflow Images Aug 11/level-7.webp');
const LEVEL8_IMG = require('../../public/assets/Picflow Images Aug 11/level-8.webp');
const LEVEL9_IMG = require('../../public/assets/Picflow Images Aug 11/level-9.webp');
const LEVEL10_IMG = require('../../public/assets/Picflow Images Aug 11/level-10.webp');

const LEVEL_COLOR_MAP: Record<number, any> = {
  1: LEVEL1_IMG,
  2: LEVEL2_IMG,
  3: LEVEL3_IMG,
  4: LEVEL4_IMG,
  5: LEVEL5_IMG,
  6: LEVEL6_IMG,
  7: LEVEL7_IMG,
  8: LEVEL8_IMG,
  9: LEVEL9_IMG,
  10: LEVEL10_IMG,
};

export const LevelLightbox: React.FC<LevelLightboxProps> = ({ visible, onClose, initialIndex = 0 }) => {
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userXp, setUserXp] = useState<number>(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // note: removed JS-side per-page progress tracking to enable native-driven scroll

  // Build 10 pages: unlock based on user's current level
  const levels: LevelItem[] = useMemo(() => {
    // Static imports required by the bundler (no dynamic require)
    const BLACK_2 = require('../../public/assets/levelbadges-blackedout/level-2-blackedout.webp');
    const BLACK_3 = require('../../public/assets/levelbadges-blackedout/level-3-blackedout.webp');
    const BLACK_4 = require('../../public/assets/levelbadges-blackedout/level-4-blackedout.webp');
    const BLACK_5 = require('../../public/assets/levelbadges-blackedout/level-5-blackedout.webp');
    const BLACK_6 = require('../../public/assets/levelbadges-blackedout/level-6-blackedout.webp');
    const BLACK_7 = require('../../public/assets/levelbadges-blackedout/level-7-blackedout.webp');
    const BLACK_8 = require('../../public/assets/levelbadges-blackedout/level-8-blackedout.webp');
    const BLACK_9 = require('../../public/assets/levelbadges-blackedout/level-9-blackedout.webp');
    const BLACK_10 = require('../../public/assets/levelbadges-blackedout/level-10-blackedout.webp');

    const blackMap: Record<number, any> = {
      1: LEVEL_COLOR_MAP[1],
      2: BLACK_2,
      3: BLACK_3,
      4: BLACK_4,
      5: BLACK_5,
      6: BLACK_6,
      7: BLACK_7,
      8: BLACK_8,
      9: BLACK_9,
      10: BLACK_10,
    };
    const arr: LevelItem[] = [];
    for (let i = 1; i <= 10; i++) {
      const unlocked = i <= userLevel;
      const src = unlocked ? LEVEL_COLOR_MAP[i] : blackMap[i];
      arr.push({ level: i, unlocked, image: src });
    }
    return arr;
  }, [userLevel]);

  // keep active index only; avoid extra animated calcs that force JS thread work

  useEffect(() => {
    if (visible) {
      // Load leveling state to determine unlocked levels and xp
      (async () => {
        try {
          const leveling = require('../utils/leveling');
          const state = await leveling.getLevelingState();
          const lvl = leveling.computeLevelFromXp(state.xp);
          setUserLevel(lvl);
          setUserXp(state.xp || 0);
        } catch {}
      })();
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }),
      ]).start();
      // ensure we open on requested index with zero-cost jump
      listRef.current?.scrollToIndex({ index: Math.min(initialIndex, levels.length - 1), animated: false });
    } else {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.96);
    }
  }, [visible, initialIndex, levels.length, opacityAnim, scaleAnim]);

  const onMomentumEnd = (ev: any) => {
    const x = ev.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_WIDTH);
    setActiveIndex(idx);
  };

  const renderLevelPage = useCallback(({ item, index }: { item: LevelItem; index: number }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];
    const characterTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [16, 6, -6],
      extrapolate: 'clamp',
    });
    const characterScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.97, 1, 0.97],
      extrapolate: 'clamp',
    });
    // Progress from this level to the next (0 -> 1 as you swipe right)
    // removed per-swipe connector progress to avoid JS-thread work
    const isLocked = !item.unlocked;
    const isUnlocked = !isLocked;
    const isLevelOne = item.level === 1;

    // XP/progress computation for this page
    let fillRatio = 0;
    let xpLabel = '0/100';
    try {
      const leveling = require('../utils/leveling');
      if (item.level < userLevel) {
        fillRatio = 1;
        xpLabel = '100/100';
      } else if (item.level === userLevel) {
        const { currentLevelXp, nextLevelXp } = leveling.xpToNextLevel(userXp);
        const levelSpan = Math.max(1, nextLevelXp - currentLevelXp);
        const gained = Math.max(0, Math.min(levelSpan, userXp - currentLevelXp));
        fillRatio = gained / levelSpan;
        xpLabel = `${gained}/${levelSpan}`;
      } else {
        fillRatio = 0;
        xpLabel = '0/100';
      }
    } catch {}

    return (
      <View style={styles.pageContainer}>
        {/* Rail moved to global position above to avoid duplicates */}
        {/* Segmented connector removed in favor of dash-dot rail */}
        {/* Large centered image slightly nearer to top */}
        <Animated.View style={[styles.badgeWrap, { transform: [{ translateY: characterTranslateY }, { scale: characterScale }] }]}> 
          <Image
            source={item.image}
            style={[styles.simpleBadgeImage]}
            contentFit="contain"
            recyclingKey={`level-${item.level}`}
            allowDownscaling
            priority={index === activeIndex ? 'high' : 'low'}
            cachePolicy="memory-disk"
            accessibilityLabel={`Level ${item.level}`}
          />
        </Animated.View>
        {/* Level pill (only show for unlocked level 1) */}
        {isLevelOne && isUnlocked && (
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>Level 1</Text>
          </View>
        )}
        {/* Locked pill for all locked pages */}
        {isLocked && (
          <View style={styles.lockedPill}>
            <Text style={styles.lockedPillText}>Locked</Text>
          </View>
        )}
        {/* Info button removed from page; now fixed on card */}
        {/* XP bar */}
        <View style={styles.simpleProgressContainer}>
          <View style={[styles.simpleProgressTrack, isLocked && styles.simpleProgressTrackLocked]}>
            <View style={[styles.simpleProgressFill, isLocked && styles.simpleProgressFillLocked, { width: PROGRESS_TRACK_WIDTH * fillRatio }]} />
          </View>
          <Text style={[styles.xpLabel, isLocked && styles.xpLabelLocked]}>{xpLabel}</Text>
        </View>
      </View>
    );
  }, [activeIndex, scrollX, userLevel, userXp]);

  // Cap the number of dash/dot rail segments to limit view count and mounting cost
  const dashSegmentCount = useMemo(() => {
    const ideal = Math.ceil((CARD_WIDTH * (levels.length - 1)) / 14) * 2;
    return Math.min(120, Math.max(40, ideal));
  }, [levels.length]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      <View style={styles.centerWrap}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], backgroundColor: colors.surface.primary }]}> 
          {/* Close */}
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close levels" style={[styles.closeBtn, isDark ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' } : null]}>
            <Icon name="close" size="md" color="text" />
          </TouchableOpacity>
          {/* Info button retained (optional) */}

          {/* Global rails behind badges (single instance across pages) */}
          <View style={[styles.railBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} pointerEvents="none" />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.globalDashRail,
              {
                width: CARD_WIDTH * levels.length,
                transform: [
                  { translateX: Animated.add(Animated.multiply(scrollX, -1), new Animated.Value(CARD_WIDTH * 0.5)) },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.dashDotRailContainer,
                { left: 0, right: 0 },
              ]}
            >
              {Array.from({ length: dashSegmentCount }).map((_, i) =>
                i % 2 === 0 ? (
                  <View key={`dash-${i}`} style={styles.dashSegment} />
                ) : (
                  <View key={`dot-${i}`} style={styles.dotSegment} />
                )
              )}
            </View>
          </Animated.View>

          {/* Pager */}
          <Animated.FlatList
            ref={listRef}
            data={levels}
            keyExtractor={(it) => `level-${it.level}`}
            renderItem={renderLevelPage as any}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            snapToAlignment="center"
            initialScrollIndex={Math.min(initialIndex, levels.length - 1)}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(data, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
            decelerationRate="fast"
          />

          {/* Progress bar removed as requested */}

           {/* Dots */}
          <View style={styles.dotsRow}>
            {levels.map((_, idx) => {
              const inputRange = [
                (idx - 1) * CARD_WIDTH,
                idx * CARD_WIDTH,
                (idx + 1) * CARD_WIDTH,
              ];
              const dotScale = scrollX.interpolate({ inputRange, outputRange: [1, 1.4, 1], extrapolate: 'clamp' });
              const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
              const isActive = idx === activeIndex;
              const isActiveLocked = isActive && levels[idx] && !levels[idx].unlocked;
              return (
                <Animated.View
                  key={`dot-${idx}`}
                  style={[
                    styles.dot,
                    {
                      opacity: dotOpacity,
                      transform: [{ scale: dotScale }],
                      backgroundColor: isActive
                        ? (isActiveLocked ? (isDark ? '#fff' : '#000') : '#f97316')
                        : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)')
                    },
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: '#FFFFFF', // pure white base to avoid banding
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)'
  },
  pageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingTop: PAGE_PADDING_TOP,
    alignItems: 'center',
  },
  // old dottedRail removed; replaced by dashDotRailContainer above
  railBar: {
    position: 'absolute',
    top: RAIL_BAR_TOP,
    left: 0,
    right: 0,
    height: RAIL_BAR_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.06)',
    zIndex: 0,
  },
  // Ensure badges sit above; rail is below
  dashDotRailContainer: {
    position: 'absolute',
    top: BADGE_CENTER_Y - 1,
    left: BADGE_SIZE / 2,
    right: BADGE_SIZE / 2,
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    opacity: 0.4,
  },
  globalDashRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: CARD_HEIGHT,
    zIndex: 0,
    overflow: 'hidden',
  },
  dashSegment: {
    width: 14,
    height: 3,
    backgroundColor: '#6b7280',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  dotSegment: {
    width: 5,
    height: 5,
    backgroundColor: '#6b7280',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  bgClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    borderRadius: 0,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject as any,
  },
  bronzeOverlay: {
    ...StyleSheet.absoluteFillObject as any,
  },
  sparkleA: {
    position: 'absolute',
    top: CARD_HEIGHT * 0.2,
    left: CARD_WIDTH * 0.08,
    opacity: 0.6,
  },
  sparkleB: {
    position: 'absolute',
    top: CARD_HEIGHT * 0.32,
    right: CARD_WIDTH * 0.06,
    opacity: 0.5,
  },
  underCircleGlow: {
    position: 'absolute',
    top: CARD_HEIGHT * 0.46,
    left: CARD_WIDTH * 0.15,
    width: CARD_WIDTH * 0.7,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(205,127,50,0.15)',
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  crownWrap: {
    position: 'absolute',
    top: CARD_HEIGHT * 0.06,
    alignSelf: 'center',
    opacity: 0.9,
  },
  ribbonLeft: {
    position: 'absolute',
    left: CARD_WIDTH * 0.1,
    top: 8,
    width: CARD_WIDTH * 0.18,
    height: 14,
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6,
    transform: [{ rotate: '-10deg' }],
  },
  ribbonRight: {
    position: 'absolute',
    right: CARD_WIDTH * 0.1,
    top: 8,
    width: CARD_WIDTH * 0.18,
    height: 14,
    borderBottomRightRadius: 6,
    borderTopRightRadius: 6,
    transform: [{ rotate: '10deg' }],
  },
  laurelLeft: {
    position: 'absolute',
    left: CARD_WIDTH * 0.08,
    top: -6,
    opacity: 0.8,
  },
  laurelRight: {
    position: 'absolute',
    right: CARD_WIDTH * 0.08,
    top: -6,
    opacity: 0.8,
  },
  unlockedBgBase: {
    ...StyleSheet.absoluteFillObject as any,
  },
  // Subtle shape layers for unlocked background
  unlockedBanner: {
    position: 'absolute',
    width: CARD_WIDTH * 1.28,
    height: CARD_HEIGHT * 0.22,
    top: CARD_HEIGHT * 0.12,
    left: -CARD_WIDTH * 0.14,
    borderRadius: 30,
    transform: [{ rotate: '11deg' }],
  },
  unlockedBannerBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 1.28,
    height: CARD_HEIGHT * 0.22,
    top: CARD_HEIGHT * 0.12,
    left: -CARD_WIDTH * 0.14,
    borderRadius: 30,
    transform: [{ rotate: '11deg' }],
  },
  unlockedCircle: {
    position: 'absolute',
    width: CARD_WIDTH * 0.86,
    height: CARD_WIDTH * 0.86,
    borderRadius: (CARD_WIDTH * 0.86) / 2,
    right: -CARD_WIDTH * 0.08,
    bottom: CARD_HEIGHT * 0.16,
  },
  unlockedCircleBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 0.86,
    height: CARD_WIDTH * 0.86,
    borderRadius: (CARD_WIDTH * 0.86) / 2,
    right: -CARD_WIDTH * 0.08,
    bottom: CARD_HEIGHT * 0.16,
  },
  // Badge styles
  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    marginTop: BADGE_WRAP_MARGIN_TOP,
    marginBottom: 36,
    zIndex: 3,
  },
  badgeOuter: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 10,
  },
  badgeShadowWrap: {
    position: 'absolute',
    width: BADGE_INNER,
    height: BADGE_INNER,
    borderRadius: BADGE_INNER / 2,
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
  badgeInner: {
    position: 'absolute',
    width: BADGE_INNER,
    height: BADGE_INNER,
    borderRadius: BADGE_INNER / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.95)'
  },
  badgeInnerUnlocked: {
    backgroundColor: '#fffdf9',
  },
  badgeInnerLocked: {
    backgroundColor: '#FFFFFF',
  },
  badgeGlow: {
    position: 'absolute',
    width: BADGE_GLOW,
    height: BADGE_GLOW,
    borderRadius: BADGE_GLOW / 2,
  },
  badgeShine: {
    position: 'absolute',
    width: BADGE_SIZE * 0.7,
    height: BADGE_SIZE * 0.7,
    borderRadius: (BADGE_SIZE * 0.7) / 2,
    top: -BADGE_SIZE * 0.05,
    left: -BADGE_SIZE * 0.02,
    transform: [{ rotate: '-20deg' }],
  },
  badgeClip: {
    position: 'absolute',
    width: BADGE_INNER,
    height: BADGE_INNER,
    borderRadius: BADGE_INNER / 2,
    overflow: 'hidden',
  },
  badgeImage: {
    width: BADGE_IMAGE,
    height: BADGE_IMAGE,
    marginTop: -8,
  },
  simpleBadgeImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    marginTop: 12,
  },
  characterImageLocked: {
    tintColor: '#9CA3AF',
  },
  lockWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    position: 'absolute',
    width: BADGE_IMAGE,
    height: BADGE_IMAGE,
    borderRadius: BADGE_IMAGE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  lockGlow: {
    position: 'absolute',
    width: Math.floor(BADGE_IMAGE * 0.62),
    height: Math.floor(BADGE_IMAGE * 0.62),
    borderRadius: Math.floor(BADGE_IMAGE * 0.62) / 2,
    backgroundColor: 'rgba(230,180,0,0.16)',
    shadowColor: '#E6B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  lockEmoji: {
    fontSize: Math.floor(BADGE_IMAGE * 0.55),
    textShadowColor: 'rgba(230,180,0,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  badgeEmoji: {
    fontSize: Math.floor(BADGE_IMAGE * 0.75),
    marginTop: -6,
  },
  characterLocked: {
    color: '#9CA3AF',
  },
  // ring shine/shadow styles removed
  // Gold crest framed title
  crestWrapper: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Math.round(CARD_WIDTH * 0.75),
  },
  crestOuter: {
    padding: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    // subtle metallic rim
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.6)'
  },
  crestInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  crestInnerUnlocked: {
    backgroundColor: '#fffcf6',
  },
  crestInnerBronze: {
    backgroundColor: '#FFF5E6',
  },
  crestLevel: {
    fontSize: 22,
    fontFamily: 'Merienda',
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  crestLevelBronze: {
    color: '#3b2a15',
  },
  crestName: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  crestNameBronze: {
    color: '#4a3720',
  },
  titleBlurWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: -6,
    right: -6,
    bottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  titleFrostOverlay: {
    position: 'absolute',
    top: 0,
    left: -6,
    right: -6,
    bottom: 0,
    borderRadius: 10,
  },
  titleFeather: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    height: '100%',
    borderRadius: 12,
  },
  titleFeatherVertical: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 6,
  },
  crestTipLeft: {
    position: 'absolute',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    left: -10,
    top: '50%',
    marginTop: -6,
    borderRadius: 3,
    opacity: 0.9,
  },
  crestTipRight: {
    position: 'absolute',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    right: -10,
    top: '50%',
    marginTop: -6,
    borderRadius: 3,
    opacity: 0.9,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 28, // move up a tiny bit (bigger value = closer to bottom? Actually increasing pushes away from bottom; we want move up => increase from 24 to 32? In absolute bottom, larger pushes up)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  dotActive: {
    backgroundColor: '#f97316', // ensure active dot is orange
  },
  simpleProgressContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleProgressTrack: {
    width: PROGRESS_TRACK_WIDTH,
    height: PROGRESS_TRACK_HEIGHT,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
    backgroundColor: '#ECECEC',
    overflow: 'hidden',
  },
  simpleProgressTrackLocked: {
    backgroundColor: '#E5E7EB',
  },
  simpleProgressFill: {
    width: PROGRESS_TRACK_WIDTH * 0.5,
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
  },
  simpleProgressFillLocked: {
    width: 0,
    backgroundColor: '#9CA3AF',
  },
  xpLabel: {
    marginTop: 10,
    fontSize: 20,
    color: 'rgba(249,115,22,0.5)', // a bit more transparent
    fontWeight: '800',
  },
  xpLabelLocked: {
    color: '#9CA3AF',
  },
  levelPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 18,
    paddingVertical: 6, // slightly less tall
    borderRadius: 16,
    backgroundColor: 'rgba(249,115,22,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.56)',
  },
  levelPillText: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  lockedPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(107,114,128,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(55,65,81,0.42)',
  },
  lockedPillText: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  infoBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28, // smaller button
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)', // subtle bg for touch target
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    color: 'rgba(0,0,0,0.6)', // semi transparent
    fontWeight: '900',
    fontSize: 14,
  },
  infoBtnFixed: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  revealBtn: {
    position: 'absolute',
    right: 60, // a tiny bit left of the close button area
    top: 12,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  revealBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  // Connector progress under badge
  progressTrack: {
    marginTop: 26,
    width: PROGRESS_TRACK_WIDTH,
    height: PROGRESS_TRACK_HEIGHT,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
    backgroundColor: '#ECECEC',
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  progressFillWrapper: {
    height: '100%',
  },
  progressFill: {
    ...StyleSheet.absoluteFillObject as any,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
  },
  // New connector bar between circles
  connectorRow: {
    position: 'absolute',
    top: CARD_HEIGHT * 0.54,
    left: 0,
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  connectorTrack: {
    width: PROGRESS_TRACK_WIDTH,
    height: PROGRESS_TRACK_HEIGHT,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
    backgroundColor: '#ECECEC',
    overflow: 'hidden',
  },
  connectorFillWrapper: {
    height: '100%',
  },
  connectorFill: {
    ...StyleSheet.absoluteFillObject as any,
    borderRadius: PROGRESS_TRACK_HEIGHT / 2,
  },
  progressTracker: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressTrackerBronze: {
    backgroundColor: '#CD7F32',
    shadowColor: '#CD7F32',
  },
  crestBgGradient: {
    ...StyleSheet.absoluteFillObject as any,
  },
  crestHighlight: {
    position: 'absolute',
    left: 6,
    top: 3,
    right: 6,
    height: 14,
    borderRadius: 8,
  },
  crestShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
  },
  // Branded background layers for unlocked
  brandBackdrop: {
    ...StyleSheet.absoluteFillObject as any,
  },
  brandBlobTL: {
    position: 'absolute',
    width: CARD_WIDTH * 0.9,
    height: CARD_WIDTH * 0.9,
    borderRadius: (CARD_WIDTH * 0.9) / 2,
    backgroundColor: 'rgba(244,132,95,0.14)', // coral
    top: CARD_HEIGHT * 0.13,
    left: -CARD_WIDTH * 0.28,
  },
  brandBlobTLBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 0.9,
    height: CARD_WIDTH * 0.9,
    borderRadius: (CARD_WIDTH * 0.9) / 2,
    top: CARD_HEIGHT * 0.13,
    left: -CARD_WIDTH * 0.28,
  },
  brandBannerTL: {
    position: 'absolute',
    width: CARD_WIDTH * 1.25,
    height: CARD_HEIGHT * 0.22,
    top: CARD_HEIGHT * 0.12,
    left: -CARD_WIDTH * 0.18,
    borderRadius: 28,
    transform: [{ rotate: '11deg' }],
  },
  brandBannerTLBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 1.25,
    height: CARD_HEIGHT * 0.22,
    top: CARD_HEIGHT * 0.12,
    left: -CARD_WIDTH * 0.18,
    borderRadius: 28,
    transform: [{ rotate: '11deg' }],
  },
  brandBlobBR: {
    position: 'absolute',
    width: CARD_WIDTH * 0.8,
    height: CARD_WIDTH * 0.8,
    borderRadius: (CARD_WIDTH * 0.8) / 2,
    backgroundColor: 'rgba(217,70,239,0.12)', // purple/magenta
    right: -CARD_WIDTH * 0.22,
    bottom: CARD_HEIGHT * 0.08,
  },
  brandBlobBRBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 0.8,
    height: CARD_WIDTH * 0.8,
    borderRadius: (CARD_WIDTH * 0.8) / 2,
    right: -CARD_WIDTH * 0.22,
    bottom: CARD_HEIGHT * 0.08,
  },
  badgeRingSheen: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
  badgeTopGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BADGE_SIZE * 0.22,
  },
  ringAmbientGlow: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 14,
  },
});

export default LevelLightbox;


