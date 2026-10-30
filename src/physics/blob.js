import { radiusOf } from '../config.js';

/**
 * A soft body: a closed ring of points with a rest shape (a circle).
 * Positions/velocities live in typed arrays for speed.
 */
export class Blob {
  constructor(level, x, y, scale = 1) {
    this.level = level;
    this.r = radiusOf(level);
    const n = this.n = Math.round(Math.min(56, Math.max(16, 2 * Math.PI * this.r / 9)));
    this.mass = (this.r / 20) ** 2;
    this.w = n / this.mass;                       // inverse mass per point

    this.px = new Float64Array(n); this.py = new Float64Array(n);   // position
    this.ox = new Float64Array(n); this.oy = new Float64Array(n);   // previous position
    this.vx = new Float64Array(n); this.vy = new Float64Array(n);   // velocity
    this.qx = new Float64Array(n); this.qy = new Float64Array(n);   // rest offsets
    this.gx = new Float64Array(n); this.gy = new Float64Array(n);   // area gradient scratch
    this.touch = new Uint8Array(n);               // 0 free, 1 side wall, 2 floor, 3 other blob

    let A = 0;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      this.qx[i] = Math.cos(a) * this.r; this.qy[i] = Math.sin(a) * this.r;
      this.px[i] = x + this.qx[i] * scale; this.py[i] = y + this.qy[i] * scale;
    }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; A += this.qx[i] * this.qy[j] - this.qx[j] * this.qy[i]; }
    this.area0 = A / 2;
    this.edge = 2 * this.r * Math.sin(Math.PI / n);

    this.scale = scale; this.scaleV = 0;          // springy grow animation after a merge
    this.cx = x; this.cy = y; this.vcx = 0; this.vcy = 0; this.angle = 0;
    this.minX = this.maxX = x; this.minY = this.maxY = y;

    this.age = 0;
    this.happy = 0;        // >0 right after being created by a merge
    this.dead = false;
    this.fresh = true;     // hasn't touched anything since launch
    this.hit = false;      // touched something this step
    this.power = 0;        // launch power 0..1
    this.launched = false; // came from the player (not from a merge)
    this.sideHit = false;  // has touched a side wall
    this.bank = false;     // first contact after launch was a side wall
  }

  setVelocity(vx, vy) { this.vx.fill(vx); this.vy.fill(vy); }

  /** Per-frame bookkeeping that isn't part of the constraint solve. */
  update(dt) {
    this.age += dt;
    this.scaleV += ((1 - this.scale) * 160 - this.scaleV * 13) * dt;
    this.scale += this.scaleV * dt;
    if (this.happy > 0) this.happy -= dt;
  }
}
