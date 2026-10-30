// Persistent player data (best score, achievements, settings) in localStorage.
const KEY = 'blandis-v1';

export const save = { best: 0, top: [], ach: [], theme: 'clasico', muted: false, lang: 'en' };

try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private mode */ }
if (save.lang !== 'es') save.lang = 'en';

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode */ }
}
