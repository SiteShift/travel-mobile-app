import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LevelItem {
  level: number;
  name: string;
  character: string; // Will later be an image source
  unlocked: boolean;
  description?: string;
  color: string;
}

interface LevelLightboxProps {
  visible: boolean;
  onClose: () => void;
  levels: LevelItem[];
  initialIndex?: number;
}

const CARD_WIDTH = Math.min(screenWidth * 0.9, 420);
const CARD_HEIGHT = Math.min(screenHeight * 0.72, 680);

export const LevelLightbox: React.FC<LevelLightboxProps> = ({ visible, onClose, levels, initialIndex = 0 }) => {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

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
    const gradientColors = item.unlocked ? [item.color, `${item.color}66`] : ['#9CA3AF', '#6B7280'];
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];
    const bannerTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, -40],
      extrapolate: 'clamp',
    });
    const characterTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [60, 0, -60],
      extrapolate: 'clamp',
    });
    const characterScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.pageContainer}>
        <Animated.View style={[styles.bannerWrap, { transform: [{ translateX: bannerTranslateX }] }]}>
          <LinearGradient colors={gradientColors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner} />
        </Animated.View>
        {/* Character crest (ready for custom images later) */}
        <Animated.View style={[styles.crest, { transform: [{ translateX: characterTranslateX }, { scale: characterScale }] }]}>
          <LinearGradient colors={['#ffffff', 'rgba(255,255,255,0.75)']} style={styles.crestOuter} />
          <View style={styles.crestInner}>
            <Text style={styles.character}>{item.character}</Text>
          </View>
        </Animated.View>
        <Text style={styles.levelTitle}>Level {item.level}</Text>
        <Text style={styles.levelName}>{item.name}</Text>
        {!!item.description && <Text style={styles.levelDescription}>{item.description}</Text>}

        {/* XP Ring (static placeholder) */}
        <View style={styles.xpRingContainer}>
          <View style={styles.xpRing} />
          <View style={styles.xpRingInner}>
            <Text style={styles.xpText}>XP</Text>
            <Text style={styles.xpSubText}>—</Text>
          </View>
        </View>

        {/* Rewards Strip */}
        <View style={styles.rewardsRow}>
          {[0, 1, 2].map((i) => (
            <View key={`rw-${i}`} style={[styles.rewardChip, !item.unlocked && styles.rewardLocked]}>
              <Text style={styles.rewardText}>{item.unlocked ? '⭐' : '🔒'}</Text>
            </View>
          ))}
        </View>

        {/* Challenges Pills */}
        <View style={styles.challengesRow}>
          {[0, 1, 2].map((i) => (
            <View key={`ch-${i}`} style={styles.challengePill}>
              <Icon name="check" size="sm" color="white" />
              <Text style={styles.challengeText}>Challenge {i + 1}</Text>
              <View style={styles.challengeXp}><Text style={styles.challengeXpText}>+50</Text></View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      <View style={styles.centerWrap}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}> 
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject as any} />
          <View style={styles.cardBgOverlay} />
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
              { useNativeDriver: true }
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
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  cardBgOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)'
  },
  pageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingTop: 40,
    alignItems: 'center',
  },
  bannerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  crest: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.9,
  },
  crestInner: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  character: {
    fontSize: 48,
  },
  levelTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Merienda',
    letterSpacing: -0.8,
    color: '#111827',
  },
  levelName: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  levelDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  xpRingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 10,
    borderColor: 'rgba(0,0,0,0.06)'
  },
  xpRingInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  xpSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  rewardChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  rewardLocked: {
    backgroundColor: 'rgba(0,0,0,0.06)'
  },
  rewardText: {
    fontSize: 16,
  },
  challengesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#111827',
  },
  challengeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  challengeXp: {
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  challengeXpText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
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
});

export default LevelLightbox;


