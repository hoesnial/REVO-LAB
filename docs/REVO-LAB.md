# REVO LAB — Jelajah Revolusi Industri 1.0

A public, Indonesian-language learning prototype for Grade XII students at SMAN 16 Bandung. Open `/revo-lab` for the main menu, then select **Mulai Jelajah** → **Jelajahi Era** → **Mulai Simulasi**. The simulator remains directly accessible at `/revo-lab/industry-1`. It is integrated into the existing Next.js application and needs no login, database records, API credentials, downloaded models, or paid assets. The separate Studio application at `/` is preserved.

## Setup and run

Requires Node.js 22.12+ and npm; this workspace uses Node.js 24.21.

```sh
npm install
npm run dev -- --port 3001
```

Open http://127.0.0.1:3001/revo-lab. The server binds to the local machine by default.

For a production demonstration:

```sh
npm run build
npm run start -- --port 3001
```

Only one process can use a port at a time. Stop the development server before starting production on the same port. The repository's Prisma generation runs during installation/build because it belongs to the existing studio application; REVO itself does not need a database connection or migration.

## Demonstration walkthrough

Start at the fullscreen main menu. **Cara Bermain** opens the Indonesian help dialog; Escape, the close button, and **Siap menjelajah** dismiss it and restore focus. **Mulai Jelajah** opens the four-era selection. Industry 1.0 is playable; Industry 2.0–4.0 show disabled **Dalam Pengembangan** controls with accessible explanations. **Jelajahi Era** opens the steam level briefing, including four learning objectives and the mission. **Mulai Simulasi** enters the existing laboratory. Menu, era and briefing screens reuse a static factory capture and lightweight SVG illustrations, with no additional WebGL scenes.

1. Open the route. The procedural 3D factory appears after its client bundle loads. A stocked, prepared boiler is initially idle: water 65, fuel 35, heat 20, pressure 10. Levels are teaching scales, not real operating measurements.
2. Inspect the five numbered components: ketel uap, roda gila, piston, pipa uap, and mesin tekstil. Read each component's historical explanation and mechanical role. The camera focuses smoothly. The matching buttons below the scene offer the same learning experience using a keyboard. Each distinct component counts once toward 5/5; then select **Lanjut ke eksperimen** to unlock the controls.
3. Drag the scene to orbit; scroll or use +/− to zoom. Reset the camera or widen the diorama. Escape exits the widened view. Open Panduan belajar or Buka bantuan for instructions.
4. In the Experiment stage, select **Nyalakan mesin**. Heat, pressure, speed, resource consumption, and production change together. The flywheel, slider-crank piston, drive, gears, and textile mechanism animate from the simulated speed. Initial resources are enough for a safe first attempt, normally about 60–90 seconds of active simulation time. Keep the tab visible.
5. Experiment with adding/removing fuel and adding water. A refill cools the model slightly. **Lepaskan tekanan** lowers pressure and heat and consumes a little water. **Hentikan mesin** cuts heat input; mechanical parts coast to rest. Remaining heat/pressure cool gradually.
6. Reach **100 unit** while pressure remains **≤75 throughout the attempt**. Completion stops the engine and opens a summary. Continue to Refleksi, answer three questions, inspect the explanations, and view the score. The quiz can be retried.
7. For an emergency demonstration, add fuel repeatedly toward 100, then start. Pressure passes 75 (mission attempt invalidated), then reaches 90 (latched emergency stop). Vent and cool below pressure 60 and heat 65 before restarting. Select **Ulangi misi** to reset the machine, production and safety history while keeping the five explored components. **Mulai ulang** clears the whole laboratory after confirmation.
8. Sound starts muted. Enable it with the speaker button inside **LABORATORIUM INTERAKTIF**, beside the era information and **Mulai ulang**, to hear mechanical audio, clicks, startup, steam, alarms, and completion sounds. Expand **Konteks sejarah** in the control panel, then open **Baca cerita di baliknya**. **Putar narasi** uses an installed Indonesian browser voice; the full transcript remains visible if a voice is unavailable. Mute also stops narration.
9. **Jeda simulasi** pauses time, resource consumption, production, 3D machinery and engine audio. Opening a dialog, returning to Explore, or selecting **Kembali ke Menu** also pauses the simulation. The shared layout retains the same lab state: resources, production, exploration, stage, quiz score, and sound preference. Reentering via era selection and briefing resumes the experiment. The WebGL scene is released outside gameplay and recreated on entry. See the lifecycle rules below for intentional resets.

## REVO-001 scope

