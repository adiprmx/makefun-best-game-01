// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot (chase the lowest shard the forge wants next, keep clear
// of the wrong colours), so the frame is what a short game really looks like
// and the same seed always gives the same frame.
import { CRUCIBLE, FIELD, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 22;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;
/** How far ahead the autopilot looks: the play scene sees well and keeps its
 *  lives; the end scene looks only a moment ahead, so it is caught out once
 *  the shards speed up, as a hurried player is. */
const HORIZON_PLAY = 0.9;
const HORIZON_END = 0.22;
const MARGIN = 14;

function timeToHit(state, direction, horizon) {
  const bowlY = CRUCIBLE.y;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = Math.min(
      FIELD.width - CRUCIBLE.width / 2,
      Math.max(CRUCIBLE.width / 2, state.crucibleX + direction * CRUCIBLE.keyboardSpeed * t),
    );
    for (const s of state.shards) {
      if (s.kind !== 'shard') continue;
      const want = state.pattern.seq[state.patternIndex];
      if (s.color === want) continue;
      const y = s.y + s.vy * t;
      if (
        y > bowlY - 8 &&
        y < bowlY + 16 &&
        Math.abs(s.x - x) < CRUCIBLE.width / 2 + MARGIN
      ) {
        return t;
      }
    }
  }
  return Infinity;
}

function autopilot(state, horizon) {
  // The lowest shard the forge wants next (moonstones and comets are always
  // worth catching too); else the centre of the field.
  let target = null;
  for (const s of state.shards) {
    const good =
      s.kind !== 'shard' || s.color === state.pattern.seq[state.patternIndex];
    if (!good) continue;
    if (target === null || s.y > target.y) target = s;
  }
  const centre = state.crucibleX;
  const wantedX = target === null ? FIELD.width / 2 : target.x;
  const wanted = wantedX > centre + 10 ? 1 : wantedX < centre - 10 ? -1 : 0;
  let best = wanted;
  let bestTime = timeToHit(state, wanted, horizon);
  for (const dir of [0, -1, 1]) {
    if (bestTime === Infinity) break;
    const time = timeToHit(state, dir, horizon);
    if (time > bestTime) {
      bestTime = time;
      best = dir;
    }
  }
  return best;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, 0, false, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  for (let i = 0; i < limit / STEP; i += 1) {
    const events = world.step(STEP, autopilot(world.state, horizon), false);
    if (events & (EVENT_OVER | EVENT_WIN)) break;
  }
  if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
  if (world.state.over) return { screen: SCREEN_OVER, best: world.state.score };
  return { screen: SCREEN_PLAY, best: world.state.score };
}
