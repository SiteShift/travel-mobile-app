import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Easing, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import { Icon } from '../../components/Icon';
import { useTrippinLoop } from './hooks/useTrippinLoop';
import { GameState, TrippinConfig } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFIG: TrippinConfig = {
  gravity: 1800,
  flapImpulse: -520,
  speed: 260,
  maxSpeed: 320,
  speedRampPerSec: 4,
  terminalVelocity: 900,
  gapHeight: 240,
  minGapHeight: 200,
  gapShrinkPerSec: 0,
  pipeSpacing: 320,
  pipeWidth: 72,
  birdSize: 72,
  floorPadding: 28,
  spawnOffset: 40,
  stampChance: 0.35,
};

const BEST_KEY = 'trippin_best_score_v1';

export default function TrippinGame({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [best, setBest] = React.useState<number>(0);
  const [phase, setPhase] = React.useState<GameState>('ready');
  const birdScale = React.useRef(new Animated.Value(1)).current;
  const bgMusicRef = React.useRef<Audio.Sound | null>(null);
  const sfxCoinRef = React.useRef<Audio.Sound | null>(null);
  const sfxGameOverRef = React.useRef<Audio.Sound | null>(null);
  const bgScroll = React.useRef(new Animated.Value(0)).current;
  const [isMuted, setIsMuted] = React.useState(false);
  const [isNewBest, setIsNewBest] = React.useState(false);
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.92)).current;
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);

  const { state, start, pause, resume, reset, flap } = useTrippinLoop(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    CONFIG,
    async (finalScore) => {
      // Game over
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('gameover');
      try {
        if (bgMusicRef.current) await bgMusicRef.current.stopAsync();
        if (sfxGameOverRef.current) await sfxGameOverRef.current.replayAsync();
      } catch {}
      const prevBest = await AsyncStorage.getItem(BEST_KEY);
      const prev = prevBest ? Number(prevBest) : 0;
      setIsNewBest(finalScore > prev);
      if (finalScore > prev) {
        await AsyncStorage.setItem(BEST_KEY, String(finalScore));
        setBest(finalScore);
      } else {
        setBest(prev);
      }
    },
    async () => {
      try {
        if (sfxCoinRef.current) await sfxCoinRef.current.replayAsync();
      } catch {}
    }
  );

  React.useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(BEST_KEY);
      setBest(v ? Number(v) : 0);
    })();
  }, []);

  // Load audio and fade-in background music
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [bg, coin, over] = await Promise.all([
          Audio.Sound.createAsync(require('../../../public/assets/Tripmemo-game-background-music (1).mp3'), { isLooping: true, volume: 0 }),
          Audio.Sound.createAsync(require('../../../public/assets/tripmemo-coincollectsound.mp3')),
          Audio.Sound.createAsync(require('../../../public/assets/tripmemo-gameoversound.mp3')),
        ]);
        if (!mounted) {
          await bg.sound.unloadAsync();
          await coin.sound.unloadAsync();
          await over.sound.unloadAsync();
          return;
        }
        bgMusicRef.current = bg.sound;
        sfxCoinRef.current = coin.sound;
        sfxGameOverRef.current = over.sound;
        await bg.sound.playAsync();
        await bg.sound.setIsLoopingAsync(true);
        await bg.sound.setVolumeAsync(0);
        // Fade in over ~800ms
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          await new Promise(r => setTimeout(r, 80));
          if (!mounted) break;
          await bg.sound.setVolumeAsync((i / steps) * 0.4);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
      if (bgMusicRef.current) {
        bgMusicRef.current.unloadAsync();
        bgMusicRef.current = null;
      }
      if (sfxCoinRef.current) {
        sfxCoinRef.current.unloadAsync();
        sfxCoinRef.current = null;
      }
      if (sfxGameOverRef.current) {
        sfxGameOverRef.current.unloadAsync();
        sfxGameOverRef.current = null;
      }
    };
  }, []);

  const startMusic = React.useCallback(async () => {
    try {
      const s = bgMusicRef.current;
      if (!s) return;
      await s.setPositionAsync(0);
      await s.setVolumeAsync(0);
      await s.playAsync();
      await s.setIsLoopingAsync(true);
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        await new Promise(r => setTimeout(r, 70));
        await s.setVolumeAsync((i / steps) * 0.4);
      }
    } catch {}
  }, []);

  const stopMusic = React.useCallback(async () => {
    try {
      if (bgMusicRef.current) {
        await bgMusicRef.current.stopAsync();
      }
    } catch {}
  }, []);

  // SVG background infinite scroll (normal + mirrored)
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(bgScroll, { toValue: 1, duration: 45000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => { loop.stop(); };
  }, [bgScroll]);

  React.useEffect(() => {
    // No auto-countdown; start on first tap for snappier feel
    return () => {};
  }, [phase, start]);

  const onTap = React.useCallback(() => {
    if (phase === 'ready') {
      setPhase('running');
      start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      flap();
    } else if (phase === 'running') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flap();
    } else {
      return;
    }
    // Quick squash & stretch for feedback
    Animated.sequence([
      Animated.timing(birdScale, { toValue: 1.08, duration: 70, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(birdScale, { toValue: 1, duration: 120, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
    ]).start();
  }, [flap, phase]);

  const handlePause = React.useCallback(() => {
    if (phase === 'running') { pause(); setPhase('paused'); }
  }, [pause, phase]);

  const handleResume = React.useCallback(() => {
    if (phase === 'paused') { resume(); setPhase('running'); }
  }, [resume, phase]);

  const handleRestart = React.useCallback(() => {
    reset();
    setPhase('ready');
    // reset animations
    modalOpacity.setValue(0);
    modalScale.setValue(0.92);
  }, [reset]);

  const birdX = Math.round(SCREEN_WIDTH * 0.25);
  const half = CONFIG.birdSize / 2;
  // Bird tilt based on vertical velocity
  const tiltDeg = Math.max(-35, Math.min(50, (state.velocityY / CONFIG.terminalVelocity) * 60));

  // Animate game-over modal when phase flips
  React.useEffect(() => {
    if (phase === 'gameover') {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [modalOpacity, modalScale, phase]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}> 
      <LinearGradient
        colors={[colors.background.secondary, colors.surface.primary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Infinite SVG background (mirrored tiling) */}
      {(() => {
        const SEGMENT_WIDTH = SCREEN_WIDTH; // ensure full-width coverage
        const translateX = bgScroll.interpolate({ inputRange: [0, 1], outputRange: [0, -2 * SEGMENT_WIDTH] });
        return (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: SEGMENT_WIDTH * 4, height: SCREEN_HEIGHT, transform: [{ translateX }], zIndex: 0 }}>
            <Image
              source={require('../../../public/assets/Tripmemo-game-background.svg')}
              style={{ position: 'absolute', left: 0, top: 0, width: SEGMENT_WIDTH, height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey="bg-0"
            />
            <Image
              source={require('../../../public/assets/Tripmemo-game-background.svg')}
              style={{ position: 'absolute', left: SEGMENT_WIDTH, top: 0, width: SEGMENT_WIDTH, height: '100%', transform: [{ scaleX: -1 }] }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey="bg-1"
            />
            <Image
              source={require('../../../public/assets/Tripmemo-game-background.svg')}
              style={{ position: 'absolute', left: 2 * SEGMENT_WIDTH, top: 0, width: SEGMENT_WIDTH, height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey="bg-2"
            />
            <Image
              source={require('../../../public/assets/Tripmemo-game-background.svg')}
              style={{ position: 'absolute', left: 3 * SEGMENT_WIDTH, top: 0, width: SEGMENT_WIDTH, height: '100%', transform: [{ scaleX: -1 }] }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey="bg-3"
            />
          </Animated.View>
        );
      })()}

      {/* Tap area */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel="Game area" />

      {/* Moving layers */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 1 }}>
        {/* Bird */}
        <Animated.View style={{ position: 'absolute', left: birdX - half, top: state.birdY - half, width: CONFIG.birdSize, height: CONFIG.birdSize, transform: [{ scale: birdScale }, { rotateZ: `${tiltDeg}deg` }] }}>
          <Image
            source={require('../../../public/assets/TripMemo-Game-bird (1)_compressed.webp')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey="bird"
          />
        </Animated.View>

        {/* Pipes */}
        {state.pipes.map(p => {
          const gapTop = p.gapY - CONFIG.gapHeight / 2;
          const gapBottom = p.gapY + CONFIG.gapHeight / 2;
          return (
            <React.Fragment key={p.id}>
              {/* Top pipe (3D orange) */}
              <LinearGradient
                colors={[ '#fbbf24', '#f59e0b', '#f97316' ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: 'absolute', left: p.x, top: 0, width: CONFIG.pipeWidth, height: gapTop, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, ...SHADOWS.lg, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }}
                pointerEvents="none"
              />
              {/* Cylindrical highlights/shadows */}
              <View style={{ position: 'absolute', left: p.x + 4, top: 0, width: 6, height: gapTop, backgroundColor: 'rgba(255,255,255,0.25)', borderBottomLeftRadius: 6, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }} pointerEvents="none" />
              <View style={{ position: 'absolute', left: p.x + CONFIG.pipeWidth - 8 - 4, top: 0, width: 8, height: gapTop, backgroundColor: 'rgba(0,0,0,0.18)', borderBottomRightRadius: 6, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }} pointerEvents="none" />
              {/* Top pipe rim */}
              <LinearGradient
                colors={[ '#fde68a', '#fbbf24' ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: 'absolute', left: p.x - 6, top: gapTop - 16, width: CONFIG.pipeWidth + 12, height: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...SHADOWS.md, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }}
                pointerEvents="none"
              />
              {/* Bottom pipe (3D orange) */}
              <LinearGradient
                colors={[ '#fbbf24', '#f59e0b', '#f97316' ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: 'absolute', left: p.x, top: gapBottom, width: CONFIG.pipeWidth, height: SCREEN_HEIGHT - gapBottom, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...SHADOWS.lg, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }}
                pointerEvents="none"
              />
              <View style={{ position: 'absolute', left: p.x + 4, top: gapBottom, width: 6, height: SCREEN_HEIGHT - gapBottom, backgroundColor: 'rgba(255,255,255,0.25)', shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }} pointerEvents="none" />
              <View style={{ position: 'absolute', left: p.x + CONFIG.pipeWidth - 8 - 4, top: gapBottom, width: 8, height: SCREEN_HEIGHT - gapBottom, backgroundColor: 'rgba(0,0,0,0.18)', shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }} pointerEvents="none" />
              {/* Bottom pipe rim */}
              <LinearGradient
                colors={[ '#fde68a', '#fbbf24' ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: 'absolute', left: p.x - 6, top: gapBottom, width: CONFIG.pipeWidth + 12, height: 16, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, ...SHADOWS.md, shouldRasterizeIOS: true, renderToHardwareTextureAndroid: true }}
                pointerEvents="none"
              />
            </React.Fragment>
          );
        })}

        {/* Stamps (coin image) */}
        {state.stamps.map(s => (
          <Image
            key={s.id}
            source={require('../../../public/assets/TripMemo-coin_compressed.webp')}
            style={{ position: 'absolute', left: s.x - 14, top: s.y - 14, width: 28, height: 28, opacity: s.taken ? 0.25 : 1, ...SHADOWS.sm }}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey="coin"
          />
        ))}
      </View>

      {/* HUD */}
      <View style={styles.hudRow}>
        <Pressable onPress={async () => { await stopMusic(); onClose(); }} accessibilityLabel="Close game" style={[styles.hudBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.secondary }]}> 
          <Text style={[styles.hudBtnText, { color: colors.text.primary }]}>×</Text>
        </Pressable>
        <View style={styles.hudScoreWrap}>
          <Text
            style={[
              styles.scoreText,
              {
                color: '#f97316',
                textShadowColor: 'rgba(0,0,0,0.25)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
                fontFamily: 'MagnoliaScript',
              },
            ]}
          >
            {state.score}
          </Text>
          <Text style={[styles.highScoreText, { color: '#FFFFFF' }]}>{`High Score: ${best}`}</Text>
        </View>
        <Pressable onPress={async () => {
          try {
            const s = bgMusicRef.current;
            if (!s) return;
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            await s.setIsMutedAsync(newMuted);
            if (sfxCoinRef.current) await sfxCoinRef.current.setIsMutedAsync(newMuted);
            if (sfxGameOverRef.current) await sfxGameOverRef.current.setIsMutedAsync(newMuted);
          } catch {}
        }} accessibilityLabel="Toggle mute" style={[styles.hudBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.secondary }]}> 
          {isMuted ? (
            <Icon library="Ionicons" name="volume-mute" size={20} color={colors.text.primary} />
          ) : (
            <Icon library="Ionicons" name="volume-high-outline" size={20} color={colors.text.primary} />
          )}
        </Pressable>
      </View>

      {/* Tap to start */}
      {phase === 'ready' && (
        <View style={styles.startOverlay} pointerEvents="none">
          <Text style={styles.startText}>TAP TO START</Text>
        </View>
      )}

      {/* Paused Overlay */}
      {phase === 'paused' && (
        <View style={[styles.overlayCard, { backgroundColor: colors.surface.primary }]}> 
          <Text style={[styles.overlayTitle, { color: colors.text.primary }]}>Paused</Text>
          <View style={styles.overlayActions}>
            <Pressable onPress={handleResume} style={[styles.actionBtn, { backgroundColor: colors.primary[500] }]} accessibilityLabel="Resume game">
              <Text style={[styles.actionText, { color: colors.text.inverse }]}>Resume</Text>
            </Pressable>
            <Pressable onPress={handleRestart} style={[styles.actionBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary, borderWidth: 1 }]} accessibilityLabel="Restart game">
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Restart</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Game Over Overlay (backdrop + centered lightbox) */}
      {phase === 'gameover' && (
        <>
          <View style={styles.backdrop} />
          <View style={[styles.centerOverlay, { zIndex: 26 }] }>
            <Animated.View style={[styles.modalCard, { backgroundColor: colors.surface.primary, opacity: modalOpacity, transform: [{ scale: modalScale }] }]}> 
              <Image
                source={require('../../../public/assets/game-over-text (1)_compressed.webp')}
                style={styles.gameOverImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              {isNewBest && (
                <View style={styles.newBestBadge}>
                  <Text style={styles.newBestText}>NEW HIGH SCORE!</Text>
                </View>
              )}
              <Text style={[styles.scoreHeadline, { color: colors.text.primary }]}>{`Score ${state.score}`}</Text>
              <Text style={[styles.overlaySub, { color: colors.text.secondary }]}>{`Best ${best}`}</Text>
              <View style={styles.overlayActions}>
                <Pressable onPress={async () => { await startMusic(); handleRestart(); }} style={[styles.actionBtnPrimary, { backgroundColor: colors.primary[500] }]} accessibilityLabel="Play again">
                  <Icon library="Ionicons" name="refresh" size={20} color={colors.text.inverse} style={{ marginRight: 8 }} />
                  <Text style={[styles.actionText, { color: colors.text.inverse }]}>Play Again</Text>
                </Pressable>
                <Pressable onPress={async () => { await stopMusic(); onClose(); }} style={[styles.actionBtnGhost, { borderColor: colors.border.primary }]} accessibilityLabel="Close">
                  <Icon library="Ionicons" name="close-outline" size={22} color={colors.text.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionText, { color: colors.text.primary }]}>Close</Text>
                </Pressable>
              </View>
            </Animated.View>
            {/* Leaderboard button beneath lightbox, matching width */}
            <Pressable onPress={() => setShowLeaderboard(true)} accessibilityLabel="Open leaderboard" style={styles.leaderboardButtonWrap}>
              <Image
                source={require('../../../public/assets/leaderboard-button (1)_compressed.webp')}
                style={styles.leaderboardButtonImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </Pressable>
          </View>
        </>
      )}
      {/* Leaderboard modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showLeaderboard}
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalOverlayBackdrop}>
          <View style={[styles.leaderboardCard, { backgroundColor: colors.surface.primary }]}> 
            <View style={styles.leaderboardHeader}> 
              <LinearGradient
                colors={[ '#f59e0b', '#ef4444' ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.leaderboardHeaderGrad}
              />
              <View style={styles.leaderboardHeaderContent}>
                <Icon library="Ionicons" name="trophy" size={22} color="#ffffff" />
                <Text style={styles.leaderboardTitle}>Leaderboard</Text>
              </View>
              <Pressable onPress={() => setShowLeaderboard(false)} style={styles.leaderboardCloseBtn} accessibilityLabel="Close leaderboard">
                <Icon library="Ionicons" name="close" size={18} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
              {(() => {
                const base = [
                  { name: 'Traveler A', score: 42 },
                  { name: 'Explorer B', score: 31 },
                  { name: 'Nomad C', score: 27 },
                  { name: 'Adventurer D', score: 19 },
                  { name: 'Rover E', score: 12 },
                ];
                const withYou = [...base, { name: 'You', score: best }];
                const data = withYou.sort((a, b) => b.score - a.score).slice(0, 10);
                return data.map((row, idx) => {
                  const isYou = row.name === 'You' && row.score === best;
                  return (
                    <View key={`${row.name}-${idx}-${row.score}`} style={[styles.lbRow, { backgroundColor: isYou ? 'rgba(249,115,22,0.08)' : 'transparent', borderColor: isYou ? 'rgba(249,115,22,0.35)' : 'rgba(0,0,0,0.06)' }]}> 
                      <View style={[styles.lbRankBadge, { backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#D97706' : 'rgba(0,0,0,0.08)' }]}>
                        <Text style={styles.lbRankText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.lbName} numberOfLines={1}>{row.name}</Text>
                      <View style={styles.lbScorePill}>
                        <Icon library="Ionicons" name="flame" size={14} color="#ffffff" />
                        <Text style={styles.lbScoreText}>{row.score}</Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>
            <View style={styles.leaderboardFooter}> 
              <Text style={styles.lbFooterText}>Your best: {best}</Text>
              <Pressable onPress={() => setShowLeaderboard(false)} style={styles.lbDoneBtn} accessibilityLabel="Done">
                <Text style={styles.lbDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Top-most touch layer: active only during ready/running so overlays can receive touches */}
      {(phase === 'ready' || phase === 'running') && (
        <Pressable onPressIn={onTap} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10 }} accessibilityLabel="Tap to fly" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hudRow: { position: 'absolute', top: SPACING.xxxl + 16, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 },
  hudBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  hudBtnText: { ...TYPOGRAPHY.styles.h3 },
  hudScoreWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 6 },
  scoreText: { ...TYPOGRAPHY.styles.hero, fontWeight: '800', lineHeight: 56 },
  highScoreText: { ...TYPOGRAPHY.styles.caption, marginTop: -8 },
  startOverlay: { position: 'absolute', left: 0, right: 0, bottom: '12%', alignItems: 'center', zIndex: 25 },
  startText: { ...TYPOGRAPHY.styles.h1, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)', fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  centerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-start', paddingTop: SCREEN_HEIGHT * 0.28 },
  overlayCard: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, top: SCREEN_HEIGHT * 0.28, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', zIndex: 30, ...SHADOWS.lg },
  overlayTitle: { ...TYPOGRAPHY.styles.h2 },
  overlaySub: { ...TYPOGRAPHY.styles.body, marginTop: SPACING.xs },
  overlayActions: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm },
  actionBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  actionText: { ...TYPOGRAPHY.styles.button },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 24 },
  modalCard: { width: '86%', maxWidth: 440, padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl, alignItems: 'center', ...SHADOWS.xl },
  gameOverImage: { width: '82%', height: 140, marginBottom: SPACING.sm },
  scoreHeadline: { ...TYPOGRAPHY.styles.h2, marginTop: 2, letterSpacing: 0.5 },
  actionBtnPrimary: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, flexDirection: 'row', alignItems: 'center' },
  actionBtnGhost: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center' },
  newBestBadge: { marginTop: 6, marginBottom: 2, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)' },
  newBestText: { ...TYPOGRAPHY.styles.caption, color: '#22c55e', fontWeight: '800' },
  leaderboardButtonWrap: { width: '92%', maxWidth: 520, marginTop: SPACING.xxxl * 1.8, marginBottom: SPACING.xxxl },
  leaderboardButtonImage: { width: '100%', height: 76, borderRadius: 16, overflow: 'hidden' },
  modalOverlayBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  leaderboardCard: { width: '92%', maxWidth: 520, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', ...SHADOWS.xl },
  leaderboardHeader: { height: 64, justifyContent: 'center' },
  leaderboardHeaderGrad: { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl },
  leaderboardHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.lg },
  leaderboardTitle: { ...TYPOGRAPHY.styles.h3, color: '#FFFFFF', fontWeight: '800', marginLeft: 6 },
  leaderboardCloseBtn: { position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  lbRankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  lbRankText: { ...TYPOGRAPHY.styles.caption, color: '#111827', fontWeight: '800' },
  lbName: { ...TYPOGRAPHY.styles.body, flex: 1, color: '#111827', fontWeight: '600' },
  lbScorePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  lbScoreText: { ...TYPOGRAPHY.styles.caption, color: '#FFFFFF', fontWeight: '800' },
  leaderboardFooter: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.02)' },
  lbFooterText: { ...TYPOGRAPHY.styles.bodySmall, color: '#111827' },
  lbDoneBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: '#f97316', borderRadius: 999 },
  lbDoneText: { ...TYPOGRAPHY.styles.buttonSmall, color: '#FFFFFF', fontWeight: '800' },
});


