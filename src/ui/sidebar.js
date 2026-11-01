// Global leaderboard of the current game mode beside the jar on wide screens. During a run the player's live score is
// slotted into the list and slides up past each entry it beats. Visual only: nothing is sent.
import { W, H } from '../config.js';
import { save } from '../storage.js';
import { t } from '../i18n.js';
import { fetchTop } from '../leaderboard.js';
import { MODES, formatResult } from '../modes.js';

const ROW = 34, VISIBLE = 9, WIDTH = 260, GAP = 32;
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

export class Sidebar {
  constructor(game, renderer) {
    this.game = game; this.renderer = renderer;
    this.el = document.getElementById('side');
    this.rows = []; this.items = []; this.me = null;
    this.rank = 0; this.score = -1; this.live = false; this.loaded = false;
    addEventListener('resize', () => this.place());
    this.place();
  }

  /** Show only when the free space right of the jar fits the panel. */
  place() {
    const { s, ox, oy } = this.renderer.view;
    this.fits = ox >= WIDTH + GAP * 2 && innerHeight >= 520;
    this.el.classList.toggle('hide', !this.fits || !this.loaded);
    this.el.style.left = ox + W * s + GAP + 'px';
    this.el.style.top = oy + H * s * 0.2 + 'px';
    if (this.fits && this.list) this.update(true);
  }

  async refresh() {
    this.mode = this.game.mode;
    try { this.rows = await fetchTop(this.mode); this.loaded = true; } catch (e) { this.loaded = false; }
    this.build(); this.place();
  }

  build() {
    const m = MODES[this.mode];
    this.el.innerHTML = `<h3>🌍 ${t('globalTop')} · ${m.icon}</h3>
      <div class="lbs-view" style="height:${ROW * VISIBLE}px"><div class="lbs-list"></div></div>
      <div class="lbs-foot"></div>`;
    this.view = this.el.querySelector('.lbs-view');
    this.list = this.el.querySelector('.lbs-list');
    this.foot = this.el.querySelector('.lbs-foot');
    this.items = this.rows.map(r => {
      const li = document.createElement('div');
      li.className = 'lbs-row' + (save.name && r.name === save.name ? ' own' : '');
      li.innerHTML = `<i></i><span>${esc(r.name)}</span><b>${m.byTime ? formatResult(this.mode, r.time) : r.score}</b>`;
      this.list.append(li);
      return li;
    });
    this.me = document.createElement('div');
    this.me.className = 'lbs-row me';
    this.me.innerHTML = `<i></i><span>${t('you')}</span><b>0</b>`;
    this.list.append(this.me);
    this.rank = 0; this.score = -1;
    this.update(true);
  }

  /** Called every frame; only touches the DOM when the score or the run state changes. */
  update(force = false) {
    if (!this.fits || !this.loaded) return;
    // Time-ranked modes (sprint) have no live score to slot in: the list is shown as it is.
    const g = this.game, live = !MODES[this.mode].byTime && ['play', 'paused', 'ending', 'over'].includes(g.state);
    if (!force && live === this.live && g.score === this.score) return;
    const started = live && !this.live;
    this.live = live; this.score = g.score;
    const rank = live ? this.rows.filter(r => r.score >= g.score).length + 1 : 0;
    const passed = this.rank && rank && rank < this.rank && !started ? this.rank - rank : 0;
    this.rank = rank;

    this.items.forEach((li, i) => {
      const at = rank && i >= rank - 1 ? i + 1 : i;
      li.style.transform = `translateY(${at * ROW}px)`;
      li.firstChild.textContent = at + 1;
      if (passed && i >= rank - 1 && i < rank - 1 + passed) this.flash(li, 'passed');
    });
    this.me.style.display = live ? '' : 'none';
    if (live) {
      this.me.style.transform = `translateY(${(rank - 1) * ROW}px)`;
      this.me.firstChild.textContent = rank === 1 ? '👑' : rank;
      this.me.lastChild.textContent = g.score;
      if (passed) { this.me.dataset.up = '▲' + passed; this.flash(this.me, 'up'); }
    }
    // Keep the player's row near the middle of the visible window.
    const total = this.items.length + (live ? 1 : 0);
    const top = live ? Math.max(0, Math.min((rank - 1) - (VISIBLE >> 1), total - VISIBLE)) : 0;
    this.list.style.transform = `translateY(${-top * ROW}px)`;
    // Fade an edge only when there are more rows hidden beyond it.
    this.view.classList.toggle('up', top > 0);
    this.view.classList.toggle('down', top + VISIBLE < total);
    this.foot.innerHTML = this.footer(rank);
  }

  footer(rank) {
    if (!this.live) return this.rows.length ? '' : `<small>${t('lbEmpty')}</small>`;
    if (rank === 1) return `<b>${t('first')}</b>`;
    const next = this.rows[rank - 2], prev = this.rows[rank - 1]?.score ?? 0;
    const p = Math.max(0, Math.min(1, (this.score - prev) / (next.score - prev || 1)));
    return `<small>${t('nextUp')(esc(next.name), next.score - this.score + 1)}</small>
      <div class="lbs-bar"><i style="transform:scaleX(${p})"></i></div>`;
  }

  /** Restart a one-shot CSS animation. */
  flash(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
}
