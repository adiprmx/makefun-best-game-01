// The constellations the forge is asked to build. Each one is a name, the
// sequence of shard colours it is forged from (in order), and the shape its
// stars make in the order display (coordinates in a 200 x 64 box, one star
// per colour, drawn in sequence order). Longer sequences arrive at higher
// levels, so the orders get harder as the forge gets hotter.
export const PATTERNS = [
  {
    name: 'The Fox',
    seq: ['ember', 'gold', 'azure'],
    stars: [[24, 40], [100, 16], [176, 44]],
  },
  {
    name: 'The Seed',
    seq: ['verdant', 'gold', 'ember'],
    stars: [[30, 18], [100, 48], [170, 20]],
  },
  {
    name: 'The Wave',
    seq: ['azure', 'gold', 'verdant'],
    stars: [[22, 46], [96, 20], [178, 38]],
  },
  {
    name: 'The Lyre',
    seq: ['gold', 'azure', 'verdant', 'gold'],
    stars: [[22, 44], [72, 18], [128, 46], [178, 20]],
  },
  {
    name: 'The Anchor',
    seq: ['azure', 'verdant', 'ember', 'gold'],
    stars: [[26, 18], [76, 46], [126, 16], [176, 42]],
  },
  {
    name: 'The Moth',
    seq: ['verdant', 'ember', 'ember', 'azure'],
    stars: [[24, 42], [76, 16], [124, 44], [176, 20]],
  },
  {
    name: 'The Kite',
    seq: ['gold', 'ember', 'verdant', 'azure'],
    stars: [[28, 20], [78, 46], [128, 18], [176, 44]],
  },
  {
    name: 'The Lantern',
    seq: ['gold', 'gold', 'ember', 'azure', 'verdant'],
    stars: [[20, 40], [60, 18], [100, 46], [140, 16], [180, 40]],
  },
  {
    name: 'The River',
    seq: ['azure', 'azure', 'gold', 'verdant', 'ember'],
    stars: [[22, 18], [62, 44], [100, 18], [140, 46], [180, 20]],
  },
  {
    name: 'The Comet',
    seq: ['gold', 'azure', 'azure', 'ember', 'verdant'],
    stars: [[20, 44], [62, 16], [100, 40], [140, 18], [180, 44]],
  },
  {
    name: 'The Crown',
    seq: ['ember', 'gold', 'verdant', 'azure', 'gold', 'ember'],
    stars: [[18, 42], [52, 16], [86, 46], [120, 16], [154, 44], [186, 20]],
  },
  {
    name: 'The Phoenix',
    seq: ['ember', 'ember', 'gold', 'azure', 'verdant', 'gold'],
    stars: [[18, 20], [52, 46], [86, 16], [120, 44], [154, 18], [186, 42]],
  },
  {
    name: 'The Loom',
    seq: ['verdant', 'azure', 'gold', 'ember', 'gold', 'azure'],
    stars: [[18, 44], [52, 18], [86, 44], [120, 18], [154, 46], [186, 20]],
  },
];

/** The sequence length a level asks for: 3, 4, 5, then 6 from level 4 on. */
export function lengthForLevel(level) {
  return Math.min(2 + level, 6);
}

/** Pick a pattern of the level's length, never the one just forged. */
export function pickPattern(random, level, previousName) {
  const want = lengthForLevel(level);
  const pool = PATTERNS.filter((p) => p.seq.length === want && p.name !== previousName);
  return random.pick(pool.length > 0 ? pool : PATTERNS.filter((p) => p.seq.length === want));
}
