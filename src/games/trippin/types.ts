export type GameState = 'ready' | 'running' | 'paused' | 'gameover';

export type Pipe = {
  id: string;
  x: number;
  gapY: number;
  scored?: boolean;
};

export type Stamp = {
  id: string;
  x: number;
  y: number;
  taken: boolean;
};

export type TrippinConfig = {
  gravity: number; // px/s^2
  flapImpulse: number; // px/s (negative is up)
  speed: number; // px/s
  maxSpeed: number; // px/s (horizontal)
  speedRampPerSec: number; // px/s^2
  terminalVelocity: number; // px/s
  gapHeight: number; // px
  minGapHeight: number; // px
  gapShrinkPerSec: number; // px/s
  pipeSpacing: number; // px between pipe centers
  pipeWidth: number; // px
  birdSize: number; // px square
  floorPadding: number; // px from bottom considered ground
  spawnOffset: number; // px beyond screen width to spawn new pipes
  stampChance: number; // 0..1 chance per pipe
};

export type HighScore = { score: number; at: number; name?: string };


