// Position-based soft-body solver. Each substep:
//   integrate -> shape matching -> edge spacing + smoothing -> area (volume) -> bbox
//   -> blob/blob collisions -> walls -> derive velocities.
import {
  G, DAMP, K_SHAPE, K_EDGE, K_SMOOTH, K_AREA, WALL_L, WALL_R, FLOOR,
  TRAY_L, TRAY_R, TRAY_TOP, TRAY_BOT, TRAY_PUSH,
} from '../config.js';

const CORE = 0.45;     // core radius as a fraction of the blob radius
const RESCUE = 3;      // px per substep to push out a swallowed blob
const MAX_STRETCH = 1.22; // max perimeter vs. the round shape (a square is 1.13, a triangle 1.29)

export class World {
  constructor() {
    this.blobs = [];
    this.contacts = [];   // [a, b] pairs of same-level blobs that touched (merge candidates)
  }

  clear() { this.blobs = []; this.contacts = []; }
  add(b) { this.blobs.push(b); return b; }
  removeDead() { this.blobs = this.blobs.filter(b => !b.dead); }

  step(h) {
    const blobs = this.blobs;
    for (const b of blobs) {
      // Tray blobs are pulled toward the middle of the channel (and lightly down onto its floor),
      // easing off near the centre so they settle instead of jiggling.
      const toMid = (TRAY_L + TRAY_R) / 2 - b.cx;
      const gx = b.tray ? Math.sign(toMid) * TRAY_PUSH * Math.min(1, Math.abs(toMid) / 40) : 0, gy = b.tray ? 300 : G;
      for (let i = 0; i < b.n; i++) {
        b.vx[i] += gx * h; b.vy[i] += gy * h;
        b.ox[i] = b.px[i]; b.oy[i] = b.py[i];
        b.px[i] += b.vx[i] * h; b.py[i] += b.vy[i] * h;
        b.touch[i] = 0;
      }
    }
    for (const b of blobs) { shapeMatch(b); edges(b); area(b); bbox(b); }
    for (let i = 0; i < blobs.length; i++) {
      const a = blobs[i];
      for (let j = i + 1; j < blobs.length; j++) {
        const b = blobs[j];
        if (a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY) continue;
        separateCores(a, b);
        if (pointsInto(a, b) | pointsInto(b, a)) {
          a.hit = b.hit = true;
          if (a.level === b.level && !a.tray && !b.tray) this.contacts.push([a, b]);
        }
      }
    }
    for (const b of blobs) walls(b);
    for (const b of blobs) {
      let sx = 0, sy = 0;
      for (let i = 0; i < b.n; i++) {
        let vx = (b.px[i] - b.ox[i]) / h, vy = (b.py[i] - b.oy[i]) / h;
        const t = b.touch[i];
        if (b.tray) { vx *= 0.985; vy *= 0.985; }   // settle quickly instead of sloshing
        else if (t === 1) vy *= 0.94; else if (t === 2) vx *= 0.9; else if (t === 3) { vx *= 0.995; vy *= 0.995; }
        b.vx[i] = vx * DAMP; b.vy[i] = vy * DAMP; sx += vx; sy += vy;
      }
      b.vcx = sx / b.n; b.vcy = sy / b.n;
    }
  }
}

// Pull points gently toward the best-fit rotated rest circle.
function shapeMatch(b) {
  const n = b.n; let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) { cx += b.px[i]; cy += b.py[i]; }
  cx /= n; cy /= n;
  let sn = 0, cs = 0;
  for (let i = 0; i < n; i++) {
    const dx = b.px[i] - cx, dy = b.py[i] - cy;
    sn += b.qx[i] * dy - b.qy[i] * dx; cs += b.qx[i] * dx + b.qy[i] * dy;
  }
  const ang = Math.atan2(sn, cs), c = Math.cos(ang), s = Math.sin(ang), sc = b.scale;
  for (let i = 0; i < n; i++) {
    const gx = cx + (c * b.qx[i] - s * b.qy[i]) * sc, gy = cy + (s * b.qx[i] + c * b.qy[i]) * sc;
    b.px[i] += (gx - b.px[i]) * K_SHAPE; b.py[i] += (gy - b.py[i]) * K_SHAPE;
  }
  b.cx = cx; b.cy = cy; b.angle = ang;
}

// Edges only keep points evenly spaced (perimeter may grow so the blob can deform),
// plus a little smoothing that acts like surface tension.
function edges(b) {
  const n = b.n, px = b.px, py = b.py;
  let P = 0;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; P += Math.hypot(px[j] - px[i], py[j] - py[i]); }
  // ...but only up to MAX_STRETCH, or a squeezed blob turns into a long tendril.
  const rest = b.edge * b.scale, L = Math.min(Math.max(rest, P / n), rest * MAX_STRETCH);
  // Over-stretched blobs pull back firmly and get extra surface tension.
  const over = P / n > rest * MAX_STRETCH, kEdge = over ? 0.7 : K_EDGE, kSmooth = over ? K_SMOOTH * 3 : K_SMOOTH;
  for (let i = 0; i < n; i++) {
    const p = (i + n - 1) % n, j = (i + 1) % n;
    px[i] += ((px[p] + px[j]) / 2 - px[i]) * kSmooth; py[i] += ((py[p] + py[j]) / 2 - py[i]) * kSmooth;
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, dx = px[j] - px[i], dy = py[j] - py[i], d = Math.hypot(dx, dy);
    if (d < 1e-6) continue;
    const k = (d - L) / d * 0.5 * kEdge;
    px[i] += dx * k; py[i] += dy * k; px[j] -= dx * k; py[j] -= dy * k;
  }
}

