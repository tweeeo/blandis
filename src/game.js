// Game rules and state machine. Knows nothing about the DOM or canvas.
import {
  WALL_L, WALL_R, DANGER, LAUNCH_X, LAUNCH_Y, SUB, MAX_LEVEL, MAX_PULL, PULL_SPEED, TAP_POWER,
  LAUNCH_COOLDOWN, COMBO_WINDOW, DANGER_TIME, radiusOf, valueOf, randomSpawnLevel,
} from './config.js';
import { Blob } from './physics/blob.js';
import { World } from './physics/world.js';
import { Effects } from './effects.js';
import { save, persist } from './storage.js';
import { theme, hsl } from './themes.js';
import { t } from './i18n.js';
import { sfx, buzz } from './audio.js';
import { unlock } from './achievements.js';

/** States: attract (menu backdrop) | play | paused | ending (popping animation) | over */
export class Game {
  constructor() {
    this.world = new World();
    this.fx = new Effects();
    this.state = 'attract';
    this.clock = 0;
    this.onOver = () => {};
    this.reset();
  }

  reset() {
    this.world.clear(); this.fx.clear();
    this.score = 0; this.combo = 0; this.lastMerge = -9; this.maxLevel = 0;
    this.dangerT = 0; this.cooldown = 0; this.gentleRun = 0; this.endTimer = 0;
    this.isNewBest = false; this.aim = null;
    this.nextLevel = randomSpawnLevel();
    this.newHand();
  }

  start() { this.reset(); this.state = 'play'; }

  /** A pile of blobs falling behind the main menu. */
  attract() {
    this.reset(); this.hand = null; this.state = 'attract';
    for (let i = 0; i < 14; i++) {
      const l = Math.floor(Math.random() * 5), r = radiusOf(l);
      const b = new Blob(l, WALL_L + r + Math.random() * (WALL_R - WALL_L - 2 * r), 300 + i * 40);
      b.fresh = false; this.world.add(b);
    }
  }

  pause() { if (this.state === 'play') { this.state = 'paused'; this.aim = null; } }
  resume() { if (this.state === 'paused') this.state = 'play'; }
  get running() { return this.state !== 'paused' && this.state !== 'over'; }

  newHand() { this.hand = { level: this.nextLevel, scale: 0.2, scaleV: 0 }; this.nextLevel = randomSpawnLevel(); }

  // ---- Aiming: drag toward where the blob should go ----
  get canAim() { return this.state === 'play' && !!this.hand; }
  beginAim(p, id) { if (this.canAim && !this.aim) this.aim = { x0: p.x, y0: p.y, x: p.x, y: p.y, id }; }
  moveAim(p, id) { if (this.aim && this.aim.id === id) { this.aim.x = p.x; this.aim.y = p.y; } }
  cancelAim() { this.aim = null; }
  releaseAim(p, id) {
    if (!this.aim || this.aim.id !== id) return;
    this.moveAim(p, id);
    if (this.canAim) this.launch();
    this.aim = null;
  }

  /** Drag vector clamped to MAX_PULL (world units). */
  aimPull() {
    if (!this.aim) return { x: 0, y: 0 };
    let x = this.aim.x - this.aim.x0, y = this.aim.y - this.aim.y0;
    const d = Math.hypot(x, y);
    if (d > MAX_PULL) { x *= MAX_PULL / d; y *= MAX_PULL / d; }
    return { x, y };
  }
  aimPower() { const p = this.aimPull(); return Math.hypot(p.x, p.y) / MAX_PULL; }
  handPos() { return { x: LAUNCH_X, y: LAUNCH_Y }; }

  launch() {
    const pull = this.aimPull(), power = this.aimPower(), pos = this.handPos();
    const b = this.world.add(new Blob(this.hand.level, pos.x, pos.y));
    if (power >= TAP_POWER) b.setVelocity(pull.x * PULL_SPEED, pull.y * PULL_SPEED);
    b.power = power;
    sfx.launch(power); buzz(8);
    this.gentleRun = power < 0.25 ? this.gentleRun + 1 : 0;
    if (this.gentleRun >= 10) unlock('gentle');
    this.hand = null; this.cooldown = LAUNCH_COOLDOWN;
  }

