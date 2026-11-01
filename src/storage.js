// Persistent player data in localStorage.
// Progress (best, top, achievements, stats) is signed so hand-editing localStorage
// from the dev tools wipes progress instead of granting it. This is a deterrent, not
// real security: a game that runs entirely in the browser can always be modified.
// The leaderboard server trusts none of it: it only gets the finished run and checks it itself.
const KEY = 'blandis-v2';
const SALT = 'squ1shy-bl0bs:7f3a9c';

const freshProgress = () => ({
  best: 0, top: [], ach: [],
  stats: { games: 0, merges: 0, launches: 0, playTime: 0 },
});

// name / pid: global leaderboard nickname and anonymous player id.
// ga: Google Analytics consent (null = not asked yet).
// mode: last game mode played · modes: { [mode]: { best, top } } for every mode but classic (src/modes.js).
export const save = { ...freshProgress(), theme: 'clasico', muted: false, lang: 'en', name: '', pid: '', bg: '', ga: null, mode: 'classic', modes: {} };

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
// modes is only signed once it has results, so saves from before game modes keep their signature.
const sign = d => hash(SALT + JSON.stringify([d.best, d.top, d.ach, d.stats, ...(Object.keys(d.modes || {}).length ? [d.modes] : [])]) + SALT);

try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw) {
    if (raw.sig === sign(raw)) {
      Object.assign(save, raw);
      save.stats = { ...freshProgress().stats, ...raw.stats };
    } else {
      // Tampered: keep harmless settings only.
      Object.assign(save, { theme: raw.theme, muted: !!raw.muted, lang: raw.lang, name: raw.name, pid: raw.pid, bg: raw.bg, ga: raw.ga, mode: raw.mode });
    }
  }
} catch (e) { /* private mode or corrupt data */ }
delete save.sig;
if (save.lang !== 'es') save.lang = 'en';
if (typeof save.name !== 'string') save.name = '';
if (typeof save.bg !== 'string') save.bg = '';
if (typeof save.ga !== 'boolean') save.ga = null;
if (!save.modes || typeof save.modes !== 'object') save.modes = {};
// The player id is only created when a score is first sent to the global leaderboard.
if (!/^[0-9a-f]{32}$/.test(save.pid)) save.pid = '';

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...save, sig: sign(save) })); } catch (e) { /* private mode */ }
}
