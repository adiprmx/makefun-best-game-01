// Starforge: boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between five
// screens: title, play, paused, game over and win.
//
// ?seed=N fixes the falling pattern. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, COLORS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_COMET, EVENT_LEVEL, EVENT_MOON, EVENT_OVER, EVENT_WIN, EVENT_WRONG } from './world.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
  makeFieldMapper,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas, createRandom(seed + 7919));
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.multiplier());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, makeFieldMapper(canvas));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each catch.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    input.drain();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce(`Playing. Catch the colours in order to forge ${world.state.pattern.name}.`);
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(
      won
        ? `Master Smith. Score ${world.state.score}. Best ${best}.`
        : `Game over. Score ${world.state.score}. Best ${best}.`,
    );
  }

  function handleEvents(events) {
    const state = world.state;
    if (events & EVENT_WRONG) {
      audio.wrong();
      announce(`Slag. ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left.`);
    }
    if (events & EVENT_MOON) audio.moonstone();
    if (events & EVENT_COMET) audio.comet();
    if (events & EVENT_LEVEL) {
      audio.complete();
      announce(`${state.pattern.name} forged. Level ${state.level}.`);
    } else if (events & 1) {
      const want = state.pattern.seq[state.patternIndex - 1];
      if (want) audio.caught(COLORS[want].pitch);
    }
    if (events & EVENT_WIN) {
      audio.win();
      endGame(true);
    } else if (events & EVENT_OVER) {
      endGame(false);
    }
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    // Edge actions first: confirm, pause, restart, mute.
    let action;
    while ((action = input.take()) !== null) {
      if (action === ACTION_MUTE) {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
      } else if (action === ACTION_RESTART) {
        if (screen !== SCREEN_TITLE) startGame();
      } else if (action === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          announce('Playing.');
        }
      } else if (action === ACTION_CONFIRM) {
        audio.unlock();
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      }
    }
    if (screen === SCREEN_PLAY) {
      // The mouse sets a target the crucible chases; the keys steer directly.
      const target = input.mouseX();
      const steer = input.steer();
      const move = steer !== 0 ? steer : target !== null ? { target } : 0;
      accumulator += elapsed;
      while (accumulator >= STEP) {
        const events = world.step(STEP, move, false);
        handleEvents(events);
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    } else {
      // The title screen idles the sky behind it; the end screens freeze.
      if (screen === SCREEN_TITLE) world.step(STEP, 0, false, true);
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, world.multiplier());
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
