// Draws the game onto the canvas. Reads game state, never changes it.
import { W, H, WALL_L, WALL_R, FLOOR, JAR_TOP, DANGER, G, MAX_LEVEL, MAX_PULL, PULL_SPEED, TAP_POWER, DANGER_TIME, radiusOf, valueOf } from './config.js';
import { theme, hsl } from './themes.js';
import { save } from './storage.js';
import { t } from './i18n.js';

const LINE = '#0b0a09';
const LIGHT = '#fff6ea';
const FONT = 'Nunito, system-ui, sans-serif';

export class Renderer {
  constructor(canvas, game) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.view = { s: 1, ox: 0, oy: 0, dpr: 1 };
    this.shownScore = 0;
    this.hx = new Float64Array(28); this.hy = new Float64Array(28);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    this.cv.width = w * dpr; this.cv.height = h * dpr;
    const s = Math.min(w / W, h / H);
    this.view = { s, dpr, ox: (w - W * s) / 2, oy: (h - H * s) / 2 };
  }

  /** Screen (CSS px) -> world coordinates. */
  toWorld(clientX, clientY) {
    const v = this.view;
    return { x: (clientX - v.ox) / v.s, y: (clientY - v.oy) / v.s };
  }

  draw() {
    const { ctx, game } = this, { s, dpr, ox, oy } = this.view, fx = game.fx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    const shx = (Math.random() - 0.5) * fx.shake, shy = (Math.random() - 0.5) * fx.shake;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + shx * s), dpr * (oy + shy * s));

    this.drawJar();
    this.drawTrajectory();
    for (const b of game.world.blobs) this.drawBody(b.px, b.py, b.n, b.level, b.cx, b.cy, b.r * b.scale, b.happy > 0);
    this.drawHand();
    this.drawEffects();
    if (game.state !== 'attract') this.drawHud();
  }

  drawJar() {
    const { ctx, game } = this;
    ctx.beginPath();
    ctx.roundRect(WALL_L - 8, JAR_TOP, WALL_R - WALL_L + 16, FLOOR - JAR_TOP + 8, 28);
    ctx.fillStyle = theme.jar; ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();

    const warn = game.dangerT > 0;
    ctx.setLineDash([14, 12]); ctx.lineWidth = 3;
    ctx.strokeStyle = warn ? `rgba(255,90,70,${0.5 + 0.5 * Math.sin(game.clock * 18)})` : LIGHT;
    ctx.globalAlpha = warn ? 1 : 0.22;
    ctx.beginPath(); ctx.moveTo(WALL_L, DANGER); ctx.lineTo(WALL_R, DANGER); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  drawTrajectory() {
    const { ctx, game } = this;
    if (!game.hand || !game.aim || game.state !== 'play' || game.aimPower() < TAP_POWER) return;
    const pull = game.aimPull(), p0 = game.handPos(), vx = pull.x * PULL_SPEED, vy = pull.y * PULL_SPEED;
    ctx.fillStyle = LIGHT;
    for (let tt = 0.04, k = 0; tt < 1.3; tt += 0.04, k++) {
      const x = p0.x + vx * tt, y = p0.y + vy * tt + 0.5 * G * tt * tt;
      if (x < WALL_L || x > WALL_R || y > FLOOR) break;
      ctx.globalAlpha = Math.max(0, 0.55 - k * 0.018);
      ctx.beginPath(); ctx.arc(x, y, 4 - k * 0.07, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawHand() {
    const { ctx, game } = this;
    if (!game.hand || (game.state !== 'play' && game.state !== 'paused')) return;
    const hp = game.handPos(), pull = game.aimPull();
    this.drawPreviewBlob(game.hand.level, hp.x, hp.y, game.hand.scale, pull);
    if (game.aim && game.aimPower() >= TAP_POWER) {
      const ex = hp.x + pull.x * 0.7, ey = hp.y + pull.y * 0.7;
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,248,236,.9)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(hp.x, hp.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = 'rgba(255,248,236,.55)';
      ctx.beginPath(); ctx.arc(ex, ey, 13, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawEffects() {
    const { ctx } = this, fx = this.game.fx;
    for (const r of fx.rings) {
      const k = r.life / r.max;
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.col; ctx.lineWidth = 8 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.8 + k * 0.9), 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of fx.parts) {
      ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of fx.texts) {
      const k = tx.life / tx.max, pop = Math.min(1, tx.life * 8);
      ctx.globalAlpha = 1 - k * k;
      ctx.font = `900 ${tx.size * (0.6 + 0.4 * pop)}px ${FONT}`;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(70,50,35,.55)'; ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.hot ? '#f2c46b' : '#fffaf2'; ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
  }

  drawHud() {
    const { ctx, game } = this, ink = theme.ink;
    this.shownScore += (game.score - this.shownScore) * 0.2;
    if (Math.abs(game.score - this.shownScore) < 1) this.shownScore = game.score;

    ctx.textAlign = 'left'; ctx.fillStyle = ink;
    ctx.font = `900 52px ${FONT}`; ctx.fillText(Math.round(this.shownScore), WALL_L, 46);
    ctx.globalAlpha = 0.6; ctx.font = `800 20px ${FONT}`;
    ctx.fillText(t('best') + ' ' + Math.max(save.best, game.score), WALL_L + 2, 88);

    ctx.textAlign = 'center'; ctx.font = `800 18px ${FONT}`;
    ctx.fillText(t('next'), 510, 80); ctx.globalAlpha = 1;
    this.drawPreviewBlob(game.nextLevel, 510, 135, Math.min(1, 34 / radiusOf(game.nextLevel)), { x: 0, y: 0 });

    // Evolution chain under the jar
    let x = WALL_L + 14;
    for (let l = 0; l <= MAX_LEVEL; l++) {
      const r = 6 + l * 1.1;
      ctx.globalAlpha = l <= Math.max(game.maxLevel, 4) ? 1 : 0.3;
      ctx.fillStyle = hsl(theme.col(l, game.clock)); ctx.strokeStyle = hsl(theme.col(l, game.clock), -24); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + r, FLOOR + 30, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      x += r * 2 + 13.5;
    }
    ctx.globalAlpha = 1;

    if (game.dangerT > 0 && game.state === 'play') {
      ctx.fillStyle = '#ff3c5a'; ctx.font = `900 26px ${FONT}`;
      ctx.fillText(t('careful') + ' ' + Math.max(0, DANGER_TIME - game.dangerT).toFixed(1), W / 2, DANGER + 30);
    }
  }

  /** Smooth closed curve through the points (midpoint quadratic). */
  blobPath(xs, ys, n) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo((xs[n - 1] + xs[0]) / 2, (ys[n - 1] + ys[0]) / 2);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[j]) / 2, (ys[i] + ys[j]) / 2);
    }
    ctx.closePath();
  }

  drawBody(xs, ys, n, level, cx, cy, r, happy) {
    const ctx = this.ctx, c = theme.col(level, this.game.clock);
    this.blobPath(xs, ys, n);
    ctx.fillStyle = hsl(c); ctx.fill();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = LINE; ctx.stroke();

    const label = String(valueOf(level)), len = label.length;
    const size = Math.min(r * 0.5, 40) * (len <= 2 ? 1 : len === 3 ? 0.85 : 0.7) * (happy ? 1.12 : 1);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c[2] > 40 ? 'rgba(11,10,9,.82)' : LIGHT;
    ctx.fillText(label, cx, cy + size * 0.04);
  }

  /** Held / next blob: a wobbly circle stretched along the aim direction. */
  drawPreviewBlob(level, x, y, scale, pull) {
    const r = radiusOf(level) * scale, n = this.hx.length, clock = this.game.clock;
    const d = Math.hypot(pull.x, pull.y), p = d / MAX_PULL;
    const ux = d ? pull.x / d : 0, uy = d ? pull.y / d : 1;
    const st = 1 + p * 0.35, sq = 1 - p * 0.18;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, wob = 1 + Math.sin(a * 3 + clock * 5) * 0.025;
      const ox = Math.cos(a) * r * wob, oy = Math.sin(a) * r * wob;
      const along = ox * ux + oy * uy, perp = -ox * uy + oy * ux;
      this.hx[i] = x + ux * along * st - uy * perp * sq;
      this.hy[i] = y + uy * along * st + ux * perp * sq;
    }
    this.drawBody(this.hx, this.hy, n, level, x, y, r, false);
  }
}