- A viewport-sized `100dvh` menu, with a 40/60 desktop composition and responsive tablet, mobile and landscape layouts without document scrolling.
- Native Next.js route navigation between the menu and the existing simulator, plus accessible help with keyboard focus containment and restoration.
- One retained laboratory component, an explicit scheduling pause, and no changes to the pure simulation equations, procedural factory models, materials, lighting, or controls.
- `REVO_ROUTES` centralizes the entry URLs. Era selection, level briefing and the fullscreen HUD were added in the following checkpoints.

## REVO-002 flow and session lifecycle

The existing Next.js URL remains the only screen state; `getRevoScreen` derives the four screen names without another navigation store. The persistent `RevoExperience` layout owns the existing lab instance and activates it only at the gameplay URL.

```text
/revo-lab                        main-menu
  → /revo-lab/eras               era-select
    → /revo-lab/industry-1/briefing  level-briefing
      → /revo-lab/industry-1     gameplay
```

- Era selection returns to the menu; briefing returns to era selection; gameplay keeps its existing **Kembali ke Menu** navigation.
- Stable IDs are `industry-1`, `industry-2`, `industry-3`, and `industry-4`. `ERAS` has a briefing destination only for `industry-1`; the other cards have no links. Unknown/unfinished REVO URLs return the REVO not-found screen rather than falling into Studio or starting another level.
- A new lab session starts on the first entry into gameplay, including a direct visit to the existing simulator URL. The initial resources and simulation equations are unchanged.
- Moving among menu, era selection and briefing never initializes or resets the lab. Once entered, the same lab component remains mounted throughout the REVO section. Its scheduler pauses, audio/narration stop, and the Canvas unmounts outside gameplay. There is no elapsed-time catch-up or background resource consumption.
- Reentering gameplay resumes the existing resources, running/stopped state, production, safety history, explored components, learning stage, evaluation score and sound preference. If browser navigation interrupted an open dialog, its children remain mounted while the native dialog closes; returning restores its current content, including a partial quiz answer and feedback. Deliberately closing/retrying a quiz keeps the pre-existing behavior.
- **Mulai ulang** creates a fresh laboratory session after confirmation. **Ulangi misi** resets only the simulation and keeps explored components; it does not require repeating Explore. Reloading the document, closing the tab or leaving the REVO layout ends the in-memory session. No localStorage, cookies, account, backend or database persistence has been added.
- The new screens use `100dvh` with no document scrolling. All content fits at the target desktop sizes. Smaller screens use keyboard-accessible internal scrolling for the era list or briefing content; briefing action buttons remain outside the scrolling panel. Entrance/hover transitions respect reduced motion.
- Home and End on the focused era list move directly to its beginning or end, so keyboard scrolling remains reliable in short and mobile viewports.
- Historical introduction and learning objectives are separate from the simplified game mission, with the simulation scale explicitly identified as educational rather than real thermodynamics.

The REVO-002 checkpoint did not change the simulator presentation. Its fullscreen HUD was completed in REVO-003.

## REVO-003 fullscreen gameplay HUD

- The gameplay URL fills one browser viewport with no document scrolling. Its compact header keeps the era title and return/help actions visible; the **LABORATORIUM INTERAKTIF** bar keeps the learning stages, era dates, sound switch and reset together.
- The procedural 3D factory takes the main area. Five component selectors and camera controls stay along its lower edge. Selecting a component opens a readable card over the scene with close and next-component buttons.
- A dark machine panel places start/stop and pressure release near the top, followed by pressure, resources, speed and heat. That panel scrolls internally on smaller screens. Historical context sits in a native disclosure at its end and still opens the existing narration dialog.
- Mission progress and safety history remain visible at the bottom of the desktop sidebar and above the controls on phones. The learning hint and live event feedback occupy a compact status strip. Short landscape, tablet and phone layouts preserve a useful 3D viewing area without expanding the page height.
- The existing reducer, audio hook, WebGL scene, quiz/dialog lifecycle and route-aware session retention are unchanged. Widening the diorama keeps the machine controls in view.

## REVO-004 learning progression

