// Google Analytics, loaded only after the player accepts it (consent banner or Settings).
// Until then nothing is requested from Google and no cookie is set.
import { save, persist } from './storage.js';
import { t } from './i18n.js';

const GA_ID = 'G-Z7C1RMFNLX'; // GA4 measurement id, e.g. 'G-XXXXXXXXXX'. Empty: no analytics and no banner.
export const hasAnalytics = !!GA_ID;
const el = document.getElementById('consent');
let loaded = false;

function load() {
  window[`ga-disable-${GA_ID}`] = false;
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  const gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  // Host-only cookies (not shared with other subdomains); no Google signals or ad personalization.
  gtag('config', GA_ID, { cookie_domain: 'none', allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(s);
}

/** Consent withdrawn: Google's opt-out flag stops further hits, and the _ga cookies are deleted. */
function stop() {
  window[`ga-disable-${GA_ID}`] = true;
  for (const c of document.cookie.split('; ')) {
    const name = c.split('=')[0];
    if (name.startsWith('_ga')) document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

export function setAnalytics(on) {
  save.ga = on; persist();
  el.classList.add('hide');
  if (on) load(); else stop();
}

if (GA_ID) {
  if (save.ga) load();
  else if (save.ga === null) {
    const cookiePage = save.lang === 'es' ? 'legal/cookies-es.html' : 'legal/cookies.html';
    el.innerHTML = `<p>${t('consentText')} <a href="${cookiePage}" target="_blank" rel="noopener">${t('moreInfo')}</a></p>
      <div><button data-v="0">${t('reject')}</button><button data-v="1">${t('accept')}</button></div>`;
    el.onclick = e => { const b = e.target.closest('button'); if (b) setAnalytics(b.dataset.v === '1'); };
    el.classList.remove('hide');
  }
}
