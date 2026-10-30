// World is a fixed 600x1000 logical space, scaled to fit the screen.
export const W = 600, H = 1000;
export const WALL_L = 24, WALL_R = 576, FLOOR = 948, JAR_TOP = 200, DANGER = 222;
export const LAUNCH_X = 300, LAUNCH_Y = 118;

// Simulation
export const G = 1500;            // gravity, px/s²
export const DT = 1 / 60;         // fixed step
export const SUB = 8;             // physics substeps per step
export const DAMP = 0.9995;       // velocity damping per substep

// Soft body: weak shape memory + kept volume, so blobs flow into gaps like cells
export const K_SHAPE = 0.0015, K_EDGE = 0.3, K_SMOOTH = 0.025, K_AREA = 0.9;

// Gameplay
export const MAX_LEVEL = 10;                      // level 10 = 2048
export const MAX_PULL = 170, PULL_SPEED = 10.5;   // drag distance -> launch speed
export const TAP_POWER = 0.04;                    // below this a drag is a gentle drop
export const LAUNCH_COOLDOWN = 0.45;
export const COMBO_WINDOW = 1.0;
export const DANGER_TIME = 3;
export const SPAWN_WEIGHTS = [30, 28, 22, 14, 6];  // chance of spawning 2, 4, 8, 16, 32

export const radiusOf = level => 23 * Math.pow(1.19, level);
export const valueOf = level => 2 ** (level + 1);

export function randomSpawnLevel() {
  let r = Math.random() * SPAWN_WEIGHTS.reduce((a, b) => a + b, 0);
  for (let l = 0; l < SPAWN_WEIGHTS.length; l++) { r -= SPAWN_WEIGHTS[l]; if (r < 0) return l; }
  return 0;
}
