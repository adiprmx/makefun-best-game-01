# makefun-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/adiprmx/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/adiprmx/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Starforge — an original 2D canvas game for make.fun's best-game-01 bounty. Slide a celestial crucible along the bottom of a night sky and catch falling star shards in the order the constellation on the wall asks for. Correct catches feed the forge's heat (and the score multiplier); a wrong colour is slag and costs a life. Moonstones restore a life, comets pay a bonus. Forge all seven constellations to become Master Smith. Title, pause, game-over and win screens, a live HUD, and WebAudio sound synthesized in code — no files, no network, no build step.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Move with ← → or A/D, or the mouse. Space starts, P pauses, R restarts, M mutes.

## Files

- `game/` — the playable game as static files (`index.html` + ES modules under `src/`)
- `game/src/` — `config.js` (tuning), `random.js` (seeded RNG), `patterns.js` (constellation catalogue), `audio.js` (WebAudio synth), `world.js` (rules), `render.js` (all drawing), `input.js` (keyboard + mouse), `shots.js` (deterministic screenshot scenes), `main.js` (boot + loop)
- `screenshots/` — the start, play and end screens, rendered from the game's own code
- `main.ts` — the entry program: copies `game/` + `screenshots/` and writes `dossier.json`
- `serve.ts` — a tiny static server for local play
- `vendor/makefun-game.ts` — make.fun's dossier library, unchanged
- `LICENSE` — MIT

---

<sub>Entered on [make.fun](https://make.fun/?ref=1c6jcmp6&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
