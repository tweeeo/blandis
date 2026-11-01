// Entry point: wires game, renderer, menus and input, then runs the loop.
import { DT } from './config.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Menu } from './ui/menu.js';
import { Sidebar } from './ui/sidebar.js';
import { applyTheme } from './themes.js';
import { isThemeUnlocked } from './achievements.js';
import { save } from './storage.js';
import { unlockAudio } from './audio.js';
import { startSession } from './leaderboard.js';
import './update.js';

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const canvas = document.getElementById('c');
const game = new Game();
const renderer = new Renderer(canvas, game);
const menu = new Menu(game);
const sidebar = new Sidebar(game, renderer);
game.onStart = () => { startSession(); sidebar.refresh(); };
sidebar.refresh();

// Input: press on a blob in the tray, drag toward where it should go, release to launch.
const worldPoint = e => renderer.toWorld(e.clientX, e.clientY);
canvas.addEventListener('pointerdown', e => {
  unlockAudio();
  if (!game.canAim) return;
  game.beginAim(worldPoint(e), e.pointerId);
  if (game.selected) canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (game.grip) game.moveAim(worldPoint(e), e.pointerId);
  else game.setHover(worldPoint(e));
});
canvas.addEventListener('pointerup', e => game.releaseAim(worldPoint(e), e.pointerId));
canvas.addEventListener('pointercancel', () => game.cancelAim());
// Capture lost without a pointerup (fires after pointerup too, by then the grip is already gone).
// Otherwise a stale grip would launch on the next click's release, since the mouse always has the same pointerId.
canvas.addEventListener('lostpointercapture', () => game.cancelAim());
addEventListener('keydown', e => {
  if ((e.key === 'Escape' || e.key === 'p') && e.target.tagName !== 'INPUT') menu.togglePause();
  if (e.key.toLowerCase() === 'c' && e.target.tagName !== 'INPUT') game.cancelAim();
  // F5 / Ctrl+R / Cmd+R would throw away the run without asking.
  if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) e.preventDefault();
  // DevTools / view-source shortcuts. Only a deterrent: the browser menu still opens them (and Firefox ignores this).
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (!isLocal && (e.key === 'F12' || (mod && (e.shiftKey || e.altKey) && 'ijc'.includes(k)) || (mod && k === 'u'))) e.preventDefault();
});
addEventListener('contextmenu', e => e.preventDefault());
// Reload button, closing the tab, etc.: the browser shows its own "Leave site?" confirmation.
addEventListener('beforeunload', e => {
  if (['play', 'paused', 'ending'].includes(game.state)) { e.preventDefault(); e.returnValue = ''; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play') menu.togglePause(); });

// Fixed-timestep loop; at most 3 physics steps per frame so slow devices don't spiral
// (this also means game time can never run faster than real time).
// rAF is captured now so a console script can't swap it later to speed the game up.
const raf = window.requestAnimationFrame.bind(window);
let last = performance.now(), acc = 0, scrollLocked = false;
// During a run the page can't scroll, so a drag on the jar never moves it; the game is brought fully into view first.
function lockScroll() {
  const locked = game.state === 'play' || game.state === 'ending';
  if (locked === scrollLocked) return;
  scrollLocked = locked;
  if (locked) scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.toggle('playing', locked);
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (game.running) {
    acc += dt;
    let steps = 0;
    while (acc >= DT && steps < 3) { game.tick(DT); acc -= DT; steps++; }
    if (steps === 3) acc = 0;
  }
  game.fx.update(dt);
  renderer.draw();
  sidebar.update();
  lockScroll();
  raf(frame);
}

if (!isThemeUnlocked(save.theme)) save.theme = 'clasico';
applyTheme();
game.attract();
menu.show('start');
raf(frame);

// Nothing is exposed globally in production. For local debugging only:
if (isLocal) window.blandis = { game, renderer, menu, sidebar };
