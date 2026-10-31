// Tells the player when a newer version has been deployed (production build only: the
// workflow defines __VERSION__ and publishes the same id in version.txt).
import { t } from './i18n.js';

const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : null;
const CHECK_MS = 5 * 60 * 1000;
const el = document.getElementById('update');

async function check() {
  try {
    const r = await fetch('version.txt', { cache: 'no-store' });
    const v = r.ok ? (await r.text()).trim() : '';
    if (!v || v === VERSION) return;
    el.innerHTML = `${t('newVersion')} <button>${t('update')}</button>`;
    el.querySelector('button').onclick = () => location.reload();
    el.classList.remove('hide');
  } catch (e) { /* offline */ }
}

if (VERSION) {
  setInterval(check, CHECK_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