// Keep polygon area at the rest area (the blob's "volume").
function area(b) {
  const n = b.n, px = b.px, py = b.py;
  let A = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, p = (i + n - 1) % n;
    A += px[i] * py[j] - px[j] * py[i];
    b.gx[i] = 0.5 * (py[j] - py[p]); b.gy[i] = 0.5 * (px[p] - px[j]);
    sum += b.gx[i] * b.gx[i] + b.gy[i] * b.gy[i];
  }
  if (sum < 1e-9) return;
  const lam = -(A / 2 - b.area0 * b.scale * b.scale) / sum * K_AREA;
  for (let i = 0; i < n; i++) { px[i] += lam * b.gx[i]; py[i] += lam * b.gy[i]; }
}

function bbox(b) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < b.n; i++) {
    const x = b.px[i], y = b.py[i];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  b.minX = x0 - 2; b.maxX = x1 + 2; b.minY = y0 - 2; b.maxY = y1 + 2;
}

function insidePolygon(x, y, b) {
  const bx = b.px, by = b.py, n = b.n;
  let inside = false;
  for (let j = 0, k = n - 1; j < n; k = j++) {
    if ((by[j] > y) !== (by[k] > y) && x < (bx[k] - bx[j]) * (y - by[j]) / (by[k] - by[j]) + bx[j]) inside = !inside;
  }
  return inside;
}

function translate(b, dx, dy) {
  for (let i = 0; i < b.n; i++) { b.px[i] += dx; b.py[i] += dy; }
  b.cx += dx; b.cy += dy;
}

// Each blob has a solid core (half its radius) that others can't enter, and a blob whose
// centre ended up inside another one (after a hard hit) is pushed back out. Without this a
// fast blob can get swallowed and both bodies tangle into odd shapes.
function separateCores(a, b) {
  let dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);
  if (d < 1e-6) { dx = 0; dy = 1; d = 1; }
  const nx = dx / d, ny = dy / d;
  const minD = CORE * (a.r * a.scale + b.r * b.scale);
  let push = minD > d ? (minD - d) * 0.5 : 0;
  if (!push && (insidePolygon(a.cx, a.cy, b) || insidePolygon(b.cx, b.cy, a))) push = RESCUE;
  if (!push) return;
  const fa = b.mass / (a.mass + b.mass), fb = 1 - fa;
  translate(a, -nx * push * fa, -ny * push * fa);
  translate(b, nx * push * fb, ny * push * fb);
}

// Push every point of `a` that is inside polygon `b` back onto b's surface.
function pointsInto(a, b) {
  const bx = b.px, by = b.py, n = b.n; let any = false;
  for (let i = 0; i < a.n; i++) {
    const x = a.px[i], y = a.py[i];
    if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY || !insidePolygon(x, y, b)) continue;
    let best = 1e18, bj = 0, bt = 0, qx = 0, qy = 0;
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n, ex = bx[k] - bx[j], ey = by[k] - by[j];
      let t = ((x - bx[j]) * ex + (y - by[j]) * ey) / (ex * ex + ey * ey || 1);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = bx[j] + ex * t, cy = by[j] + ey * t, d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < best) { best = d; bj = j; bt = t; qx = cx; qy = cy; }
    }
    const bk = (bj + 1) % n, wp = a.w, we = b.w;
    const s = wp + we * ((1 - bt) ** 2 + bt * bt), dx = qx - x, dy = qy - y;
    a.px[i] += wp * dx / s; a.py[i] += wp * dy / s;
    const f0 = we * (1 - bt) / s, f1 = we * bt / s;
    bx[bj] -= f0 * dx; by[bj] -= f0 * dy; bx[bk] -= f1 * dx; by[bk] -= f1 * dy;
    a.touch[i] = 3; b.touch[bj] = 3; b.touch[bk] = 3;
    any = true;
  }
  return any;
}

function walls(b) {
  if (b.tray) {
    // Frictionless channel: blobs bigger than it get squashed into pills.
    for (let i = 0; i < b.n; i++) {
      if (b.px[i] < TRAY_L) b.px[i] = TRAY_L; else if (b.px[i] > TRAY_R) b.px[i] = TRAY_R;
      if (b.py[i] < TRAY_TOP) b.py[i] = TRAY_TOP; else if (b.py[i] > TRAY_BOT) b.py[i] = TRAY_BOT;
    }
    return;
  }
  for (let i = 0; i < b.n; i++) {
    if (b.px[i] < WALL_L) { b.px[i] = WALL_L; b.touch[i] = 1; b.hit = b.sideHit = true; }
    else if (b.px[i] > WALL_R) { b.px[i] = WALL_R; b.touch[i] = 1; b.hit = b.sideHit = true; }
    if (b.py[i] > FLOOR) { b.py[i] = FLOOR; b.touch[i] = 2; b.hit = true; }
    else if (b.py[i] < 0) { b.py[i] = 0; b.touch[i] = 2; }
  }
}
