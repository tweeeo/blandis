// Overlay menus (start, pause, game over, settings, styles, achievements, help) + top-right buttons.
import { save, persist } from '../storage.js';
import { t, tx, setLang, LANGS, formatTime } from '../i18n.js';
import { THEMES, hsl, setTheme } from '../themes.js';
import { ACHIEVEMENTS, isThemeUnlocked } from '../achievements.js';
import { sfx, unlockAudio } from '../audio.js';

const ICON_PAUSE = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="2" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="2" fill="currentColor"/></svg>';
const ICON_SOUND = on => `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 8h4l5-4v14l-5-4H3z" fill="currentColor"/>${on
  ? '<path d="M15 7.5q3 3.5 0 7M17.5 5q5 6 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
  : '<path d="M15 8l5 6M20 8l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'}</svg>`;

export class Menu {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById('overlay');
    this.card = document.getElementById('card');
    this.btnMute = document.getElementById('bMute');
    this.btnPause = document.getElementById('bPause');
    this.base = 'start';     // screen that "Back" returns to
    this.screen = 'start';

    this.btnPause.innerHTML = ICON_PAUSE;
    this.overlay.addEventListener('click', e => this.onClick(e));
    this.btnPause.onclick = () => { unlockAudio(); sfx.click(); this.togglePause(); };
    this.btnMute.onclick = () => { save.muted = !save.muted; persist(); this.refreshButtons(); unlockAudio(); sfx.click(); };
    game.onOver = () => this.show('over');
    this.refreshButtons();
  }

  refreshButtons() {
    this.btnMute.innerHTML = ICON_SOUND(!save.muted);
    this.btnMute.title = this.btnMute.ariaLabel = t('soundBtn');
    this.btnPause.title = this.btnPause.ariaLabel = t('menuBtn');
  }

  togglePause() {
    const g = this.game;
    if (g.state === 'play') { g.pause(); this.show('pause'); }
    else if (g.state === 'paused') { g.resume(); this.hide(); }
  }

  hide() { this.overlay.classList.add('hide'); }

  show(screen, animate = true) {
    if (['start', 'pause', 'over'].includes(screen)) this.base = screen;
    this.screen = screen;
    this.overlay.classList.remove('hide');
    this.card.innerHTML = this.html(screen);
    if (animate) { this.card.style.animation = 'none'; void this.card.offsetWidth; this.card.style.animation = ''; }
  }

  html(screen) {
    const g = this.game;
    const btn = (a, label, alt = true) => `<button class="big ${alt ? 'alt' : ''}" data-a="${a}">${label}</button>`;
    const opt = (a, v, on, label) => `<button class="opt ${on ? 'on' : ''}" data-a="${a}" data-v="${v}">${label}</button>`;
    const best = `<p class="sub">${t('best')}: <b>${save.best}</b></p>`;
    const back = btn('back', t('back'), false);

    switch (screen) {
      case 'start':
        return `<h1>Blandis</h1><p class="sub">${t('tagline')}</p>
          ${btn('play', t('play'), false)}${btn('settings', t('settings'))}${btn('help', t('help'))}
          ${save.best ? best : ''}`;
      case 'pause':
        return `<h2>${t('pause')}</h2>
          ${btn('resume', t('resume'), false)}${btn('play', t('restart'))}${btn('settings', t('settings'))}
          ${btn('help', t('help'))}${btn('menu', t('mainMenu'))}`;
      case 'over':
        return `<h2>${t('over')}</h2><div class="score">${g.score}</div>
          <p class="sub">${t('time')}: <b>${formatTime(g.time)}</b></p>
          ${g.isNewBest && g.score > 0 ? `<span class="badge">${t('newBest')}</span>` : best}
          <ol>${save.top.map(v => `<li>${v}</li>`).join('')}</ol>
          ${btn('play', t('again'), false)}${btn('menu', t('mainMenu'))}`;
      case 'settings':
        return `<h2>${t('settings')}</h2>
          <div class="row"><b>${t('language')}</b><div>${Object.entries(LANGS).map(([id, name]) => opt('lang', id, save.lang === id, name)).join('')}</div></div>
          <div class="row"><b>${t('sound')}</b><div>${opt('sound', 'on', !save.muted, t('on'))}${opt('sound', 'off', save.muted, t('off'))}</div></div>
          ${btn('styles', t('styles'))}${btn('ach', `${t('ach')} ${save.ach.length}/${ACHIEVEMENTS.length}`)}${back}`;
      case 'styles':
        return `<h2>${t('styles')}</h2><div class="grid">${Object.entries(THEMES).map(([id, th]) => {
          const ok = isThemeUnlocked(id), a = ACHIEVEMENTS.find(a => a.theme === id);
          const dots = [0, 2, 4, 6, 8].map(l => `<i style="background:${hsl(th.col(l, l * 0.4))}"></i>`).join('');
          return `<button class="sw ${save.theme === id ? 'on' : ''}" data-a="theme" data-v="${id}" ${ok ? '' : 'disabled'}
            style="background:linear-gradient(${th.bg[0]},${th.bg[1]});color:${th.ink}">
            <div class="dots">${dots}</div>${ok ? '' : '🔒 '}${tx(th.name)}${ok || !a ? '' : `<small>${tx(a.desc)}</small>`}</button>`;
        }).join('')}</div>${back}`;
      case 'ach':
        return `<h2>${t('ach')}</h2>${ACHIEVEMENTS.map(a => {
          const ok = save.ach.includes(a.id);
          return `<div class="ach ${ok ? '' : 'lock'}"><div class="ic">${ok ? a.icon : '🔒'}</div>
            <div><b>${tx(a.name)}</b><span>${tx(a.desc)} · ${t('style')} ${tx(THEMES[a.theme].name)}</span></div></div>`;
        }).join('')}${back}`;
      case 'help':
        return `<h2>${t('help')}</h2><ul class="help">${t('helpList').map(s => `<li>${s}</li>`).join('')}</ul>${back}`;
    }
    return '';
  }

  onClick(e) {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    unlockAudio(); sfx.click();
    const g = this.game, a = el.dataset.a, v = el.dataset.v;
    switch (a) {
      case 'play': g.start(); this.hide(); break;
      case 'resume': g.resume(); this.hide(); break;
      case 'menu': g.attract(); this.show('start'); break;
      case 'back': this.show(this.screen === 'styles' || this.screen === 'ach' ? 'settings' : this.base); break;
      case 'lang': setLang(v); this.refreshButtons(); this.show('settings', false); break;
      case 'sound': save.muted = v === 'off'; persist(); this.refreshButtons(); this.show('settings', false); break;
      case 'theme': setTheme(v); this.show('styles', false); break;
      default: this.show(a);
    }
  }
}