  merge(a, b) {
    a.dead = b.dead = true;
    const m = a.mass + b.mass;
    const cx = (a.cx * a.mass + b.cx * b.mass) / m, cy = (a.cy * a.mass + b.cy * b.mass) / m;
    const vx = (a.vcx * a.mass + b.vcx * b.mass) / m, vy = (a.vcy * a.mass + b.vcy * b.mass) / m;
    const L = a.level + 1, playing = this.state === 'play', fx = this.fx;
    this.combo = this.clock - this.lastMerge < COMBO_WINDOW ? this.combo + 1 : 1;
    this.lastMerge = this.clock;

    const col = theme.col(Math.min(L, MAX_LEVEL), this.clock);
    fx.burst(cx, cy, hsl(col), 10 + L * 3, 260 + L * 25, 4 + L * 0.6);
    fx.burst(cx, cy, hsl(theme.col(a.level, this.clock), 10), 6, 200, 4);
    fx.ring(cx, cy, radiusOf(Math.min(L, MAX_LEVEL)), hsl(col));
    fx.addShake(2 + L * 0.8);

    if (playing) {
      const pts = valueOf(L) * this.combo;
      this.score += pts;
      fx.text(cx, cy - 10, '+' + pts, 26 + L * 2);
      if (this.combo > 1) fx.text(cx, cy - 44, 'x' + this.combo + '!', 34 + this.combo * 3, true);
      unlock('first');
      if (this.combo >= 4) unlock('combo4');
      if (this.score >= 1000) unlock('s1000');
      if ([a, b].some(o => o.power > 0.95 && o.age < 3)) unlock('cannon');
    }
    sfx.merge(L, this.combo); buzz(12 + L * 3);

    let R = radiusOf(Math.min(L, MAX_LEVEL));
    if (a.level === MAX_LEVEL) {
      // Two 2048s vanish in a shower
      if (playing) { this.score += 8192; fx.text(cx, cy, t('supreme'), 44, true, 1.6); }
      fx.burst(cx, cy, '#fff', 60, 700, 7); fx.addShake(24, 24); sfx.boom(); buzz([30, 40, 60]);
      R *= 2;
    } else {
      const nb = this.world.add(new Blob(L, Math.max(WALL_L + R * 0.6, Math.min(WALL_R - R * 0.6, cx)), cy, 0.62));
      nb.setVelocity(vx * 0.5, vy * 0.5); nb.happy = 1.3; nb.fresh = false; nb.age = 0.4;
      if (playing && L > this.maxLevel) {
        this.maxLevel = L;
        if (L >= 6) unlock('lvl7');
        if (L === MAX_LEVEL) unlock('max');
      }
    }

    // Shove neighbours outward: the satisfying "squish wave"
    for (const o of this.world.blobs) {
      if (o.dead || o.happy > 1.2) continue;
      const dx = o.cx - cx, dy = o.cy - cy, d = Math.hypot(dx, dy) || 1, reach = R * 2.4;
      if (d > reach) continue;
      const f = (1 - d / reach) * (180 + L * 15);
      for (let i = 0; i < o.n; i++) { o.vx[i] += dx / d * f; o.vy[i] += dy / d * f; }
    }
  }

  tick(dt) {
    this.clock += dt;
    const world = this.world, h = dt / SUB;
    for (let s = 0; s < SUB; s++) world.step(h);

    for (const b of world.blobs) {
      b.update(dt);
      if (b.fresh && b.hit) { b.fresh = false; sfx.plop(Math.hypot(b.vcx, b.vcy)); }
      b.hit = false;
    }
    if (world.contacts.length) {
      for (const [a, b] of world.contacts) if (!a.dead && !b.dead) this.merge(a, b);
      world.contacts.length = 0;
      world.removeDead();
    }

    const hand = this.hand;
    if (hand) { hand.scaleV += ((1 - hand.scale) * 300 - hand.scaleV * 10) * dt; hand.scale += hand.scaleV * dt; }

    if (this.state === 'play') {
      if (!hand) { this.cooldown -= dt; if (this.cooldown <= 0) this.newHand(); }
      const over = world.blobs.some(b => b.age > 1.2 && b.minY < DANGER && Math.hypot(b.vcx, b.vcy) < 260);
      this.dangerT = over ? this.dangerT + dt : Math.max(0, this.dangerT - dt * 2);
      if (this.dangerT > DANGER_TIME) this.gameOver();
    } else if (this.state === 'ending') {
      this.tickEnding(dt);
    }
  }

  gameOver() {
    this.state = 'ending'; this.endTimer = 0.6; this.aim = null; this.hand = null; this.dangerT = 0;
    sfx.over(); buzz([40, 60, 40]);
    this.isNewBest = this.score > save.best;
    if (this.isNewBest) save.best = this.score;
    save.top = [...save.top, this.score].sort((a, b) => b - a).slice(0, 5);
    persist();
  }

  // Pop the remaining blobs one by one, top first, then show the results.
  tickEnding(dt) {
    this.endTimer -= dt;
    if (this.endTimer > 0) return;
    const blobs = this.world.blobs;
    if (!blobs.length) { this.state = 'over'; this.onOver(); return; }
    const b = blobs.reduce((m, o) => (o.cy < m.cy ? o : m));
    b.dead = true; this.world.removeDead();
    this.fx.burst(b.cx, b.cy, hsl(theme.col(b.level, this.clock)), 12, 300, 5);
    this.fx.addShake(2);
    sfx.pop(blobs.length);
    this.endTimer = 0.08;
  }
}
