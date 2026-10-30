// World is a fixed 600x1000 logical space, scaled to fit the screen.
export const W = 600, H = 1000;
export const WALL_L = 24, WALL_R = 576, FLOOR = 948, JAR_TOP = 200, DANGER = 222;

// Simulation
export const G = 1500;            // gravity, px/s²
export const DT = 1 / 60;         // fixed step
export const SUB = 8;             // physics substeps per step
export const DAMP = 0.9995;       // velocity damping per substep

// Soft body: weak shape memory + kept volume, so blobs flow into gaps like cells
export const K_SHAPE = 0.0015, K_EDGE = 0.3, K_SMOOTH = 0.025, K_AREA = 0.9;

// Gameplay
export const MAX_LEVEL = 10;                      // level 10 = 2048
// Tray: a narrow channel above the jar where the next blobs wait, squashed in a row.
// New blobs enter on the left and are pulled to the middle, so they are easy to aim from.
export const TRAY_L = 40, TRAY_R = 560, TRAY_TOP = 140, TRAY_BOT = 184;
export const TRAY_SIZE = 3;                       // max blobs waiting
export const TRAY_PUSH = 900;                     // pull toward the tray centre, px/s²
export const TRAY_SPAWN_DELAY = 0.35;
// Launching: drag from a tray blob toward where it should go.
export const MAX_PULL = 170, PULL_SPEED = 10.5;   // drag distance -> launch speed
export const TAP_POWER = 0.04;                    // below this a release is a gentle drop
export const COMBO_WINDOW = 1.0;
export const DANGER_TIME = 3;
// Relative chance of spawning 2, 4, 8, 16, 32, 64. 64 only appears once a 256 exists:
// a wider mix means fewer matching pairs, while keeping spawns small so value isn't handed out.
export const SPAWN_WEIGHTS = [30, 28, 22, 14, 8, 5];

// Sizes are tuned so a near-complete chain (2 … 2048) almost fills the jar.
export const radiusOf = level => 28 * Math.pow(1.21, level);
export const valueOf = level => 2 ** (level + 1);

/** Highest level that can spawn, given the biggest number made so far. */
export const maxSpawnLevel = maxLevel => (maxLevel >= 7 ? 5 : 4);

export function randomSpawnLevel(maxLevel = 0) {
  const w = SPAWN_WEIGHTS.slice(0, maxSpawnLevel(maxLevel) + 1);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let l = 0; l < w.length; l++) { r -= w[l]; if (r < 0) return l; }
  return 0;
}
