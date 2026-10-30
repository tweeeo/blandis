// Entry point: wires game, renderer, menus and input, then runs the loop.
import { DT } from './config.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Menu } from './ui/menu.js';
import { applyTheme } from './themes.js';
import { isThemeUnlocked } from './achievements.js';
import { save } from './storage.js';
import { unlockAudio } from './audio.js';

const canvas = document.getElementById('c');
const game = new Game();
const renderer = new Renderer(canvas, game);
const menu = new Menu(game);

// Input: drag on the canvas to aim, release to launch.
const worldPoint = e => renderer.toWorld(e.clientX, e.clientY);
canvas.addEventListener('pointerdown', e => {
  unlockAudio();
  if (!game.canAim || game.aim) return;
  game.beginAim(worldPoint(e), e.pointerId);
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => game.moveAim(worldPoint(e), e.pointerId));
canvas.addEventListener('pointerup', e => game.releaseAim(worldPoint(e), e.pointerId));
canvas.addEventListener('pointercancel', () => game.cancelAim());
addEventListener('keydown', e => {
  if (e.key === 'Escape' || e.key === 'p') menu.togglePause();
  // F5 / Ctrl+R / Cmd+R would throw away the run without asking.
  if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) e.preventDefault();
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
let last = performance.now(), acc = 0;
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
  raf(frame);
}

if (!isThemeUnlocked(save.theme)) save.theme = 'clasico';
applyTheme();
game.attract();
menu.show('start');
raf(frame);

// Nothing is exposed globally in production. For local debugging only:
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.blandis = { game, renderer, menu };
