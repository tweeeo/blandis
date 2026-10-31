// Global leaderboard client.
import { save, persist } from './storage.js';

// Production URL is injected at build time from the LEADERBOARD_API repository secret.
const API = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:8787'
  : typeof __API_URL__ === 'string' ? __API_URL__ : '';

/** Same rule the server applies. */
export const NAME_RE = /^[\p{L}\p{N} _.-]{1,16}$/u;

async function call(init) {
  const r = await fetch(API + '/scores', init);
  if (!r.ok) throw new Error('leaderboard ' + r.status);
  return r.json();
}
const send = (method, data) => call({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

/** Top 50: [{ name, score, time }]. */
export const fetchTop = () => call();

/** Sends a finished run; resolves to { rank } of the player's best run. */
export function submitScore(score, time, merges) {
  if (!save.pid) {
    save.pid = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    persist();
  }
  return send('POST', { id: save.pid, name: save.name, score, time, merges });
}

/** Erases this player's entry on the server, then forgets the id and nickname locally. */
export async function deleteScore() {
  await send('DELETE', { id: save.pid });
  save.pid = ''; save.name = ''; persist();
}