- Explore begins at 0/5. Opening a component's information card counts that component once, focuses the existing camera, and displays its history and mechanical role. A 5/5 completion message and **Lanjut ke eksperimen** action unlock Experiment. Engine controls stay disabled until Experiment is selected.
- Reflection remains locked until the existing simulation validates 100 production units without any crossing above its safe pressure threshold (75). The existing completion dialog and three-question quiz are reused. Stage tabs and keyboard navigation only reach unlocked stages.
- Existing simulation events supply contextual Indonesian feedback for startup, scarce resources, unsafe pressure, emergency stops, recovery and mission success. The HUD shows exploration progress, production and current guidance without adding another panel.
- The pause button, dialogs, Explore stage and navigation away from gameplay stop the simulation scheduler. Resource levels and production stay fixed while paused; the 3D machine and engine audio also stop. Returning to Experiment or closing a dialog resumes the same session without elapsed-time catch-up.
- **Ulangi misi** after an unsafe attempt resets the simulation only, retaining the 5/5 exploration unlock. **Mulai ulang** remains a separately confirmed full reset of the laboratory, exploration and quiz result. Progress remains in memory; permanent persistence belongs to REVO-005.

## Implemented features

- A fully procedural, stylized factory with brickwork, arched windows, structural beams, coal, crates, boiler, copper pipes, chimney, large flywheel, connected piston, gears/drive, and a textile loom.
- Orbit, zoom, camera focus/reset, expanded view, hover/focus highlights, and five numbered component buttons.
- A pure deterministic simulation with resource checks, gradual heat/pressure/speed, resource consumption, safe production, warnings, emergency stop/recovery, and a resettable mission.
- Connected exploration, experimentation, and reflection stages; mission progress, event-specific Indonesian feedback, completion summary, and three scored conceptual/history questions with explanations.
- Optional procedural Web Audio and Indonesian SpeechSynthesis narration with text fallback.
- Responsive desktop/tablet/mobile layout, keyboard controls, visible focus, native dialogs with focus restoration, reduced-motion handling, loading state, WebGL/error fallback, and explanatory text independent of color or sound.
- Bundled local fonts; no external 3D files, textures, environment maps, or audio files are needed.

## Project structure

```text
src/app/revo-lab/
  page.tsx                         Main menu entry and metadata
  layout.tsx                       Shared, persistent REVO session
  menu.css                         Fullscreen menu and responsive styles
  journey.css                      Era selection and briefing styles
  eras/page.tsx                    Era selection route and metadata
  industry-1/page.tsx               Simulator route metadata
  industry-1/briefing/page.tsx       Steam briefing route and metadata
  industry-1/revo.css               Scoped museum/laboratory styles
  industry-1/hud.css                Fullscreen gameplay HUD and responsive layouts
  [...unavailable]/page.tsx         Reject unfinished/unknown REVO routes
  not-found.tsx                    Indonesian unavailable-era fallback
src/components/revo/
  RevoMainMenu.tsx                  Main menu and Indonesian help
  RevoExperience.tsx                Route-aware lab retention and activation
  RevoEraSelection.tsx              Four era cards and availability
  EraGridKeyboard.tsx               Focused Home/End scrolling for the era list
  RevoLevelBriefing.tsx             Learning objectives, mission and entry
  RevoScreenHeader.tsx              Shared journey header/back navigation
  EraIllustration.tsx               Three static industrial SVG illustrations
  RevoLab.tsx                      Learning flow and UI composition
  FactoryScene.tsx                 Canvas, hotspots, camera, lights, steam, fallback
  FactoryEnvironment.tsx           Factory building and industrial surroundings
  Boiler.tsx                       Boiler and steam pipes
  SteamEngine.tsx                  Flywheel, slider-crank piston, drive mechanism
  TextileMachine.tsx               Loom and operating textile mechanism
  ScenePrimitives.tsx              Reusable procedural geometry
  scene-types.ts                   Scene interfaces and component positions
  MachineControlPanel.tsx          Pressure gauge, resources, engine controls
  MissionPanel.tsx                 Production mission and safety history
  HistoricalInfoPanel.tsx          Historical context
  QuizPanel.tsx                    Answer submission, explanations, score, retry
  RevoDialog.tsx                   Accessible native dialog wrapper
src/hooks/
  useSteamSimulation.ts            Fixed-step scheduling, menu/hidden-tab pause
  useRevoAudio.ts                  Procedural audio and narration lifecycle
src/lib/
  simulation/simulationConstants.ts Thresholds, rates, and model parameters
  simulation/steamEngine.ts        Pure simulation equations and actions
  revo/content.ts                  Indonesian explanations, transcript, quiz
  revo/routes.ts                   Shared entry-flow URLs
  revo/eras.ts                     Stable era IDs, availability and objectives
public/revo/factory-preview.png     Static capture of the existing factory
```

## Simulation equations and thresholds

The model is intentionally simplified and dimensionless. Each running update uses the prior fuel level to set a heat target. It does not attempt real thermodynamics, combustion, valve timing, steam mass flow, efficiencies, or a physical pressure unit.

For time step `dt`, the smooth response is:

