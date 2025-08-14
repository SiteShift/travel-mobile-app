import * as React from 'react';
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
  worldX: number; // horizontal world offset in px
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
    worldX: 0,
  }));

  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef<number | null>(null);
  const speedRef = React.useRef<number>(config.speed);
  const gapRef = React.useRef<number>(config.gapHeight);
  const worldXRef = React.useRef<number>(0);
  const pipesRef = React.useRef<Pipe[]>([]);
  const stampsRef = React.useRef<Stamp[]>([]);

  // Constants derived from static inputs to avoid recomputation every frame
  const BIRD_X = React.useMemo(() => Math.round(screenWidth * 0.25), [screenWidth]);
  const HALF_SIZE = React.useMemo(() => config.birdSize / 2, [config.birdSize]);

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
    pipesRef.current = items;
    stampsRef.current = stamps;
    worldXRef.current = 0;
    setState(s => ({ ...s, pipes: items.slice(), stamps: stamps.slice(), worldX: 0 }));
  }, [config.pipeSpacing, config.spawnOffset, config.pipeWidth, config.stampChance, screenHeight, screenWidth]);

  const start = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current as number);
    lastTsRef.current = null;
    speedRef.current = config.speed;
    gapRef.current = config.gapHeight;
    worldXRef.current = 0;
    pipesRef.current = [];
    stampsRef.current = [];
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
      worldX: 0,
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
    worldXRef.current = 0;
    pipesRef.current = [];
    stampsRef.current = [];
    setState({
      state: 'ready',
      birdY: Math.round(screenHeight * 0.5),
      velocityY: 0,
      pipes: [],
      stamps: [],
      score: 0,
      streak: 0,
      elapsed: 0,
      worldX: 0,
    });
  }, [config.gapHeight, config.speed, screenHeight]);

  const flap = React.useCallback(() => {
    if (state.state !== 'running') return;
    setState(s => ({ ...s, velocityY: -Math.abs(config.flapImpulse) }));
  }, [config.flapImpulse, state.state]);

  const endGame = React.useCallback((finalScore: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      onGameOver?.(finalScore, false);
    } catch {}
  }, [onGameOver]);

  const tick = React.useCallback((dt: number) => {
    setState(prev => {
      if (prev.state !== 'running') return prev;

      // Ramp difficulty
      speedRef.current = clamp(speedRef.current + config.speedRampPerSec * dt, config.speed, config.maxSpeed);
      if (config.gapShrinkPerSec !== 0) {
        gapRef.current = clamp(
          gapRef.current - config.gapShrinkPerSec * dt,
          config.minGapHeight,
          config.gapHeight
        );
      }

      // Physics
      let velocityY = clamp(prev.velocityY + config.gravity * dt, -config.terminalVelocity, config.terminalVelocity);
      let birdY = clamp(prev.birdY + velocityY * dt, 0, screenHeight - config.floorPadding);

      // Advance world offset
      const currentSpeed = speedRef.current;
      worldXRef.current += currentSpeed * dt;

      // Spawn new pipes when last spawn is close to entering screen
      const pipesArr = pipesRef.current;
      const stampsArr = stampsRef.current;
      let pipesDirty = false;
      let stampsDirty = false;

      const lastPipe = pipesArr[pipesArr.length - 1];
      const needSpawn = !lastPipe || (lastPipe.x - worldXRef.current) < screenWidth;
      if (needSpawn) {
        const lastSpawnX = lastPipe ? lastPipe.x : screenWidth + config.spawnOffset;
        const x = Math.max(lastSpawnX + config.pipeSpacing, screenWidth + config.spawnOffset);
        const gapY = Math.round(screenHeight * 0.3 + Math.random() * (screenHeight * 0.4));
        const np: Pipe = { id: `p_${Date.now()}`, x, gapY };
        pipesArr.push(np);
        pipesDirty = true;
        if (Math.random() < config.stampChance) {
          // Place stamp centered horizontally in the gap between stumps
          stampsArr.push({ id: `s_${Date.now()}`, x: x + Math.floor(config.pipeWidth / 2), y: gapY, taken: false });
          stampsDirty = true;
        }
      }

      // Remove off-screen pipes/stamps from the front
      while (pipesArr.length && (pipesArr[0].x - worldXRef.current + config.pipeWidth) <= -40) {
        pipesArr.shift();
        pipesDirty = true;
      }
      while (stampsArr.length && (stampsArr[0].x - worldXRef.current) <= -40) {
        stampsArr.shift();
        stampsDirty = true;
      }

      // Collision + scoring
      let score = prev.score;
      let streak = prev.streak;
      const birdTop = birdY - HALF_SIZE;
      const birdBottom = birdY + HALF_SIZE;

      let collided = false;
      for (let i = 0; i < pipesArr.length; i++) {
        const p = pipesArr[i];
        const pipeLeft = p.x - worldXRef.current;
        const pipeRight = pipeLeft + config.pipeWidth;
        const gapTop = p.gapY - gapRef.current / 2;
        const gapBottom = p.gapY + gapRef.current / 2;
        const withinX = BIRD_X + HALF_SIZE > pipeLeft && BIRD_X - HALF_SIZE < pipeRight;
        if (withinX) {
          if (birdTop < gapTop || birdBottom > gapBottom) {
            collided = true;
          }
        }
        // Scoring when we pass the pipe center
        if (!p.scored && pipeRight < BIRD_X - HALF_SIZE) {
          score += 1;
          const centerDist = Math.abs(birdY - p.gapY);
          if (centerDist < 12) streak += 1; else streak = 0;
          p.scored = true; // mutate ref only; render not dependent
        }
      }

      // Stamp pickups
      let didCollect = false;
      for (let i = 0; i < stampsArr.length; i++) {
        const s = stampsArr[i];
        if (s.taken) continue;
        const dx = Math.abs((s.x - worldXRef.current) - BIRD_X);
        const dy = Math.abs(s.y - birdY);
        if (dx < 18 && dy < 18) {
          score += 3;
          didCollect = true;
          s.taken = true;
          stampsDirty = true;
        }
      }

      if (collided) {
        endGame(score);
        return { ...prev, state: 'gameover', score };
      }

      const elapsed = prev.elapsed + dt;
      const nextState: LoopState = {
        state: 'running',
        birdY,
        velocityY,
        pipes: pipesDirty ? pipesArr.slice() : prev.pipes,
        stamps: stampsDirty ? stampsArr.slice() : prev.stamps,
        score,
        streak,
        elapsed,
        worldX: worldXRef.current,
      };
      if (didCollect) setTimeout(() => onStampCollected?.(), 0);
      return nextState;
    });
  }, [config.birdSize, config.floorPadding, config.gapHeight, config.gapShrinkPerSec, config.gravity, config.maxSpeed, config.pipeSpacing, config.pipeWidth, config.speed, config.speedRampPerSec, config.stampChance, config.terminalVelocity, endGame, onStampCollected, screenHeight, screenWidth]);

  // Expose tick for tests
  const tickOnce = React.useCallback((dt: number) => tick(dt), [tick]);

  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { state, start, pause, resume, reset, flap, tickOnce };
}


