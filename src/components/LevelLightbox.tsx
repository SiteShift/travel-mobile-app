import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LevelItem {
  level: number;
  name: string;
  character: string; // Will later be an image source
  unlocked: boolean;
  description?: string;
  color: string;
  image?: any; // Placeholder 3D image source (uri or require)
}

interface LevelLightboxProps {
  visible: boolean;
  onClose: () => void;
  levels: LevelItem[];
  initialIndex?: number;
}

const CARD_WIDTH = Math.min(screenWidth * 0.9, 420);
const CARD_HEIGHT = Math.min(screenHeight * 0.72, 680);
const CHARACTER_SIZE = Math.min(CARD_WIDTH, CARD_HEIGHT) * 0.8;
const HALO_SIZE = CHARACTER_SIZE * 1.2;

// Premium badge sizing
const BADGE_SIZE = Math.min(CARD_WIDTH, CARD_HEIGHT) * 0.82;
const RING_THICKNESS = Math.round(Math.max(8, Math.min(10, BADGE_SIZE * 0.028)));
const BADGE_INNER = BADGE_SIZE - RING_THICKNESS * 2;
const BADGE_GLOW = Math.round(BADGE_INNER * 0.98);
const BADGE_IMAGE = Math.round(BADGE_INNER * 0.74);
const PROGRESS_TRACK_WIDTH = Math.round(CARD_WIDTH * 0.64);
const PROGRESS_TRACK_HEIGHT = 8;

