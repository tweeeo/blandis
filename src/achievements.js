import { save, persist } from './storage.js';
import { t, tx } from './i18n.js';
import { THEMES } from './themes.js';
import { sfx } from './audio.js';
import { toast } from './ui/toast.js';

// Each achievement unlocks one color theme.
export const ACHIEVEMENTS = [
  { id: 'first',  icon: '💧', theme: 'sorbete',
    name: { en: 'Plop!', es: '¡Plop!' }, desc: { en: 'Merge two blobs', es: 'Fusiona dos blandis' } },
  { id: 's1000',  icon: '⭐', theme: 'nube',
    name: { en: 'A Thousand Squishes', es: 'Mil mimos' }, desc: { en: 'Score 1000 points in one game', es: 'Consigue 1000 puntos en una partida' } },
  { id: 'gentle', icon: '🪶', theme: 'caramelo',
    name: { en: 'Silk Touch', es: 'Mano de seda' }, desc: { en: '10 gentle launches in a row', es: '10 lanzamientos suaves seguidos' } },
  { id: 'cannon', icon: '💥', theme: 'noche',
    name: { en: 'Cannonball', es: 'Cañonazo' }, desc: { en: 'Merge with a full-power launch', es: 'Fusiona con un lanzamiento a máxima potencia' } },
  { id: 'combo4', icon: '🔗', theme: 'oceano',
    name: { en: 'Squishy Chain', es: 'Cadena blandita' }, desc: { en: 'Make a x4 combo', es: 'Haz un combo x4' } },
  { id: 'lvl7',   icon: '🍮', theme: 'neon',
    name: { en: 'Chonky', es: 'Gordito' }, desc: { en: 'Make a 128', es: 'Consigue un 128' } },
  { id: 'max',    icon: '👑', theme: 'arcoiris',
    name: { en: 'Supreme Blob', es: 'Blandi supremo' }, desc: { en: 'Make a 2048', es: 'Consigue un 2048' } },
];

export const isThemeUnlocked = id =>
  id === 'clasico' || ACHIEVEMENTS.some(a => a.theme === id && save.ach.includes(a.id));

export function unlock(id) {
  if (save.ach.includes(id)) return;
  save.ach.push(id);
  persist();
  const a = ACHIEVEMENTS.find(a => a.id === id);
  toast(`${a.icon} ${tx(a.name)}`, `${t('newStyle')}: ${tx(THEMES[a.theme].name)}`);
  sfx.ach();
}