```text
approach(value, target, dt, time) = value + (target − value) × (1 − exp(−dt/time))
heatTarget = clamp(20 + fuel, 0, 100) while firing; otherwise 20
heat = approach(heat, heatTarget, dt, 9s heating or 16s cooling)
pressureTarget = clamp((heat − 20) × 2.35, 0, 100), with water ≥ 8; otherwise 0
pressure = approach(pressure, pressureTarget, dt, 11s)
speedTarget = clamp(pressure × 1.3, 0, 100) while running; otherwise 0
speed = approach(speed, speedTarget, dt, 2.2s accelerating or 1.8s coasting)
fuel consumption/s = 0.045 + speed × 0.0006
water consumption/s = 0.1 + speed × 0.0018
safe production/s = speed / 100 × 2.3
```

Fuel addition is 15, fuel reduction 10, water addition 15 (up to 100). A full refill cools heat by 5. Venting reduces pressure by 24, heat by 8, and water by 1 when pressure exists. Heat never cools below ambient 20. Water below 8 or fuel ≤0.5 prevents running. Low-resource warnings start at water ≤15 or fuel ≤5. Pressure >75 invalidates the current mission attempt. Pressure ≥90 stops the engine; recovery requires pressure ≤60 **and** heat ≤65. Mission success requires 100 units and no unsafe pressure crossing. Reset clears production and safety history.

Pure evolution subdivides elapsed time into steps of at most 50ms. The hook accumulates fixed 50ms updates, caps a stalled frame to 250ms, and discards hidden-tab intervals. Model values and mission time therefore pause when the tab is hidden; a heavily loaded machine can run slower than wall time. No metrics use randomness.

## Verification commands

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

For the focused REVO browser suite, start the server on port 3001, then:

```sh
npm run test:revo
```

The focused suite uses an isolated browser and the public REVO routes, with no studio database setup. It verifies the full four-screen flow and reverse navigation; disabled-era explanations and unavailable-route rejection; keyboard navigation and internal scrolling; responsive menu/era/briefing layouts; fullscreen HUD fit at desktop, tablet, phone and short-landscape sizes; stage locking and 0/5–5/5 exploration; real pause and progress retention across every screen; mission-only retry; browser history and partial quiz preservation; the real mission through completion; quiz scoring; emergency behavior; resource controls; camera interaction; and browser error checks. Browser configuration is in `playwright.revo.config.ts`; use `REVO_BASE_URL` to target another local port. Screenshots and failure artifacts are written under `test-results/`.

The pre-existing `npm run test:e2e` tests the separate studio application and has its own database setup and server configuration.

## Boundaries and future improvements

- This is an educational model, not a scientific simulator or a boiler operation training tool. Initial pressure represents a prepared exhibit and does not model startup from completely cold water.
- The diorama combines recognizable industrial features for teaching rather than reproducing one specific historical engine or factory. Approximate dates indicate the broad era, not the construction year of a replica.
- Progress is held in memory for this prototype and resets on reload. There are no learner accounts, class reports, or saved grades.
- WebGL needs hardware/browser support. When unavailable, the component descriptions, simulation controls, mission, and quiz remain usable. Lower-end devices may have reduced frame rates.
- Narration availability depends on an installed Indonesian voice. Procedural audio is intentionally lightweight; audible output and installed voices should be checked on the actual presentation device.
- Reduced motion removes decorative steam motion and animated camera transitions while preserving instructional engine motion.
- Next steps: classroom usability testing at SMAN 16 Bandung; teacher-reviewed assessment; optional saved progress and teacher reporting; a guided energy-flow overlay; additional industrial eras; and measured performance tuning on school devices.

## Historical references

Content is paraphrased for learning from museum sources:

- [Science Museum: James Watt and industrial steam power](https://blog.sciencemuseum.org.uk/james-watt-high-street-fashion/) — steam, coal, factory location, and Watt's contribution.
- [Science Museum Group: 1811 steam engine collection record](https://collection.sciencemuseumgroup.org.uk/objects/co50985) — reference for piston, flywheel, boiler, and valve mechanisms; the scene does not claim to replicate this engine.
- [Science and Industry Museum: Manchester, water, steam, and pollution](https://blog.scienceandindustrymuseum.org.uk/manchester-our-rainy-city/) — water-to-steam transition and continuing resource needs.
- [Science and Industry Museum: Textiles Gallery guide](https://www.scienceandindustrymuseum.org.uk/sites/default/files/2021-12/SIM_LargePrintBook_TextilesGallery_UpperLevel_Book2-compressed.pdf) — mechanization, steam belts, factory work, and social consequences.
