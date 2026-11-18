// Starforge: the numbers that tune the game. One place, so the whole balance
// (fall speed, spawn rate, heat, points) can be read and changed here.
export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;
export const BEST_KEY = 'starforge.best';
export const LIVES = 3;
export const WIN_CONSTELLATIONS = 7;

export const CRUCIBLE = {
  width: 120,
  height: 26,
  y: 540,
  keyboardSpeed: 430,
  mouseSpeed: 950,
};

// The four shard colours. Each has a name, a canvas colour, a glow colour and a
// pitch (a pentatonic ladder, so a correct catch always sounds musical).
export const COLORS = {
  ember: { name: 'Ember', fill: '#ff5a3c', glow: '#ff8a5c', pitch: 261.63 },
  gold: { name: 'Gold', fill: '#ffc93c', glow: '#ffe27a', pitch: 293.66 },
  azure: { name: 'Azure', fill: '#4aa8ff', glow: '#8ec8ff', pitch: 329.63 },
  verdant: { name: 'Verdant', fill: '#4ade80', glow: '#8df0ae', pitch: 392.0 },
};
export const COLOR_KEYS = ['ember', 'gold', 'azure', 'verdant'];

export const SHARD = {
  radius: 13,
  baseSpeed: 128,
  speedPerLevel: 15,
  wobbleAmp: 18,
  wobbleFreq: 1.3,
};

export const SPAWN = {
  baseInterval: 0.85,
  perLevel: 0.93,
  minInterval: 0.42,
  moonstoneChance: 0.045,
  cometChance: 0.03,
};

export const HEAT = {
  max: 100,
  correct: 8,
  constellation: 15,
  moonstone: 10,
  comet: 5,
  wrong: -25,
  missed: -6,
  decayPerSecond: 2.2,
};

export const POINTS = {
  correct: 10,
  constellationBase: 100,
  moonstone: 25,
  comet: 50,
};

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  PAUSED: 'paused',
  OVER: 'over',
  WIN: 'win',
};
