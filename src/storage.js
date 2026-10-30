// Persistent player data in localStorage.
// Progress (best, top, achievements, stats) is signed so hand-editing localStorage
// from the dev tools wipes progress instead of granting it. This is a deterrent, not
// real security: a game that runs entirely in the browser can always be modified.
const KEY = 'blandis-v2';
const SALT = 'squ1shy-bl0bs:7f3a9c';

const freshProgress = () => ({
  best: 0, top: [], ach: [],
  stats: { games: 0, merges: 0, launches: 0, playTime: 0 },
});

export const save = { ...freshProgress(), theme: 'clasico', muted: false, lang: 'en' };

// cyrb53: small, fast 53-bit string hash.
function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const sign = d => hash(SALT + JSON.stringify([d.best, d.top, d.ach, d.stats]) + SALT);

try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw) {
    if (raw.sig === sign(raw)) {
      Object.assign(save, raw);
      save.stats = { ...freshProgress().stats, ...raw.stats };
    } else {
      // Tampered: keep harmless settings only.
      Object.assign(save, { theme: raw.theme, muted: !!raw.muted, lang: raw.lang });
    }
  }
} catch (e) { /* private mode or corrupt data */ }
delete save.sig;
if (save.lang !== 'es') save.lang = 'en';

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...save, sig: sign(save) })); } catch (e) { /* private mode */ }
}
