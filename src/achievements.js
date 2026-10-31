import { save, persist } from './storage.js';
import { t, tx } from './i18n.js';
import { THEMES } from './themes.js';
import { sfx } from './audio.js';
import { toast } from './ui/toast.js';

// `test(c)` gets a snapshot from Game#context():
//   score, time, maxLevel, maxCombo, merges, launches, hardLaunches, gentleRun, blobs,
//   flags { cannon, bank, feather, closeCall, supreme }, life { games, merges, launches, playTime }
// Achievements with a `theme` unlock that color style. Ones without `test` are unlocked directly.
const A = (id, icon, en, es, den, des, test, theme) => ({ id, icon, name: { en, es }, desc: { en: den, es: des }, test, theme });

export const ACHIEVEMENTS = [
  // Merging up
  A('first', '💧', 'Plop!', '¡Plop!', 'Merge two blobs', 'Fusiona dos blandis', c => c.merges >= 1, 'sorbete'),
  A('m64', '🟢', 'Getting Bigger', 'Creciendo', 'Make a 64', 'Consigue un 64', c => c.maxLevel >= 5),
  A('lvl7', '🍮', 'Chonky', 'Gordito', 'Make a 128', 'Consigue un 128', c => c.maxLevel >= 6, 'neon'),
  A('m256', '🍩', 'Donut Size', 'Tamaño donut', 'Make a 256', 'Consigue un 256', c => c.maxLevel >= 7),
  A('m512', '🎈', 'Halfway There', 'A mitad de camino', 'Make a 512', 'Consigue un 512', c => c.maxLevel >= 8),
  A('m1024', '🏔️', 'Kiloblob', 'Kiloblandi', 'Make a 1024', 'Consigue un 1024', c => c.maxLevel >= 9),
  A('max', '👑', 'Supreme Blob', 'Blandi supremo', 'Make a 2048', 'Consigue un 2048', c => c.maxLevel >= 10, 'arcoiris'),
  A('supreme', '🌌', 'Big Bang', 'Big Bang', 'Merge two 2048s', 'Fusiona dos 2048', c => c.flags.supreme),
  // Score
  A('s1000', '⭐', 'A Thousand Squishes', 'Mil mimos', 'Score 1,000 in one game', 'Consigue 1.000 puntos en una partida', c => c.score >= 1000, 'nube'),
  A('s10k', '🌟', 'Ten Grand', 'Diez mil', 'Score 10,000 in one game', 'Consigue 10.000 puntos en una partida', c => c.score >= 10000),
  A('s50k', '💫', 'High Roller', 'Por todo lo alto', 'Score 50,000 in one game', 'Consigue 50.000 puntos en una partida', c => c.score >= 50000),
  A('s100k', '🏆', 'Six Digits', 'Seis cifras', 'Score 100,000 in one game', 'Consigue 100.000 puntos en una partida', c => c.score >= 100000),
  // Combos
  A('combo3', '🔁', 'Hat Trick', 'Triplete', 'Make a x3 combo', 'Haz un combo x3', c => c.maxCombo >= 3),
  A('combo4', '🔗', 'Squishy Chain', 'Cadena blandita', 'Make a x4 combo', 'Haz un combo x4', c => c.maxCombo >= 4, 'oceano'),
  A('combo6', '⛓️', 'Chain Reaction', 'Reacción en cadena', 'Make a x6 combo', 'Haz un combo x6', c => c.maxCombo >= 6),
  // Skill shots
  A('gentle', '🪶', 'Silk Touch', 'Mano de seda', '10 gentle launches in a row', '10 lanzamientos suaves seguidos', c => c.gentleRun >= 10, 'caramelo'),
  A('cannon', '💥', 'Cannonball', 'Cañonazo', 'Merge with a full-power launch', 'Fusiona con un lanzamiento a máxima potencia', c => c.flags.cannon, 'noche'),
  A('bank', '🎱', 'Bank Shot', 'Carambola', 'Bounce off a wall and merge', 'Rebota en una pared y fusiona', c => c.flags.bank),
  A('feather', '🍃', 'Featherfall', 'Caída de pluma', 'Merge with a tapped drop', 'Fusiona con un toque suave', c => c.flags.feather),
  A('zen', '🧘', 'Zen Master', 'Maestro zen', 'Score 1,000 without a strong launch', 'Consigue 1.000 puntos sin ningún lanzamiento fuerte', c => c.score >= 1000 && c.hardLaunches === 0),
  A('fast256', '⚡', 'Speedrun', 'Speedrun', 'Make a 256 in under 2 minutes', 'Consigue un 256 en menos de 2 minutos', c => c.maxLevel >= 7 && c.time < 120),
  // Survival
  A('close', '😅', 'Close Call', 'Por los pelos', 'Escape the danger line with under half a second left', 'Sal de la línea de peligro con menos de medio segundo', c => c.flags.closeCall),
  A('t3', '⏱️', 'Hang In There', 'Aguanta', 'Survive 3 minutes', 'Sobrevive 3 minutos', c => c.time >= 180),
  A('t10', '🕰️', 'Marathon', 'Maratón', 'Survive 10 minutes', 'Sobrevive 10 minutos', c => c.time >= 600),
  A('crowd', '🫧', 'Full House', 'Casa llena', 'Have 20 blobs in the jar at once', 'Ten 20 blandis a la vez en el bote', c => c.blobs >= 20),
  // Lifetime
  A('games10', '🎮', 'Regular', 'Habitual', 'Play 10 games', 'Juega 10 partidas', c => c.life.games >= 10),
  A('games50', '🕹️', 'Hooked', 'Enganchado', 'Play 50 games', 'Juega 50 partidas', c => c.life.games >= 50),
  A('merges500', '🫠', 'Squish Lover', 'Amante blandito', 'Merge 500 times in total', 'Fusiona 500 veces en total', c => c.life.merges >= 500),
  A('merges5k', '🌋', 'Squish Legend', 'Leyenda blandita', 'Merge 5,000 times in total', 'Fusiona 5.000 veces en total', c => c.life.merges >= 5000),
  A('launch1k', '🚀', 'Launch Pad', 'Plataforma de lanzamiento', 'Launch 1,000 blobs in total', 'Lanza 1.000 blandis en total', c => c.life.launches >= 1000),
  A('hour', '⌛', 'One Hour In', 'Una hora dentro', 'Play for 1 hour in total', 'Juega 1 hora en total', c => c.life.playTime >= 3600),
  // Extras
  A('polyglot', '🌍', 'Polyglot', 'Políglota', 'Change the language', 'Cambia el idioma'),
  A('fashion', '🎨', 'Fashionista', 'Con estilo', 'Switch to another color style', 'Cambia a otro estilo de color'),
  A('wallpaper', '🖼️', 'Interior Designer', 'Decorador de interiores', 'Set a custom background', 'Pon un fondo personalizado'),
  A('collector', '📦', 'Collector', 'Coleccionista', 'Unlock 20 achievements', 'Desbloquea 20 logros'),
  A('complete', '💎', 'Completionist', 'Completista', 'Unlock every other achievement', 'Desbloquea todos los demás logros'),
];

export const isThemeUnlocked = id =>
  id === 'clasico' || ACHIEVEMENTS.some(a => a.theme === id && save.ach.includes(a.id));

export const unlockedCount = () => save.ach.length;

export function unlock(id) {
  if (save.ach.includes(id)) return;
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (!a) return;
  save.ach.push(id);
  persist();
  toast(`${a.icon} ${tx(a.name)}`, a.theme ? `${t('newStyle')}: ${tx(THEMES[a.theme].name)}` : t('achUnlocked'));
  sfx.ach();
  if (save.ach.length >= 20) unlock('collector');
  if (save.ach.length === ACHIEVEMENTS.length - 1) unlock('complete');
}

/** Unlock every achievement whose test passes for this snapshot. */
export function checkAchievements(c) {
  for (const a of ACHIEVEMENTS) if (a.test && !save.ach.includes(a.id) && a.test(c)) unlock(a.id);
}
