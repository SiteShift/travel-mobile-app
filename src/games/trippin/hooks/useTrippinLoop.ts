import * as React from 'react';
import { Easing } from 'react-native';
import { Pipe, Stamp, TrippinConfig, GameState } from '../types';

export type LoopState = {
  state: GameState;
  birdY: number;
  velocityY: number;
  pipes: Pipe[];
  stamps: Stamp[];
  score: number;
  streak: number;
  elapsed: number; // seconds
};

export type LoopApi = {
  state: LoopState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  flap: () => void;
  tickOnce: (dt: number) => void; // for tests
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function useTrippinLoop(
  screenWidth: number,
  screenHeight: number,
  config: TrippinConfig,
  onGameOver?: (finalScore: number, isNewBest: boolean) => void,
  onStampCollected?: () => void,
): LoopApi {
  const [state, setState] = React.useState<LoopState>(() => ({
    state: 'ready',
    birdY: Math.round(screenHeight * 0.5),
    velocityY: 0,
    pipes: [],
    stamps: [],
    score: 0,
    streak: 0,
    elapsed: 0,
  }));

  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef<number | null>(null);
  const speedRef = React.useRef<number>(config.speed);
  const gapRef = React.useRef<number>(config.gapHeight);

  const spawnInitial = React.useCallback(() => {
    const startX = screenWidth + config.spawnOffset;
    const items: Pipe[] = [];
    const stamps: Stamp[] = [];
    for (let i = 0; i < 4; i++) {
      const x = startX + i * config.pipeSpacing;
      const gapY = Math.round(screenHeight * 0.35 + Math.sin(i * 1.3) * 80);
      const id = `p_${Date.now()}_${i}`;
      items.push({ id, x, gapY });
      if (Math.random() < config.stampChance) {
        stamps.push({ id: `s_${id}`, x: x + config.pipeWidth + 24, y: gapY, taken: false });
      }
    }
    setState(s => ({ ...s, pipes: items, stamps }));
  }, [config.pipeSpacing, config.spawnOffset, config.pipeWidth, config.stampChance, screenHeight, screenWidth]);

  const start = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current as number);
    lastTsRef.current = null;
    speedRef.current = config.speed;
    gapRef.current = config.gapHeight;
    setState(s => ({
      ...s,
      state: 'running',
      birdY: Math.round(screenHeight * 0.5),
      velocityY: 0,
      score: 0,
      streak: 0,
      elapsed: 0,
      pipes: [],
      stamps: [],
    }));
    spawnInitial();
    const loop = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - (lastTsRef.current as number)) / 1000;
      lastTsRef.current = ts;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [config.gapHeight, config.speed, screenHeight, spawnInitial]);

  const pause = React.useCallback(() => {
    if (state.state !== 'running') return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setState(s => ({ ...s, state: 'paused' }));
  }, [state.state]);

  const resume = React.useCallback(() => {
    if (state.state !== 'paused') return;
    setState(s => ({ ...s, state: 'running' }));
    const loop = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - (lastTsRef.current as number)) / 1000;
      lastTsRef.current = ts;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [state.state]);

  const reset = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    speedRef.current = config.speed;
    gapRef.current = config.gapHeight;
    setState({
      state: 'ready',
      birdY: Math.round(screenHeight * 0.5),
      velocityY: 0,
      pipes: [],
      stamps: [],
      score: 0,
      streak: 0,
      elapsed: 0,
    });
  }, [config.gapHeight, config.speed, screenHeight]);

  const flap = React.useCallback(() => {
    if (state.state !== 'running') return;
    setState(s => ({ ...s, velocityY: -Math.abs(config.flapImpulse) }));
  }, [config.flapImpulse, state.state]);

  const endGame = React.useCallback((finalScore: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setState(s => ({ ...s, state: 'gameover' }));
    onGameOver?.(finalScore, false);
  }, [onGameOver]);

  const tick = React.useCallback((dt: number) => {
    setState(prev => {
      if (prev.state !== 'running') return prev;

      // Ramp difficulty
      speedRef.current = clamp(speedRef.current + config.speedRampPerSec * dt, config.speed, config.maxSpeed);
      gapRef.current = clamp(gapRef.current - config.gapShrinkPerSec * dt, config.minGapHeight, config.gapHeight);

      // Physics
      let velocityY = clamp(prev.velocityY + config.gravity * dt, -config.terminalVelocity, config.terminalVelocity);
      let birdY = clamp(prev.birdY + velocityY * dt, 0, screenHeight - config.floorPadding);

      // Move pipes and stamps
      const pipes = prev.pipes.map(p => ({ ...p, x: p.x - speedRef.current * dt }));
      const stamps = prev.stamps.map(s => ({ ...s, x: s.x - speedRef.current * dt }));

      // Despawn off-screen
      const alivePipes = pipes.filter(p => p.x + config.pipeWidth > -40);
      const aliveStamps = stamps.filter(s => s.x > -40);

      // Spawn new pipes when last is far enough left
      const needSpawn = alivePipes.length === 0 || (alivePipes[alivePipes.length - 1].x < screenWidth);
      if (needSpawn) {
        const lastX = alivePipes.length ? alivePipes[alivePipes.length - 1].x : screenWidth + config.spawnOffset;
        const x = Math.max(lastX + config.pipeSpacing, screenWidth + config.spawnOffset);
        const gapY = Math.round(screenHeight * 0.3 + Math.random() * (screenHeight * 0.4));
        alivePipes.push({ id: `p_${Date.now()}`, x, gapY });
        if (Math.random() < config.stampChance) {
          aliveStamps.push({ id: `s_${Date.now()}`, x: x + config.pipeWidth + 24, y: gapY, taken: false });
        }
      }

      // Collision + scoring
      let score = prev.score;
      let streak = prev.streak;
      const birdX = Math.round(screenWidth * 0.25);
      const half = config.birdSize / 2;
      const birdTop = birdY - half;
      const birdBottom = birdY + half;

      let collided = false;
      const newPipes = alivePipes.map(p => {
        const pipeLeft = p.x;
        const pipeRight = p.x + config.pipeWidth;
        const gapTop = p.gapY - gapRef.current / 2;
        const gapBottom = p.gapY + gapRef.current / 2;
        const withinX = birdX + half > pipeLeft && birdX - half < pipeRight;
        if (withinX) {
          if (birdTop < gapTop || birdBottom > gapBottom) {
            collided = true;
          }
        }
        // Scoring when we pass the pipe center
        if (!p.scored && pipeRight < birdX - half) {
          score += 1;
          const centerDist = Math.abs(birdY - p.gapY);
          if (centerDist < 12) streak += 1; else streak = 0;
          return { ...p, scored: true };
        }
        return p;
      });

      // Stamp pickups
      let didCollect = false;
      const newStamps = aliveStamps.map(s => {
        if (s.taken) return s;
        const dx = Math.abs(s.x - birdX);
        const dy = Math.abs(s.y - birdY);
        if (dx < 18 && dy < 18) {
          score += 3;
          didCollect = true;
          return { ...s, taken: true };
        }
        return s;
      });

      if (collided) {
        // Hard stop
        endGame(score);
        return { ...prev, state: 'gameover', score };
      }

      const elapsed = prev.elapsed + dt;
      const nextState = {
        state: 'running',
        birdY,
        velocityY,
        pipes: newPipes,
        stamps: newStamps,
        score,
        streak,
        elapsed,
      };
      // Fire outside effects after we compute state
      if (didCollect) {
        // Call after state update microtask
        setTimeout(() => onStampCollected?.(), 0);
      }
      return nextState;
    });
  }, [config.birdSize, config.floorPadding, config.gapHeight, config.gapShrinkPerSec, config.gravity, config.maxSpeed, config.pipeSpacing, config.pipeWidth, config.speed, config.speedRampPerSec, config.stampChance, config.terminalVelocity, endGame, onStampCollected, screenHeight, screenWidth]);

  // Expose tick for tests
  const tickOnce = React.useCallback((dt: number) => tick(dt), [tick]);

  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { state, start, pause, resume, reset, flap, tickOnce };
}


