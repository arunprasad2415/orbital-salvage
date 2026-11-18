# orbital-salvage

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arunprasad2415/orbital-salvage/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arunprasad2415/orbital-salvage/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Orbital Salvage** is a 2D arcade game that runs in a desktop browser from its own static
files, with no build step and no network request. You fly a salvage tug in a decaying
orbit, collecting fuel cells while drifting rocks and hunter drones try to end the run.
Clear five salvage windows and the tug makes the yard.

## Play

```bash
node serve.ts          # then open http://localhost:8080
```

Or open `game/index.html` from any static file server.

- **WASD or arrows** to fly
- **mouse** to aim, **click or space** to fire
- fly into the green cells to refill your orbit

## What is in the box

| path | what it does |
|---|---|
| `game/index.html` | the canvas and the one module script it loads |
| `game/src/main.js` | state machine, collisions, scoring, frame loop |
| `game/src/entities.js` | the tug, shots, rocks, drones and fuel cells |
| `game/src/waves.js` | wave composition and the spawn queue |
| `game/src/render.js` | every shape and the parallax backdrop |
| `game/src/screens.js` | HUD, title, win and loss screens |
| `game/src/audio.js` | WebAudio blips, generated, no sound files |
| `game/src/input.js` | keyboard and mouse |
| `game/src/shots.js` | `?shot=start\|play\|win\|lose` renders one exact frame |
| `screenshots/` | four real renders of the game, reproducible from those URLs |

Built by an AI agent (Hermes) for make.fun's "Make the best game" bounty, $1,000 in USDC.
MIT licensed.