export const LevelLightbox: React.FC<LevelLightboxProps> = ({ visible, onClose, levels, initialIndex = 0 }) => {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // per-slide local progress will be computed inside render

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }),
      ]).start();
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: Math.min(initialIndex, levels.length - 1), animated: false });
      }, 0);
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

  const renderLevelPage = ({ item, index }: { item: LevelItem; index: number }) => {
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
    const toNextProgressWidth = scrollX.interpolate({
      inputRange: [index * CARD_WIDTH, (index + 1) * CARD_WIDTH],
      outputRange: [0, PROGRESS_TRACK_WIDTH],
      extrapolate: 'clamp',
    });
    const isLocked = !item.unlocked;
    const isUnlocked = !isLocked;
    const isLevelOne = item.level === 1;

    // Crest color sets
    const crestOuterColors = isLocked
      ? (['#9CA3AF', '#6B7280'] as const)
      : isLevelOne
        ? (['#E0A060', '#CD7F32', '#B46A2A'] as const) // bronze for Level 1
        : (['#FFE08A', '#F9C846', '#E6B400'] as const);
    const crestTipLeftColors = isLocked
      ? (['#9CA3AF', '#6B7280'] as const)
      : isLevelOne
        ? (['#E0A060', '#B46A2A'] as const)
        : (['#FFE08A', '#E6B400'] as const);
    const crestTipRightColors = isLocked
      ? (['#9CA3AF', '#6B7280'] as const)
      : isLevelOne
        ? (['#E0A060', '#B46A2A'] as const)
        : (['#FFE08A', '#E6B400'] as const);

    return (
      <View style={styles.pageContainer}>
        {isUnlocked && (
          <>
            {/* Soft blur wash for Level 1 to add premium depth */}
            {isLevelOne && (
              <BlurView intensity={26} tint="light" style={styles.unlockedBgBlur} />
            )}
            {/* Soft warm base */}
            <LinearGradient
              colors={[ '#fff7ed', '#fffaf3' ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unlockedBgBase}
            />
            {/* Subtle brand gradient overlay (restored) */}
            <LinearGradient
              colors={[ 'rgba(244,132,95,0.10)', 'rgba(249,115,22,0.06)', 'rgba(217,70,239,0.10)' ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unlockedGradientOverlay}
              pointerEvents="none"
            />
            {/* Diagonal band removed to avoid white-circle artifact */}
            {/* Very soft color wash for Level 1 */}
            {isLevelOne && (
              <LinearGradient
                colors={[ 'rgba(244,132,95,0.08)', 'rgba(249,115,22,0.06)', 'rgba(217,70,239,0.06)' ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockedColorWash}
              />
            )}
            {/* Blobs */}
            <View style={[styles.unlockedBlobBR, isLevelOne && { backgroundColor: 'rgba(217,70,239,0.10)' }]} />
            {/* Blur the blobs slightly */}
            <BlurView intensity={22} tint="light" style={styles.unlockedBlobBRBlur} pointerEvents="none" />
            {/* Overall extra blur for unlocked */}
            <BlurView intensity={isLevelOne ? 18 : 16} tint="light" style={styles.unlockedOverallBlur} pointerEvents="none" />
            {/* Subtle vignette */}
            <LinearGradient
              colors={[ 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)' ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.unlockedVignetteTop}
            />
            <LinearGradient
              colors={[ 'rgba(0,0,0,0)', 'rgba(0,0,0,0.05)' ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.unlockedVignetteBottom}
            />
          </>
        )}
        {/* Premium badge */}
        <Animated.View style={[styles.badgeWrap, { transform: [{ translateY: characterTranslateY }, { scale: characterScale }] }]}> 
          {/* Outer gradient ring */}
          <LinearGradient
            colors={isLocked ? ['#9CA3AF', '#6B7280'] : ['#f4845f', '#f97316', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeOuter}
          />
          {/* Inner white circle to create ring */}
          <View style={[styles.badgeInner, isLocked ? styles.badgeInnerLocked : styles.badgeInnerUnlocked]} />
          {/* Inner effects clipped to circle (unlocked only) */}
          {!isLocked && (
            <View style={styles.badgeClip} pointerEvents="none">
              <LinearGradient
                colors={['#fff7f2', '#ffefe6', '#ffe9fb']}
                start={{ x: 0.15, y: 0.1 }}
                end={{ x: 0.9, y: 0.95 }}
                style={styles.badgeGlow}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeShine}
              />
            </View>
          )}

          {/* Character / Lock */}
          {item.image && !isLocked ? (
            <Image
              source={item.image}
              style={[styles.badgeImage, isLocked && styles.characterImageLocked]}
              contentFit="contain"
              accessibilityLabel={`${item.name} character`}
            />
          ) : isLocked ? (
            <View style={styles.lockWrap}>
              <View style={styles.lockCircle} />
              <View style={styles.lockGlow} />
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
          ) : (
            <Text style={[styles.badgeEmoji, isLocked && styles.characterLocked]}>{item.character}</Text>
          )}
        </Animated.View>

        {/* Gold crest frame (outlined) */}
        <View style={styles.crestWrapper}>
          <LinearGradient
            colors={crestOuterColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.crestOuter}
          >
            <View style={[styles.crestInner, !isLocked && styles.crestInnerUnlocked]}>
              {/* Subtle 3D background only when unlocked */}
              {!isLocked && (
                <>
                  <LinearGradient
                    colors={['#fff7ed', '#fffaf3']}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.crestBgGradient}
                  />
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.crestHighlight}
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.crestShadow}
                  />
                </>
              )}
              <Text style={styles.crestLevel}>Level {item.level}</Text>
              {/* Title: blur only when locked */}
              <View style={styles.titleBlurWrap}>
                <Text style={styles.crestName}>{item.name}</Text>
                {isLocked && (
                  <>
                    <BlurView
                      intensity={16}
                      tint="light"
                      style={styles.titleBlurOverlay}
                      accessibilityLabel="Locked title"
                    />
                    <LinearGradient
                      colors={[ 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.35)' ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.titleFrostOverlay}
                      pointerEvents="none"
                    />
                    <LinearGradient
                      colors={[ 'rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)' ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.titleFeather}
                      pointerEvents="none"
                    />
                    <LinearGradient
                      colors={[ 'rgba(255,255,255,0)', 'rgba(255,255,255,0.12)' ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.titleFeatherVertical}
                      pointerEvents="none"
                    />
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
          {/* Crest side tips */}
          <LinearGradient colors={crestTipLeftColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crestTipLeft} />
          <LinearGradient colors={crestTipRightColors} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.crestTipRight} />
        </View>

        {/* Connector progress to next badge */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrapper, { width: toNextProgressWidth }]}>
            <LinearGradient colors={['#f4845f', '#f97316', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      <View style={styles.centerWrap}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}> 
          {/* Close */}
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close levels" style={styles.closeBtn}>
            <Icon name="close" size="md" color="text" />
          </TouchableOpacity>

          {/* Pager */}
          <Animated.FlatList
            ref={listRef}
            data={levels}
            keyExtractor={(it) => `level-${it.level}`}
            renderItem={renderLevelPage as any}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(data, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          />

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
              return (
                <Animated.View key={`dot-${idx}`} style={[styles.dot, { opacity: dotOpacity, transform: [{ scale: dotScale }] }]} />
              );
            })}
          </View>

          {/* Progress bar */}
          {/* The global progress bar is removed, but the dots and connector remain */}
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
    backgroundColor: '#FFFFFF',
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
    paddingTop: 56,
    alignItems: 'center',
  },
  unlockedBgBase: {
    ...StyleSheet.absoluteFillObject as any,
  },
  unlockedGradientOverlay: {
    ...StyleSheet.absoluteFillObject as any,
  },
  unlockedBgBlur: {
    ...StyleSheet.absoluteFillObject as any,
  },
  unlockedColorWash: {
    ...StyleSheet.absoluteFillObject as any,
  },
  unlockedOverallBlur: {
    ...StyleSheet.absoluteFillObject as any,
  },
  unlockedBgBand: {
    position: 'absolute',
    width: CARD_WIDTH * 1.1,
    height: CARD_HEIGHT * 0.3,
    top: CARD_HEIGHT * 0.04,
    borderRadius: 28,
    transform: [{ rotate: '8deg' }],
  },
  unlockedBgBandBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 1.1,
    height: CARD_HEIGHT * 0.3,
    top: CARD_HEIGHT * 0.04,
    borderRadius: 28,
    transform: [{ rotate: '8deg' }],
  },
  unlockedBlobTL: {
    position: 'absolute',
    width: CARD_WIDTH * 0.6,
    height: CARD_WIDTH * 0.6,
    borderRadius: (CARD_WIDTH * 0.6) / 2,
    backgroundColor: 'rgba(244,132,95,0.08)',
    top: CARD_HEIGHT * 0.08,
    left: -CARD_WIDTH * 0.15,
  },
  unlockedBlobTLBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 0.6,
    height: CARD_WIDTH * 0.6,
    borderRadius: (CARD_WIDTH * 0.6) / 2,
    top: CARD_HEIGHT * 0.08,
    left: -CARD_WIDTH * 0.15,
  },
  unlockedBlobBR: {
    position: 'absolute',
    width: CARD_WIDTH * 0.55,
    height: CARD_WIDTH * 0.55,
    borderRadius: (CARD_WIDTH * 0.55) / 2,
    backgroundColor: 'rgba(217,70,239,0.06)',
    bottom: CARD_HEIGHT * 0.16,
    right: -CARD_WIDTH * 0.12,
  },
  unlockedBlobBRBlur: {
    position: 'absolute',
    width: CARD_WIDTH * 0.55,
    height: CARD_WIDTH * 0.55,
    borderRadius: (CARD_WIDTH * 0.55) / 2,
    bottom: CARD_HEIGHT * 0.16,
    right: -CARD_WIDTH * 0.12,
  },
  unlockedVignetteTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 24,
  },
  unlockedVignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
  },
  // Badge styles
  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    marginTop: 18,
    marginBottom: 36,
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
  // Gold crest framed title
  crestWrapper: {
    marginTop: 34,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: Math.round(CARD_WIDTH * 0.64),
  },
  crestOuter: {
    padding: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  crestInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  crestInnerUnlocked: {
    backgroundColor: '#fffcf6',
  },
  crestLevel: {
    fontSize: 22,
    fontFamily: 'Merienda',
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.6,
    lineHeight: 24,
  },
  crestName: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
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
    bottom: 12,
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
    backgroundColor: '#111827',
  },
  // Connector progress under badge
  progressTrack: {
    marginTop: 18,
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
  crestBgGradient: {
    ...StyleSheet.absoluteFillObject as any,
  },
  crestHighlight: {
    position: 'absolute',
    left: 6,
    top: 4,
    right: 6,
    height: 10,
    borderRadius: 8,
  },
  crestShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
  },
});

export default LevelLightbox;


