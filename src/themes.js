import { save, persist } from './storage.js';

// Colors are [hue, saturation%, lightness%] per level (0 = "2" … 10 = "2048").
const BASE_H = [350, 18, 42, 80, 145, 180, 205, 235, 270, 310, 330];
// coral, tangerine, sunflower, lime, green, aqua, sky, indigo, violet, magenta, gold
const VIVID = [[4, 85, 60], [28, 95, 57], [50, 95, 56], [82, 78, 52], [140, 65, 50], [176, 72, 47], [204, 85, 57], [234, 78, 64], [274, 70, 63], [316, 75, 61], [45, 100, 64]];
// sand, peach, terracotta, mustard, sage, eucalyptus, dusty blue, slate blue, lavender, rose, gold
const COZY = [[40, 55, 82], [24, 75, 74], [12, 62, 62], [42, 78, 60], [88, 35, 62], [158, 32, 52], [200, 45, 64], [222, 38, 58], [265, 32, 70], [335, 35, 62], [45, 85, 66]];

// `clasico` is always unlocked; the rest are unlocked by achievements (see achievements.js).
export const THEMES = {
  clasico:  { name: { en: 'Vivid', es: 'Vivo' },        bg: ['#1f1b18', '#121010'], ink: '#f3ece2', jar: '#0b0a09', col: l => VIVID[l] },
  sorbete:  { name: { en: 'Cozy', es: 'Acogedor' },     bg: ['#f6efe3', '#e9dcc8'], ink: '#5b4636', jar: '#33291f', col: l => COZY[l] },
  neon:     { name: { en: 'Neon', es: 'Neón' },         bg: ['#160d2e', '#2b1650'], ink: '#f3e9ff', jar: '#0c0618', col: l => [BASE_H[l], 100, 58] },
  nube:     { name: { en: 'Cloud', es: 'Nube' },        bg: ['#f3f0ff', '#e0fbf1'], ink: '#4a4a6a', jar: '#2e2c3d', col: l => [BASE_H[l], 55, 81] },
  oceano:   { name: { en: 'Ocean', es: 'Océano' },      bg: ['#dff7ff', '#8fc6ea'], ink: '#123a5a', jar: '#0f2a3d', col: l => [165 + l * 11, 68, 48 + l * 3.5] },
  caramelo: { name: { en: 'Caramel', es: 'Caramelo' },  bg: ['#fff2dc', '#f2d2a6'], ink: '#5a3418', jar: '#3a2614', col: l => [8 + l * 5, 78, 50 + (l % 3) * 9 + l * 1.2] },
  noche:    { name: { en: 'Night', es: 'Noche' },       bg: ['#0d1330', '#262d5c'], ink: '#eae8ff', jar: '#080b1e', col: l => [190 + l * 12, 60, 56 + l * 1.8] },
  arcoiris: { name: { en: 'Rainbow', es: 'Arcoíris' },  bg: ['#fffdf7', '#efe4ff'], ink: '#4a2f5c', jar: '#221a2e', col: (l, t) => [(l * 33 + t * 70) % 360, 90, 64] },
};

export const hsl = (c, dl = 0, a = 1) => `hsla(${c[0]},${c[1]}%,${Math.max(0, Math.min(100, c[2] + dl))}%,${a})`;

export let theme = THEMES[save.theme] || THEMES.clasico;

export function setTheme(id) {
  save.theme = id;
  persist();
  applyTheme();
}

export function applyTheme() {
  if (!THEMES[save.theme]) save.theme = 'clasico';
  theme = THEMES[save.theme];
  document.body.style.background = `linear-gradient(${theme.bg[0]},${theme.bg[1]})`;
}

// Custom image drawn inside the jar (see Renderer#drawJar).
const loadImg = url => { if (!url) return null; const img = new Image(); img.src = url; return img; };
export let jarImg = loadImg(save.bg);

/** `url` is an http(s) href already checked to load (or '' to remove it). */
export function setBg(url) {
  save.bg = url;
  persist();
  jarImg = loadImg(url);
}
