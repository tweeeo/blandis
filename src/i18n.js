import { save, persist } from './storage.js';

const STR = {
  en: {
    tagline: 'Pick, launch, squish and merge soft numbers.', play: 'Play', settings: 'Settings', help: 'How to play',
    best: 'Best', next: 'NEXT', careful: 'Careful!', pause: 'Paused', resume: 'Resume', restart: 'Restart',
    mainMenu: 'Main menu', over: 'It overflowed!', newBest: 'NEW BEST!', again: 'Play again', back: 'Back',
    styles: 'Styles', ach: 'Achievements', language: 'Language', sound: 'Sound', on: 'On', off: 'Off',
    newStyle: 'New style', style: 'style', supreme: '4096! +8192', soundBtn: 'Sound', menuBtn: 'Menu', time: 'Time', achUnlocked: 'Achievement unlocked!',
    notRecorded: 'Tampering detected: this run was not recorded.',
    helpList: [
      'Up to 3 blobs wait in the tray at the top. Press the one you want to use.',
      'Drag toward where it should go (an arrow shows the shot) and release. The further you drag, the harder it flies.',
      'A short tap drops it gently; a hard shot pushes others and squeezes into gaps.',
      'Two equal numbers that touch merge into their double: 2+2=4, 4+4=8… up to 2048.',
      'Back-to-back merges make a combo and more points.',
      'If any blob stays above the line for 3 seconds, the game ends.',
      'Collect achievements; some of them unlock color styles.',
    ],
  },
  es: {
    tagline: 'Elige, lanza, aplasta y fusiona números blanditos.', play: 'Jugar', settings: 'Ajustes', help: 'Cómo jugar',
    best: 'Récord', next: 'SIGUIENTE', careful: '¡Cuidado!', pause: 'Pausa', resume: 'Continuar', restart: 'Reiniciar',
    mainMenu: 'Menú principal', over: '¡Se desbordó!', newBest: '¡NUEVO RÉCORD!', again: 'Otra vez', back: 'Volver',
    styles: 'Estilos', ach: 'Logros', language: 'Idioma', sound: 'Sonido', on: 'Sí', off: 'No',
    newStyle: 'Nuevo estilo', style: 'estilo', supreme: '¡4096! +8192', soundBtn: 'Sonido', menuBtn: 'Menú', time: 'Tiempo', achUnlocked: '¡Logro desbloqueado!',
    notRecorded: 'Se detectó una manipulación: esta partida no se ha guardado.',
    helpList: [
      'Hasta 3 blandis esperan en la bandeja de arriba. Pulsa el que quieras usar.',
      'Arrastra hacia donde quieras lanzarlo (una flecha marca el tiro) y suelta. Cuanto más arrastras, más fuerte.',
      'Un toque corto lo deja caer suave; un tiro fuerte empuja a los demás y se cuela en huecos.',
      'Dos números iguales que se tocan se fusionan en el doble: 2+2=4, 4+4=8… hasta 2048.',
      'Fusiones seguidas = combo y más puntos.',
      'Si alguno se queda sobre la línea 3 segundos, se acaba.',
      'Colecciona logros; algunos desbloquean estilos de color.',
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
