// All sounds are synthesized with WebAudio — no audio files.
import { save } from './storage.js';

let ac = null, master = null;

/** Create/resume the AudioContext. Call from a user gesture. */
export function unlockAudio() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
    } catch (e) { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(f, f2, dur, type = 'sine', vol = 0.2, delay = 0) {
  if (save.muted) return;
  const a = unlockAudio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.03);
}

const NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 1047, 1175, 1319];

export const sfx = {
  launch: power => tone(260, 520 + power * 500, 0.14, 'triangle', 0.08 + power * 0.1),
  plop: speed => tone(170, 70, 0.14, 'sine', Math.min(0.35, 0.06 + speed * 0.0003)),
  merge: (level, combo) => {
    const n = NOTES[Math.min(NOTES.length - 1, level + combo - 1)] * 0.75;
    tone(n * 0.5, n, 0.16, 'sine', 0.3); tone(n * 1.5, n * 1.52, 0.18, 'triangle', 0.07, 0.05);
  },
  boom: () => { [0, 2, 4, 5, 7, 9].forEach((k, i) => tone(NOTES[k] * 1.5, 0, 0.3, 'triangle', 0.12, i * 0.07)); tone(110, 40, 0.6, 'sine', 0.4); },
  pop: i => tone(500 + (i % 8) * 60, 200, 0.1, 'sine', 0.12),
  over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.97, 0.25, 'triangle', 0.15, i * 0.16)),
  click: () => tone(700, 900, 0.06, 'sine', 0.08),
  ach: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, 0.18, 'triangle', 0.12, i * 0.08)),
};

// Browsers block vibration until the user has interacted with the page.
export const buzz = pattern => {
  if (!navigator.vibrate || navigator.userActivation?.hasBeenActive === false) return;
  try { navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
};
