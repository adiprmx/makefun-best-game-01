// Starforge: keyboard and mouse (and touch) input. The loop polls held keys
// every frame; confirm / pause / restart / mute are edge events the loop
// consumes once. The mouse sets a target the crucible chases; a click counts
// as a confirm, so the whole game is playable with one hand on the mouse.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

export function createInput(canvas, toFieldX) {
  const held = new Set();
  const queue = [];
  let mouseTarget = null;

  function key(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  function onKeyDown(e) {
    const k = key(e);
    if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (k === ' ' || k === 'enter') queue.push(ACTION_CONFIRM);
    else if (k === 'p' || k === 'escape') queue.push(ACTION_PAUSE);
    else if (k === 'r') queue.push(ACTION_RESTART);
    else if (k === 'm') queue.push(ACTION_MUTE);
    else held.add(k);
  }

  function onKeyUp(e) {
    held.delete(key(e));
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseTarget = toFieldX(e.clientX - rect.left, rect.width);
  }

  function onMouseDown(e) {
    onMouseMove(e);
    queue.push(ACTION_CONFIRM);
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      mouseTarget = toFieldX(e.touches[0].clientX - rect.left, rect.width);
      e.preventDefault();
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchstart', onTouchMove, { passive: false });

  return {
    /** -1, 0 or 1 from the held movement keys. */
    steer() {
      const left = held.has('arrowleft') || held.has('a');
      const right = held.has('arrowright') || held.has('d');
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    },
    /** The mouse's target x in field coordinates, or null when untouched. */
    mouseX() {
      return mouseTarget;
    },
    /** Take and clear one queued edge action, or null. */
    take() {
      return queue.length > 0 ? queue.shift() : null;
    },
    drain() {
      queue.length = 0;
      mouseTarget = null;
    },
  };
}

/** Map a canvas CSS x into the 960-wide field, through the letterbox. */
export function makeFieldMapper(canvas) {
  return (cssX, cssWidth) => {
    const scale = Math.min(cssWidth / FIELD.width, (canvas.clientHeight || FIELD.height) / FIELD.height);
    const ox = (cssWidth - FIELD.width * scale) / 2;
    return (cssX - ox) / scale;
  };
}
