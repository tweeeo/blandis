// Purely visual feedback: particles, shockwave rings, floating score text, screen shake.
import { FLOOR } from './config.js';

export class Effects {
  constructor() { this.clear(); }

  clear() { this.parts = []; this.rings = []; this.texts = []; this.shake = 0; }

  burst(x, y, col, count, speed, size) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, r: size * (0.5 + Math.random()), life: 0, max: 0.6 + Math.random() * 0.5, col });
    }
  }

  ring(x, y, r, col) { this.rings.push({ x, y, r, col, life: 0, max: 0.45 }); }

  text(x, y, text, size, hot = false, max = 0.9) { this.texts.push({ x, y, text, size, hot, life: 0, max }); }

  addShake(amount, cap = 14) { this.shake = Math.min(cap, this.shake + amount); }

  update(dt) {
    for (const p of this.parts) {
      p.life += dt; p.vy += 1400 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > FLOOR) { p.y = FLOOR; p.vy *= -0.3; }
    }
    this.parts = this.parts.filter(p => p.life < p.max);
    for (const r of this.rings) r.life += dt;
    this.rings = this.rings.filter(r => r.life < r.max);
    for (const t of this.texts) { t.life += dt; t.y -= 50 * dt; }
    this.texts = this.texts.filter(t => t.life < t.max);
    this.shake *= Math.pow(0.002, dt);
  }
}
