// Starforge: the world and its rules. A fresh world holds a crucible, falling
// star shards, the constellation on order, and the forge's heat. Every frame
// is one fixed step: shards fall and wobble, the crucible slides, catches are
// judged, heat cools. Events are a bitmask the loop reads after each step.
import {
  COLOR_KEYS,
  COLORS,
  CRUCIBLE,
  FIELD,
  HEAT,
  LIVES,
  POINTS,
  SHARD,
  SPAWN,
  WIN_CONSTELLATIONS,
} from './config.js';
import { lengthForLevel, pickPattern } from './patterns.js';

export const EVENT_CAUGHT = 1;
export const EVENT_WRONG = 2;
export const EVENT_MISSED = 4;
export const EVENT_LEVEL = 8;
export const EVENT_OVER = 16;
export const EVENT_WIN = 32;
export const EVENT_MOON = 64;
export const EVENT_COMET = 128;

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      time: 0,
      crucibleX: FIELD.width / 2,
      shards: [],
      particles: [],
      popups: [],
      pattern: pickPattern(random, 1, ''),
      patternIndex: 0,
      level: 1,
      constellations: 0,
      score: 0,
      lives: LIVES,
      heat: 45,
      combo: 0,
      bestCombo: 0,
      spawnIn: 0.6,
      shake: 0,
      over: false,
      won: false,
    };
  }

  function reset() {
    const keep = state;
    Object.assign(keep, freshState());
  }

  function multiplier() {
    return 1 + state.heat / 50;
  }

  function spawnShard() {
    const roll = random.next();
    let kind = 'shard';
    let color = random.pick(COLOR_KEYS);
    if (roll < SPAWN.moonstoneChance) {
      kind = 'moonstone';
      color = null;
    } else if (roll < SPAWN.moonstoneChance + SPAWN.cometChance) {
      kind = 'comet';
      color = null;
    }
    const speed = SHARD.baseSpeed + SHARD.speedPerLevel * (state.level - 1);
    state.shards.push({
      kind,
      color,
      x: random.range(40, FIELD.width - 40),
      y: -24,
      vy: speed * random.range(0.9, 1.15),
      phase: random.range(0, Math.PI * 2),
      wobble: random.range(0.6, 1.4),
      spin: random.range(-1.2, 1.2),
      angle: 0,
      r: kind === 'moonstone' ? 15 : SHARD.radius,
    });
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.3, speed);
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: random.range(0.4, 0.9),
        maxLife: 0.9,
        color,
        size: random.range(2, 5),
      });
    }
  }

  function popup(x, y, text, color) {
    state.popups.push({ x, y, text, color, life: 1.1 });
  }

  function nextPattern() {
    const previous = state.pattern.name;
    state.pattern = pickPattern(random, state.level, previous);
    state.patternIndex = 0;
  }

  function forgeShard(shard) {
    const want = state.pattern.seq[state.patternIndex];
    if (shard.kind === 'moonstone') {
      state.lives = Math.min(LIVES, state.lives + 1);
      state.heat = Math.min(HEAT.max, state.heat + HEAT.moonstone);
      state.score += POINTS.moonstone;
      burst(shard.x, shard.y, '#e8ecff', 18, 160);
      popup(shard.x, shard.y - 20, '+1 LIFE', '#e8ecff');
      return EVENT_MOON;
    }
    if (shard.kind === 'comet') {
      const gain = Math.round(POINTS.comet * multiplier());
      state.score += gain;
      state.heat = Math.min(HEAT.max, state.heat + HEAT.comet);
      burst(shard.x, shard.y, '#fff7ae', 22, 220);
      popup(shard.x, shard.y - 20, `+${gain}`, '#fff7ae');
      return EVENT_COMET;
    }
    if (shard.color === want) {
      const gain = Math.round(POINTS.correct * multiplier());
      state.score += gain;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.heat = Math.min(HEAT.max, state.heat + HEAT.correct);
      state.patternIndex += 1;
      burst(shard.x, shard.y, COLORS[shard.color].fill, 14, 150);
      popup(shard.x, shard.y - 20, `+${gain}`, COLORS[shard.color].fill);
      if (state.patternIndex >= state.pattern.seq.length) {
        const bonus = Math.round(POINTS.constellationBase * state.level * multiplier());
        state.score += bonus;
        state.constellations += 1;
        state.heat = Math.min(HEAT.max, state.heat + HEAT.constellation);
        burst(state.crucibleX, CRUCIBLE.y - 30, '#ffd76a', 40, 260);
        popup(FIELD.width / 2, 210, `${state.pattern.name} FORGED  +${bonus}`, '#ffd76a');
        if (state.constellations >= WIN_CONSTELLATIONS) {
          state.won = true;
          return EVENT_LEVEL | EVENT_WIN;
        }
        state.level += 1;
        nextPattern();
        return EVENT_CAUGHT | EVENT_LEVEL;
      }
      return EVENT_CAUGHT;
    }
    // Wrong colour in the bowl: slag. A life, a chunk of heat, the combo.
    state.lives -= 1;
    state.combo = 0;
    state.heat = Math.max(0, state.heat + HEAT.wrong);
    state.shake = 0.35;
    burst(shard.x, shard.y, '#8a8f9e', 16, 130);
    popup(shard.x, shard.y - 20, 'SLAG!', '#ff8a7a');
    if (state.lives <= 0) {
      state.over = true;
      return EVENT_WRONG | EVENT_OVER;
    }
    return EVENT_WRONG;
  }

  // step(dt, move, paused, attract): `move` is -1/0/1 from the keys, or
  // { target: x } for the mouse chase. In attract mode (the title screen)
  // shards burst harmlessly in the bowl and nothing scores or costs a life.
  function step(dt, move, paused, attract = false) {
    if (paused || state.over || state.won) return 0;
    state.time += dt;
    let events = 0;

    // The crucible slides: keyboard steers, the mouse sets a target it chases.
    if (move !== null && typeof move === 'object' && typeof move.target === 'number') {
      const dx = move.target - state.crucibleX;
      const maxStep = CRUCIBLE.mouseSpeed * dt;
      state.crucibleX += Math.abs(dx) <= maxStep ? dx : Math.sign(dx) * maxStep;
    } else if (move !== null && typeof move === 'number') {
      const dir = Math.sign(move);
      state.crucibleX += dir * CRUCIBLE.keyboardSpeed * dt;
    }
    state.crucibleX = Math.max(
      CRUCIBLE.width / 2,
      Math.min(FIELD.width - CRUCIBLE.width / 2, state.crucibleX),
    );

    // Spawn: the sky keeps throwing shards, faster as the levels rise.
    const interval = Math.max(SPAWN.minInterval, SPAWN.baseInterval * Math.pow(SPAWN.perLevel, state.level - 1));
    state.spawnIn -= dt;
    const cap = 6 + state.level;
    if (state.spawnIn <= 0 && state.shards.length < cap) {
      spawnShard();
      state.spawnIn = interval * random.range(0.75, 1.25);
    }

    // Heat always cools a little: the forge must be fed.
    state.heat = Math.max(0, state.heat - HEAT.decayPerSecond * dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);

    const bowlTop = CRUCIBLE.y - 8;
    const bowlBottom = CRUCIBLE.y + 16;
    const half = CRUCIBLE.width / 2;
    for (let i = state.shards.length - 1; i >= 0; i -= 1) {
      const s = state.shards[i];
      s.y += s.vy * dt;
      s.x += Math.sin(state.time * SHARD.wobbleFreq * s.wobble + s.phase) * SHARD.wobbleAmp * dt;
      s.angle += s.spin * dt;
      const inBowl =
        s.y > bowlTop && s.y < bowlBottom && Math.abs(s.x - state.crucibleX) < half + s.r * 0.4;
      if (inBowl) {
        state.shards.splice(i, 1);
        if (attract) {
          burst(s.x, s.y, s.kind === 'shard' ? COLORS[s.color].fill : '#e8ecff', 8, 110);
        } else {
          events |= forgeShard(s);
        }
        continue;
      }
      if (s.y > FIELD.height + 30) {
        state.shards.splice(i, 1);
        // Letting the colour the forge needs slip past cools the forge and
        // breaks the combo; other colours falling away cost nothing.
        if (!attract && s.kind === 'shard' && s.color === state.pattern.seq[state.patternIndex]) {
          state.combo = 0;
          state.heat = Math.max(0, state.heat + HEAT.missed);
          events |= EVENT_MISSED;
        }
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      const p = state.popups[i];
      p.y -= 34 * dt;
      p.life -= dt;
      if (p.life <= 0) state.popups.splice(i, 1);
    }
    return events;
  }

  return {
    state,
    reset,
    step,
    multiplier,
    patternLength: () => lengthForLevel(state.level),
  };
}
