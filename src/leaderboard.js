// Global leaderboard client.
import { save, persist } from './storage.js';

// Production URL is injected at build time from the LEADERBOARD_API repository secret.
const API = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:8787'
  : typeof __API_URL__ === 'string' ? __API_URL__ : '';

/** Same rule the server applies. */
export const NAME_RE = /^[\p{L}\p{N} _.-]{1,16}$/u;

async function call(init, query = '') {
  const r = await fetch(API + '/scores' + query, init);
  if (!r.ok) throw new Error('leaderboard ' + r.status);
  return r.json();
}
const send = (method, data) => call({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

/** Rows shown in every leaderboard (the server sends up to 50). */
export const TOP_N = 10;

/** Top TOP_N of a game mode: [{ name, score, time }], coerced so a bad response can't put markup in the numbers. */
export const fetchTop = mode => call(undefined, '?mode=' + encodeURIComponent(mode))
  .then(rows => rows.slice(0, TOP_N).map(r => ({ name: String(r.name), score: Number(r.score) | 0, time: Number(r.time) || 0 })));

// A token from the server dated at the start of the run: it lets the server check that the run
// took at least as long as it says. Without one (offline at the start) the score is rejected.
let session = null;
export function startSession() {
  session = fetch(API + '/session', { method: 'POST' }).then(r => r.json()).then(d => d.token, () => null);
}

/** Sends a finished run; resolves to { rank } of the player's best run in that mode. */
export async function submitScore(mode, score, time, merges) {
  if (!save.pid) {
    save.pid = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    persist();
  }
  return send('POST', { id: save.pid, name: save.name, score, time, merges, token: await session, mode });
}

/** Erases this player's entry on the server, then forgets the id and nickname locally. */
export async function deleteScore() {
  await send('DELETE', { id: save.pid });
  save.pid = ''; save.name = ''; persist();
}
