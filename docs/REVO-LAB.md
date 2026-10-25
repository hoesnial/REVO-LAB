# REVO — Jelajah Revolusi Industri

REVO is an Indonesian-language, fullscreen educational game for exploring the First Industrial Revolution. The game uses a stylized steam-powered textile factory diorama to connect machine parts, energy transfer, production, and historical reflection.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. `/` redirects to the REVO menu at `/revo-lab`.

For a production preview:

```sh
npm run build
npm run start -- --port 3001
```

REVO has no login, server database, API credentials, external 3D assets, or paid asset requirements.

## Learning journey

```text
Menu → Era selection → Briefing → Explore → Assembly → Experiment → Reflection → Results
```

- **Era selection and briefing:** Industry 1.0 is playable. Industry 2.0–4.0 are visibly marked as in development. The briefing introduces four learning objectives and the mission.
- **Explore:** Inspect the boiler, steam pipe, piston mechanism, flywheel, and textile machine. Every component must be explored once.
- **Assembly:** Install those five parts in their fixed sockets, then answer three conceptual questions about steam generation, rotary motion, and factory power. The 3D drag interaction has inventory/socket controls for keyboard and touch users.
- **Experiment:** Run the engine explicitly. Produce 100 units while keeping pressure at or below the safe threshold of 75. A pressure emergency stops the engine and invalidates the attempt.
- **Reflection and results:** Submit the three-question history quiz to see the score and learning takeaways. Results report actual exploration, assembly, safety, production, and quiz state.

The simulator does not start automatically. Pause, dialogs, route changes, and hidden tabs stop simulation time, resource consumption, production, moving machinery, and engine audio.

## Machine model

The scene is a teaching model labelled **INGGRIS, MODEL ±1800**. The energy path is represented as:

```text
Boiler → Steam pipe → Piston → Crank → Flywheel → Belt → Line shaft → Bevel gears → Loom
```

Steam pressure drives reciprocating piston motion. A connecting rod and crank convert that motion to rotation; the flywheel helps smooth rotation. Belts, shafts, and a right-angle gear stage represent how power can reach textile machinery. Historical factory layouts varied, so this is not a reconstruction of one specific mill or a mechanically complete engineering assembly.

The simulator is deterministic and dimensionless. Its 0–100 readings are teaching scales, not physical units or operating guidance. It does not model real thermodynamics, combustion, steam mass flow, efficiency, or valve timing. Fuel and water controls, cooling, pressure release, safety thresholds, production, and mission retries are governed by the model in `src/lib/simulation/steamEngine.ts` and `src/lib/simulation/simulationConstants.ts`.

## Progress and reset behavior

Progress is stored in the browser at `revo:industry-1:progress`, schema version 1. The app validates saved IDs, answers, and stage dependencies before restoring progress. It saves exploration, assembly, knowledge checks, completed production, reflection, level results, and sound preference.

An unfinished experiment is restored in a safe, stopped state; active resource filling never resumes. Completed production can be reviewed with the engine stopped. Saved audio preference does not bypass the browser's user-gesture requirement for playback.

- **Reset machine** stops the machine and cancels active filling while retaining completed mission production and safety history.
- **Retry mission** resets experiment conditions while retaining exploration and assembly.
- **Retry assembly** clears placements and knowledge checks but retains exploration.
- **Retry level** clears the Industry 1.0 journey and saved record after confirmation.

Saved data is local to one browser/device. It is not account-backed, tamper-proof, or synchronized across devices.

## Audio, motion, and accessibility

Sound is opt-in. A single lazy Web Audio context supplies quiet procedural engine, flywheel, loom, steam, placement, rejection, and completion cues. The simulation bed follows engine speed and fades out when gameplay pauses. Indonesian browser speech synthesis has visible transcript fallback and play, pause, resume, and stop controls.

The interface supports keyboard navigation, visible focus, reduced-motion preferences, native accessible dialogs, screen-reader labels, and responsive fullscreen layouts. If WebGL is unavailable, learning descriptions, controls, mission, and quiz remain usable. Lower-end devices may have reduced frame rates, and speech playback depends on browser support and installed Indonesian voices.

## Project map

```text
src/app/revo-lab/       Routes and fullscreen styles
src/components/revo/    Menu, journey screens, gameplay HUD, factory scene, dialogs
src/hooks/              Simulation clock and audio lifecycle
src/lib/revo/           Learning content, assembly, progress, and mechanics
src/lib/simulation/     Deterministic steam-engine model
public/revo/            Factory preview image used in menus
tests/                  REVO unit and browser tests only
```

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The browser suite reuses a running local server. Start the production preview on port 3001, then run:

```sh
npm run test:e2e
```

Set `REVO_BASE_URL` if the server uses another port. The suite uses local Google Chrome when present, otherwise a Playwright-installed browser.

## Historical references

- [English Heritage — Shrewsbury Flaxmill Maltings](https://www.english-heritage.org.uk/visit/places/shrewsbury-flaxmill-maltings/history/): a 1797 Boulton & Watt engine and mill power distribution.
- [National Park Service — Mill Power Drives](https://www.nps.gov/articles/lowell-handbook-mill-power-drives.htm): line shafts and belts in textile mills.
- [Historic England — Lancashire Textile Mills](https://historicengland.org.uk/images-books/publications/textile-mills-lancashire-legacy/textile-mills-lancashire-legacy/): context on mill structures and machinery.
- [Smithsonian — Horizontal Mill Engine and Boiler, circa 1870](https://www.si.edu/object/model-horizontal-mill-engine-and-boiler-ca-1870%3Anmah_846116): an example of a plunger feed pump; this later model is not presented as the REVO machine.
