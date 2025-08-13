import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
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
  const bgAnim = React.useRef(new Animated.Value(0)).current;
  const birdScale = React.useRef(new Animated.Value(1)).current;
  const bgMusicRef = React.useRef<Audio.Sound | null>(null);
  const sfxCoinRef = React.useRef<Audio.Sound | null>(null);
  const sfxGameOverRef = React.useRef<Audio.Sound | null>(null);

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

  // Background slow pan (left -> right -> left)
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { loop.stop(); };
  }, [bgAnim]);

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
  }, [reset]);

  const birdX = Math.round(SCREEN_WIDTH * 0.25);
  const half = CONFIG.birdSize / 2;
  // Bird tilt based on vertical velocity
  const tiltDeg = Math.max(-35, Math.min(50, (state.velocityY / CONFIG.terminalVelocity) * 60));

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}> 
      <LinearGradient
        colors={[colors.background.secondary, colors.surface.primary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Simple, clean gradient background only */}

      {/* Tap area */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel="Game area" />

      {/* Bird */}
      <Animated.View style={{ position: 'absolute', left: birdX - half, top: state.birdY - half, width: CONFIG.birdSize, height: CONFIG.birdSize, transform: [{ scale: birdScale }, { rotateZ: `${tiltDeg}deg` }] }}>
        <Image
          source={require('../../../public/assets/TripMemo-Game-bird (1)_compressed.webp')}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
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
              style={{ position: 'absolute', left: p.x, top: 0, width: CONFIG.pipeWidth, height: gapTop, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, ...SHADOWS.lg }}
            />
            {/* Cylindrical highlights/shadows */}
            <View style={{ position: 'absolute', left: p.x + 4, top: 0, width: 6, height: gapTop, backgroundColor: 'rgba(255,255,255,0.25)', borderBottomLeftRadius: 6 }} />
            <View style={{ position: 'absolute', left: p.x + CONFIG.pipeWidth - 8 - 4, top: 0, width: 8, height: gapTop, backgroundColor: 'rgba(0,0,0,0.18)', borderBottomRightRadius: 6 }} />
            {/* Top pipe rim */}
            <LinearGradient
              colors={[ '#fde68a', '#fbbf24' ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', left: p.x - 6, top: gapTop - 16, width: CONFIG.pipeWidth + 12, height: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...SHADOWS.md }}
            />
            {/* Bottom pipe (3D orange) */}
            <LinearGradient
              colors={[ '#fbbf24', '#f59e0b', '#f97316' ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', left: p.x, top: gapBottom, width: CONFIG.pipeWidth, height: SCREEN_HEIGHT - gapBottom, borderTopLeftRadius: 8, borderTopRightRadius: 8, ...SHADOWS.lg }}
            />
            <View style={{ position: 'absolute', left: p.x + 4, top: gapBottom, width: 6, height: SCREEN_HEIGHT - gapBottom, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View style={{ position: 'absolute', left: p.x + CONFIG.pipeWidth - 8 - 4, top: gapBottom, width: 8, height: SCREEN_HEIGHT - gapBottom, backgroundColor: 'rgba(0,0,0,0.18)' }} />
            {/* Bottom pipe rim */}
            <LinearGradient
              colors={[ '#fde68a', '#fbbf24' ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', left: p.x - 6, top: gapBottom, width: CONFIG.pipeWidth + 12, height: 16, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, ...SHADOWS.md }}
            />
          </React.Fragment>
        );
      })}

      {/* Stamps */}
      {state.stamps.map(s => (
        <View key={s.id} style={{ position: 'absolute', left: s.x - 12, top: s.y - 12, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent[500], opacity: s.taken ? 0.2 : 1, ...SHADOWS.sm }} />
      ))}

      {/* HUD */}
      <View style={styles.hudRow}>
        <Pressable onPress={async () => { await stopMusic(); onClose(); }} accessibilityLabel="Close game" style={[styles.hudBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.secondary }]}> 
          <Text style={[styles.hudBtnText, { color: colors.text.primary }]}>×</Text>
        </Pressable>
        <View style={styles.hudScoreWrap}>
          <Text style={[styles.scoreText, { color: colors.text.primary }]}>{state.score}</Text>
        </View>
        {phase === 'running' ? (
          <Pressable onPress={handlePause} accessibilityLabel="Pause" style={[styles.hudBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.secondary }]}>
            <Text style={[styles.hudBtnText, { color: colors.text.primary }]}>II</Text>
          </Pressable>
        ) : (
          <View style={[styles.hudBtn, { opacity: 0 }]}/>
        )}
      </View>

      {/* Tap to start */}
      {phase === 'ready' && (
        <View style={styles.centerOverlay}>
          <Text style={[styles.overlayTitle, { color: colors.text.primary }]}>Tap to start</Text>
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

      {/* Game Over Overlay */}
      {phase === 'gameover' && (
        <View style={[styles.overlayCard, { backgroundColor: colors.surface.primary }]}> 
          <Text style={[styles.overlayTitle, { color: colors.text.primary }]}>Game Over</Text>
          <Text style={[styles.overlaySub, { color: colors.text.secondary }]}>Score {state.score} • Best {best}</Text>
          <View style={styles.overlayActions}>
            <Pressable onPress={async () => { await startMusic(); handleRestart(); }} style={[styles.actionBtn, { backgroundColor: colors.primary[500] }]} accessibilityLabel="Play again">
              <Text style={[styles.actionText, { color: colors.text.inverse }]}>Play Again</Text>
            </Pressable>
            <Pressable onPress={async () => { await stopMusic(); onClose(); }} style={[styles.actionBtn, { backgroundColor: colors.surface.secondary, borderColor: colors.border.primary, borderWidth: 1 }]} accessibilityLabel="Close">
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* Top-most touch layer: active only during ready/running so overlays can receive touches */}
      {(phase === 'ready' || phase === 'running') && (
        <Pressable onPressIn={onTap} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10 }} accessibilityLabel="Tap to fly" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hudRow: { position: 'absolute', top: SPACING.xxxl, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 },
  hudBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  hudBtnText: { ...TYPOGRAPHY.styles.h3 },
  hudScoreWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(0,0,0,0.1)' },
  scoreText: { ...TYPOGRAPHY.styles.h2, fontWeight: '800' },
  centerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlayCard: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, top: SCREEN_HEIGHT * 0.28, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', zIndex: 30, ...SHADOWS.lg },
  overlayTitle: { ...TYPOGRAPHY.styles.h2 },
  overlaySub: { ...TYPOGRAPHY.styles.body, marginTop: SPACING.xs },
  overlayActions: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm },
  actionBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  actionText: { ...TYPOGRAPHY.styles.button },
});


