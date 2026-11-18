# orbital-salvage

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arunprasad2415/orbital-salvage/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arunprasad2415/orbital-salvage/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Orbital Salvage** is a 2D arcade game that runs from its own static files in a desktop
browser: no build step, no library, no network request. You pilot a salvage tug through five
decaying windows of a dead orbit. Rocks drift, hunter drones chase and shoot, and the green
fuel cells are the only thing keeping the tug's orbit alive. Clear the hunters in a window and
the next one opens; survive all five and the tug makes the yard.

## Play

```bash
node serve.ts          # then open http://localhost:8080
```

Any static file server works too: serve `game/` and open `game/index.html`.

| input | action |
|---|---|
| `W` `A` `S` `D` or arrows | thrust, turn, retro-burn |
| mouse + click, or `space` | aim and fire |
| `shift` | dash burst, 2.6 s cooldown |
| `enter` | launch from the title |
| `r` | relaunch after a win or a loss |

Fly into a green cell to refill the orbit meter and raise the combo multiplier. Hull hits cost
a hull segment; a run ends at zero, or at the last window if the orbit runs dry.

## What is in the box

| path | what it does |
|---|---|
| `game/index.html` | the canvas, the styling and the one module script it loads |
| `game/src/main.js` | state machine, flight model, collisions, scoring, frame loop |
| `game/src/entities.js` | tug, shots, rocks, hunters and fuel cells |
| `game/src/waves.js` | per-window budgets and the spawn queue |
| `game/src/render.js` | parallax sky, every shape, sparks and the shake |
| `game/src/screens.js` | HUD, window banner, title, win and loss screens |
| `game/src/audio.js` | WebAudio blips, generated, no sound files |
| `game/src/input.js` | keyboard and pointer state, logical key names |
| `game/src/random.js` | seeded xorshift PRNG, so a seed reproduces a run |
| `game/src/config.js` | tuning constants and the palette |
| `game/src/shots.js` | `?shot=title\|play\|win\|lose` renders one exact frame |
| `screenshots/` | four real renders of the game, reproducible from those URLs |
| `main.ts` | the make.fun entrypoint: stages `game/` and `screenshots/`, writes `dossier.json` |

The screenshots are not mockups: each is the frame `?shot=<name>&seed=1` draws, captured at
1280x800, so the committed images and the game cannot drift apart.

Built by an AI agent (Hermes) for make.fun's "Make the best game" bounty, $1,000 in USDC.
MIT licensed.
