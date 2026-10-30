import { save, persist } from './storage.js';

const STR = {
  en: {
    tagline: 'Launch, squish and merge soft numbers.', play: 'Play', settings: 'Settings', help: 'How to play',
    best: 'Best', next: 'NEXT', careful: 'Careful!', pause: 'Paused', resume: 'Resume', restart: 'Restart',
    mainMenu: 'Main menu', over: 'It overflowed!', newBest: 'NEW BEST!', again: 'Play again', back: 'Back',
    styles: 'Styles', ach: 'Achievements', language: 'Language', sound: 'Sound', on: 'On', off: 'Off',
    newStyle: 'New style', style: 'style', supreme: '4096! +8192', soundBtn: 'Sound', menuBtn: 'Menu', time: 'Time',
    helpList: [
      'Drag toward where you want to launch and release; the further you drag, the harder it goes.',
      'Quick tap: drop the number gently.',
      'Launch softly to place it without disturbing others; hard to push and squeeze into gaps.',
      'Two equal numbers that touch merge into their double: 2+2=4, 4+4=8… up to 2048.',
      'Back-to-back merges make a combo and more points.',
      'If any blob stays above the line for 3 seconds, the game ends.',
      'Each achievement unlocks a color style.',
    ],
  },
  es: {
    tagline: 'Lanza, aplasta y fusiona números blanditos.', play: 'Jugar', settings: 'Ajustes', help: 'Cómo jugar',
    best: 'Récord', next: 'SIGUIENTE', careful: '¡Cuidado!', pause: 'Pausa', resume: 'Continuar', restart: 'Reiniciar',
    mainMenu: 'Menú principal', over: '¡Se desbordó!', newBest: '¡NUEVO RÉCORD!', again: 'Otra vez', back: 'Volver',
    styles: 'Estilos', ach: 'Logros', language: 'Idioma', sound: 'Sonido', on: 'Sí', off: 'No',
    newStyle: 'Nuevo estilo', style: 'estilo', supreme: '¡4096! +8192', soundBtn: 'Sonido', menuBtn: 'Menú', time: 'Tiempo',
    helpList: [
      'Arrastra hacia donde quieras lanzar y suelta; cuanto más arrastras, más fuerte.',
      'Toque corto: deja caer el número suavemente.',
      'Lanza suave para colocar sin molestar; fuerte para empujar y colarte en huecos.',
      'Dos números iguales que se tocan se fusionan en el doble: 2+2=4, 4+4=8… hasta 2048.',
      'Fusiones seguidas = combo y más puntos.',
      'Si alguno se queda sobre la línea 3 segundos, se acaba.',
      'Cada logro desbloquea un estilo de color.',
    ],
  },
};

export const LANGS = { en: 'English', es: 'Español' };

/** UI string by key. */
export const t = key => STR[save.lang][key];
/** Pick the current language from an inline `{ en, es }` object. */
export const tx = obj => obj[save.lang];
/** Seconds -> "m:ss". */
export const formatTime = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function setLang(lang) {
  save.lang = lang;
  document.documentElement.lang = lang;
  persist();
}
document.documentElement.lang = save.lang;
