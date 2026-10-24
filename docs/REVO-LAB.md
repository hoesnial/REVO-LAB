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
2. Inspect the five numbered components: ketel uap, roda gila, piston, pipa uap, and mesin tekstil. Read each component's historical explanation and mechanical role. The camera focuses smoothly. The matching buttons below the scene offer the same learning experience using a keyboard. Each distinct component counts once toward 5/5; then select **Lanjut ke perakitan**. Install five components by dragging from the 3D tray or choosing a component and socket before confirming. Complete three knowledge checks, then select **UJI MESIN** to unlock the controls. The engine remains stopped until explicitly started.
3. Drag the scene to orbit; scroll or use +/− to zoom. Reset the camera or widen the diorama. Escape exits the widened view. Open Panduan belajar or Buka bantuan for instructions.
4. In the Experiment stage, select **Nyalakan mesin**. Heat, pressure, speed, resource consumption, and production change together. The flywheel, slider-crank piston, drive, gears, and textile mechanism animate from the simulated speed. Initial resources are enough for a safe first attempt, normally about 60–90 seconds of active simulation time. Keep the tab visible.
5. Experiment with adding/removing fuel and adding water. A refill cools the model slightly. **Lepaskan tekanan** lowers pressure and heat and consumes a little water. **Hentikan mesin** cuts heat input; mechanical parts coast to rest. Remaining heat/pressure cool gradually.
6. Reach **100 unit** while pressure remains **≤75 throughout the attempt**. Completion stops the engine and opens a summary. Continue to Refleksi, answer three questions, inspect the explanations, and view the score. The quiz can be retried.
7. For an emergency demonstration, add fuel repeatedly toward 100, then start. Pressure passes 75 (mission attempt invalidated), then reaches 90 (latched emergency stop). Vent and cool below pressure 60 and heat 65 before restarting. Select **Ulangi misi** to reset the machine, production and safety history while keeping the five explored components. **Mulai ulang** clears the whole laboratory after confirmation.
8. Sound starts muted. Enable it with the speaker button inside **LABORATORIUM INTERAKTIF**, beside the era information and **Mulai ulang**, to hear mechanical audio, clicks, startup, steam, alarms, and completion sounds. Expand **Konteks sejarah** in the control panel, then open **Baca cerita di baliknya**. **Putar narasi** uses an installed Indonesian browser voice; the full transcript remains visible if a voice is unavailable. Mute also stops narration.
9. **Jeda simulasi** pauses time, resource consumption, production, 3D machinery and engine audio. Opening a dialog, returning to Explore, or selecting **Kembali ke Menu** also pauses the simulation. The shared layout retains the same lab state: resources, production, exploration, assembly, stage, quiz score, and sound preference. Reentering via era selection and briefing resumes the experiment. The WebGL scene is released outside gameplay and recreated on entry. See the lifecycle rules below for intentional resets.

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

- Explore begins at 0/5. Opening a component's information card counts that component once, focuses the existing camera, and displays its history and mechanical role. A 5/5 completion message now unlocks **Perakitan**; REVO-005 adds the required assembly before Experiment. Engine controls stay disabled until Experiment is selected.
- Reflection remains locked until the existing simulation validates 100 production units without any crossing above its safe pressure threshold (75). The existing completion dialog and three-question quiz are reused. Stage tabs and keyboard navigation only reach unlocked stages.
- Existing simulation events supply contextual Indonesian feedback for startup, scarce resources, unsafe pressure, emergency stops, recovery and mission success. The HUD shows exploration progress, production and current guidance without adding another panel.
- The pause button, dialogs, Explore stage and navigation away from gameplay stop the simulation scheduler. Resource levels and production stay fixed while paused; the 3D machine and engine audio also stop. Returning to Experiment or closing a dialog resumes the same session without elapsed-time catch-up.
- **Ulangi misi** after an unsafe attempt resets the simulation only, retaining the 5/5 exploration unlock. **Mulai ulang** remains a separately confirmed full reset of the laboratory, exploration and quiz result. Progress remains in memory; permanent persistence belongs to REVO-006.

## Implemented features

- A fully procedural, stylized factory with brickwork, arched windows, structural beams, coal, crates, boiler, copper pipes, chimney, large flywheel, connected piston, gears/drive, and a textile loom.
- Orbit, zoom, camera focus/reset, expanded view, hover/focus highlights, and five numbered component buttons.
- A pure deterministic simulation with resource checks, gradual heat/pressure/speed, resource consumption, safe production, warnings, emergency stop/recovery, and a resettable mission.
- Connected exploration, assembly, experimentation, and reflection stages; mission progress, event-specific Indonesian feedback, completion summary, and three scored conceptual/history questions with explanations.
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

## REVO-005 interactive 3D assembly

### Audit and reuse

`RevoLab` retains exploration, the pure steam simulation, audio, quiz, native dialog lifecycle and the route-aware session. The five existing model exports (`Boiler`, `SteamPipes`, `PistonMechanism`, `Flywheel`, `TextileMachine`) have authored world coordinates and animation refs. Assembly mounts each model once in the existing `FactoryScene` Canvas and factory environment. An outer assembly group subtracts a known anchor for its inventory position; installed groups restore the exact authored coordinates. No original transforms, simulation equations, large cloned scene, physics engine or backend were introduced. Exploration hotspots and camera controls resume outside assembly.

### Learning rules

The required flow is **Explore (5 unique components) → Assembly (5 parts + 3 knowledge checks) → Experiment (100 safe units) → existing Reflection**. `canEnterStage` guards tabs, arrow/Home/End navigation and callbacks; engine controls also require completed assembly. `assemblyReducer` is the only authority for component selection, selected socket, unique placements, passed knowledge check IDs and explanatory feedback. Completion and progress are derived from those IDs, never animation timing.

Each inventory item explains its function, neighboring relationships and historical context. Fixed sockets represent the steam source, boiler-to-cylinder path, pressure-to-motion mechanism, stabilized rotary drive and textile load. Parts can be installed in any order; incorrect or missed sockets explain the relationship and retain the part for retry. Three checks cover steam generation, connecting rod/crank conversion and the reduced dependence on local water power. Checks unlock after their relevant parts are installed. Wrong answers explain misconceptions and allow unlimited retry; correct checks cannot be counted twice.

### Interaction, accessibility and session safety

R3F pointer capture and ray/plane intersection restrict a dragged miniature to a bounded horizontal workspace. Nearby sockets highlight; lightweight wireframe silhouettes preview the correct model position. OrbitControls disable during drag and restore after release or cancellation. The same model snaps to its authored transform only after a validated reducer placement. Inventory buttons, a labeled native socket select and **Pasang komponen** provide the full keyboard/tap alternative, including when WebGL is unavailable.

The fullscreen cream/green/yellow HUD keeps the scene dominant and provides installed/remaining counts, knowledge guidance, a progress bar, collapsible inventory and an internally scrolling sidebar on compact screens. No document scrolling is required. Menu navigation, pause and help/reset dialogs disable assembly actions and cancel in-flight dragging. Session progress, selection and check feedback survive menu/briefing navigation; no persistence was added.

**Ulangi perakitan** resets assembly only, retaining completed exploration and existing experiment resource/production values, while revoking Experiment/Reflection access until assembly is completed again. Entering Assembly stops the engine. **UJI MESIN** enters the existing Experiment with the engine stopped; fuel, water, pressure and production use the original simulation. **Mulai ulang** remains the explicit full laboratory reset.

### Completion and educational limits

After five placements and all checks, **PERAKITAN SELESAI** highlights the system and shows a yellow energy-flow schematic: combustion heat → steam in boiler/pipe → piston work → connecting rod/crank rotation → flywheel/shaft/belt → textile machinery. The energy line is explicitly distinguished from a steam pipe. Decorative flow pauses with gameplay and stays static under reduced motion. The assembly is a conceptual teaching model, not a complete engineering build or a replica of one historical machine. Its simplified transmission supplements the existing crank linkage and line shaft.

Historical content was checked against the [Science Museum discussion of industrial steam power](https://blog.sciencemuseum.org.uk/james-watt-high-street-fashion/) and [Science Museum Group engine collection record](https://collection.sciencemuseumgroup.org.uk/objects/co50985). Pointer capture follows the [R3F event API](https://r3f.docs.pmnd.rs/api/events).

### Files and verification

- `src/lib/revo/assembly.ts`: conceptual part data, knowledge checks, reducer, completion and stage selectors, fixed socket detection.
- `src/components/revo/AssemblyScene.tsx`: isolated transforms, R3F dragging, cancellation, sockets, ghost silhouettes, projected markers and energy-flow schematic.
- `src/components/revo/AssemblyPanel.tsx` and `src/app/revo-lab/industry-1/assembly.css`: fullscreen assembly HUD, inventory, learning content, retry and completion.
- `FactoryScene`, `RevoLab`, `MissionPanel`, scene types, layout, briefing and objectives integrate the required stage; `RevoMainMenu` help also explains the assembly gate.
- `tests/revo-assembly.test.ts`, `tests/revo-assembly.e2e.spec.ts` and `tests/helpers/revo-assembly.ts` cover the reducer and real interactions. Existing REVO mission/menu tests now traverse Assembly before exercising the same simulation, safety, pause and quiz assertions. `playwright.revo.config.ts` includes the new suite. One existing Studio assertion in `tests/e2e.spec.ts` is scoped to its main landmark because mobile also renders the same provider message in a sidebar; product behavior is unchanged.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then `npm run test:revo` against the local server on port 3001. The Studio suite remains separately available as `npm run test:e2e` with its existing disposable database setup.

Executed checkpoint verification:

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 59 passed (including 16 assembly cases) |
| REVO Playwright, production server | 21 passed (8 assembly and 13 existing journey/simulator cases) |
| Studio Playwright | 2 passed after scoping the existing mobile selector |
| Assembly responsive layout | 9 viewport sizes, 320–1920 px; no document scrolling |
| Runtime/console errors | None in the REVO browser suite |

Tests exercise genuine R3F dragging (valid, wrong and missed sockets), capture cancellation during pause and stage changes, keyboard confirmation, touch taps, duplicate prevention, retry explanations, assembly-only reset and stage gates. The preserved browser regression also runs the real 100-unit safe mission, emergency stop, resource management, pause/resume, camera controls and reflection quiz.

Next checkpoint: **REVO-006 — Level Completion & Persistent Progress**. It is outside REVO-005 scope.

## REVO-005.1 mechanical visibility and animated filling

The original slider reached x=-2.30 while the cylinder's front cap was at x=-2.22, so the crosshead and connecting rod could retreat inside the cylinder. The mechanism now uses a shared layout and slider-crank solution (`mechanics.ts`): 0.37 crank radius, fixed 1.65 connecting rod, one z=1.74 plane for the crosshead/rod/crank pin, and a cylinder exit to the left of the whole crosshead stroke. The front crank arm and shaft extension meet that plane. The piston frame, steam-pipe endpoint, exploration hotspot/focus, assembly anchor/socket/ghost and energy path were adjusted together. Original flywheel motion and the single reused model per assembly part remain intact.

The gauge's original center was y=1.91 with radius .205, overlapping the boiler whose top is y=2.05. Its new center y=2.34 keeps even the bottom of the dial above the boiler. A small pipe mount connects the housing to the shell. Its needle still reads simulation pressure; the sight-glass water column now reads actual simulation water.

The coal pile is reused as a pointer-selectable resource. A lightweight shovel takes a portion to a hinged, grilled firebox; the door opens, the coal disappears into the chamber, a brief ember reaction appears, and the door closes. The external water tank has a small feed pump, a connected supply line and moving blue flow markers. This depicts pumped feedwater and a one-way valve, never open pouring into a sealed pressure vessel. The reservoir is an external supply, not a second tracked boiler-water state.

`resourceFilling.ts` combines the existing SteamState with a small filling timeline in the simulation hook. Both 3D contextual actions and the original keyboard/tap controls route to that same reducer. Coal takes 3.6 simulation seconds, water 3.2. Only successful completion calls the original `applySteamAction` once, preserving additions, cooling, consumption, production and safety equations. There is no animation callback or duplicate fuel/water store. Repeated requests during a fill are ignored; the two filling operations cannot overlap. Both resources clamp to 100, and a full resource gives explanatory feedback.

Filling is blocked when pressure exceeds 75 or the emergency latch is active. A feed pump can operate at the model's safe working pressure; if pressure becomes unsafe mid-fill, filling cancels without a resource award. Pause, help/reset dialogs and hidden tabs suspend the shared clock. Leaving Experiment or navigating away cancels unfinished filling; ordinary completed progress remains in the current session. Reset also clears pending filling. Engine and steam visuals now freeze immediately when gameplay time pauses. Reduced motion replaces shovel travel and repeated pump motion with static filling cues; completion timing and state updates are unchanged. Completion sounds use the existing opt-in/muted audio bus.

Scientific/historical reference: the [Smithsonian horizontal mill-engine model](https://www.si.edu/object/model-horizontal-mill-engine-and-boiler-ca-1870%3Anmah_846116) documents a plunger pump supplying a boiler. This later museum example supports the feed-pump explanation, not a claim that REVO reproduces one 1780 machine. The factory, instruments and resource rules remain a deliberately simplified educational model. Existing historical quiz questions are unchanged.

New files: `src/lib/revo/mechanics.ts`, `src/lib/revo/resourceFilling.ts`, `src/components/revo/ResourceFilling.tsx`, `src/app/revo-lab/industry-1/filling.css`, `tests/revo-filling.test.ts`, and `tests/revo-filling.e2e.spec.ts`. Integration changes are in Boiler, SteamEngine, FactoryEnvironment, FactoryScene, scene types, AssemblyScene/socket data, RevoLab, MachineControlPanel, simulation/audio hooks, feedback messages, layout and Playwright configuration.

Executed REVO-005.1 verification:

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 72 passed across 5 files, including 13 mechanical/filling cases |
| REVO Playwright, production server | 27 passed in 9.7 minutes (all 21 previous scenarios plus 6 new filling/visual/fallback scenarios) |
| Studio Playwright | 2 passed |
| Visual inspection | Actual WebGL screenshots inspected from front, default isometric and side angles; piston/rod, raised gauge, coal feeding and water flow captured |
| Responsive/accessibility | Keyboard, mobile taps, reduced motion, WebGL-unavailable controls and fullscreen viewport fit passed |
| Runtime/console | No unexpected critical browser errors; the deliberately disabled-WebGL case exercises the expected renderer fallback |

The production regression includes the unchanged real 100-unit safe mission and reflection quiz, low resources, high-pressure filling rejection, emergency stop, pause/resume, all eight assembly scenarios and camera/hotspot behavior. Mechanical unit coverage samples a full crank revolution and checks constant rod length, stroke clearance and gauge separation. Filling tests cover terminal-only resource updates, capacity, repeated/cross-resource requests, original cooling/consumption, cancellation and safe pump operation.

During development, one visual test lost its graphics context during a live hot reload; it passed on rerun and again in the complete production suite. No unfinished functional issue remains at this checkpoint. Progress is still session-only and reload resets it, as required before REVO-006.

Browser screenshots are stored in `test-results/revo/screenshots/revo-005-1/`:

- `piston-connecting-rod.png` and `mechanism-side.png`
- `boiler-gauge.png` and `gauge-side.png`
- `coal-filling.png`
- `water-filling.png`
- `mobile-filling-controls.png`

**REVO-005.1 is complete. REVO-006 — Level Completion & Persistent Progress awaits PM approval.**

## REVO-005.2 mechanical power transmission

The engine flywheel rotates in the X–Y plane around Z, while the existing overhead line shaft runs left-to-right around X. The loom's working shaft also runs around X. A single coplanar flat belt could not connect the flywheel directly to that line shaft without an implausible quarter twist, which caused the original visual disconnect.

The scene now adds an axially mounted spoked driving pulley on the flywheel, a continuous moving leather belt to a supported front-to-back countershaft, an exposed right-angle bevel pair at the existing overhead shaft intersection, and a second continuous belt from the transverse line shaft to a larger driven pulley on the visible side of the loom. The cross shaft is animated in place and the line-shaft bearing is repositioned to clear the loom pulley. Both belt loops are generated from their authored pulley centers and radii, with external tangent segments and an animated repeating belt texture; they do not rely on rigid-body physics.

`transmissionMotion` derives countershaft, bevel-shaft and loom angles and velocities from the single engine motion reference. Belt speed uses driver radius and angular velocity; each driven shaft uses the pulley-radius ratio. The loom's crank drives a fixed-length connecting rod and rocking beater; shuttle, heddle and fabric take-up roller follow the same loom phase. The textile model's shuttle, heddles, cloth and take-up roller confirm it represents a weaving loom, not a sewing machine.

The transmission remains a supporting system. It does not add an assembly part or alter any of the five required IDs, sockets, knowledge checks, fuel/water controls, production equations or mission gates. In Assembly, its physical representation appears once the flywheel and textile machine are installed. A projected **T** information hotspot and dialog explain `Uap → Piston → Engkol → Roda gila → Sabuk → Poros atas → Roda gigi siku → Mesin tenun`; the same dialog is keyboard accessible.

The exhibit label is now **INGGRIS, MODEL ±1800** to distinguish the educational scene from a specific mill. English Heritage records a Boulton & Watt steam engine installed at Shrewsbury Flaxmill in 1797 and describes power passing through vertical shafts to horizontal floor axles, with leather belts turning individual machines. The model combines that general shaft-and-belt relationship with an explicit right-angle gear stage; arrangements varied by mill, date and building. It is a simplified teaching system, not a reconstruction of Shrewsbury Flaxmill or a claim that every early mill used the same belt layout. ([English Heritage: Shrewsbury Flaxmill](https://www.english-heritage.org.uk/visit/places/shrewsbury-flaxmill-maltings/history/), [National Park Service: mill power drives](https://www.nps.gov/articles/lowell-handbook-mill-power-drives.htm), [Historic England: Lancashire textile mills](https://historicengland.org.uk/images-books/publications/textile-mills-lancashire-legacy/textile-mills-lancashire-legacy/))

Files added: `src/components/revo/PowerTransmission.tsx` and `tests/revo-transmission.test.ts`. `mechanics.ts`, `SteamEngine.tsx`, `TextileMachine.tsx`, `FactoryScene.tsx`, `FactoryEnvironment.tsx`, `AssemblyScene.tsx`, `scene-types.ts`, `RevoLab.tsx`, `revo.css`, and `tests/revo.e2e.spec.ts` integrate the transmission, learning hotspot, date label and checks.

Executed REVO-005.2 verification against the production build:

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 74 passed across 6 files |
| REVO Playwright | 28 passed in 14.8 minutes |
| Transmission visual check | Actual WebGL screenshots inspected from default, side, moving, information-dialog and stopped-engine states |
| Pause and engine-stop behavior | Canvas remains unchanged while paused; transmission motion stops with the engine |
| Runtime | Transmission E2E passed against production preview without runtime or console errors |

Transmission screenshots are stored in `test-results/revo/screenshots/`: `power-transmission-default.png`, `power-transmission-moving.png`, `power-transmission-side.png`, `power-transmission-learning.png`, and `power-transmission-stopped.png`.

The full Playwright regression also passed the existing assembly gates and reset, resource filling and safety checks, pause/help, keyboard/touch, responsive layouts, 100-unit mission and reflection quiz. **REVO-005.2 is complete. REVO-006 — Level Completion & Persistent Progress awaits PM review.**

## REVO-006 — level completion and persistent progress

Industry 1.0 now runs through the complete learning loop: Main Menu → Era Selection → Level Briefing → Exploration → Assembly → Experiment → Reflection → Level Completed. Exploration requires all five unique components; Assembly requires all five placements and three dependency-aware knowledge checks; Experiment requires 100 production units while respecting the existing safe-pressure rule; Reflection requires submitting the existing historical quiz. Any answer set completes Reflection, and the results screen scores the submitted answers rather than using a preset value.

The fullscreen **LEVEL COMPLETED** screen reports the actual exploration, assembly, knowledge-check, production and reflection results. It includes four short takeaways about steam-powered mechanization, energy transmission, textile production and the wider historical effects of industrialization. Choosing an era or returning to the Main Menu preserves progress. Replaying the level requires explicit confirmation.

### Save format and restoration

The browser stores a small JSON record at `revo:industry-1:progress`, schema version `1`. Its typed fields include the selected era, explored component IDs, assembly placements and knowledge-check IDs, derived completed stages, experiment completion, reflection answers/draft/check/result state, completion flag, checkpoint and sound preference. Quiz scores and completion stages are derived from the validated saved answers and prerequisite state, rather than trusted as independent claims. No Three.js objects, transforms, animation frames, timers, WebGL resources or active resource-filling operations are saved.

Saved data is treated as untrusted input. Loading checks schema/version, field types, known IDs, duplicates, answer ranges and stage dependencies. Contradictory later-stage progress is revoked or the checkpoint is lowered to the latest valid stage. Malformed and unsupported records do not enable Continue. Browser storage access and write failures fall back to live in-memory gameplay and surface a subtle availability message; there is no hydration-time access to browser storage.

Exploration IDs, assembly placements/checks and their visible completion state restore directly. An unfinished Experiment returns to a safe, stopped starting state; unfinished fuel or water fills never resume. A completed Experiment restores its completed production result with the machine stopped, so the loom and transmission do not restart. Reflection restores valid in-progress answers and submitted results. A complete run reopens the results screen with its actual score. Nothing consumes resources or produces goods while the application is closed or paused. Browser audio preferences restore, but playback still requires a fresh user gesture where the browser requires one.

### Reset behavior

- **Reset Mesin** resets operating conditions and cancels active filling while retaining completed mission production and safety history.
- **Ulangi Misi** starts a new Experiment while preserving Exploration and Assembly.
- **Ulangi Perakitan** clears placements and knowledge checks but retains completed Exploration. The engine is stopped; an unfinished experiment's current-session progress is preserved, while resetting an already completed Experiment also revokes the dependent Reflection and result.
- **Ulangi Level** clears the full Industry 1.0 journey and local record only after confirmation.
- Returning to a menu, era selection or briefing preserves the record.

### Manual demo

1. From a fresh browser profile, confirm **Lanjutkan** is absent. Inspect one component and reload; Continue should resume Exploration with that component marked complete.
2. Complete all five explorations, assemble some parts and answer a knowledge check. Reload and confirm the scene, placements and checks are restored. Reset Assembly and confirm Exploration remains complete.
3. Complete Assembly and enter Experiment. Start a resource fill or produce some units, then reload. The engine should be stopped, incomplete fills discarded and unfinished Experiment safely restarted. Complete the 100-unit mission under the pressure limit and reload; production completion should remain while the engine stays stopped.
4. Submit the Reflection quiz with a mix of right and wrong answers. Confirm the Level Completed screen shows the real score, reload, then use **Pilih Era** and **Menu Utama** to check that results persist.
5. Choose **Ulangi Level**, cancel once to retain the result, then confirm the reset and reload to verify Continue is absent.

Known limitations: progress is local to this browser/device and can be edited or removed by the user; it is not an account-backed or tamper-proof record and does not sync across devices. An unfinished Experiment intentionally restarts safely after reload. Audio playback may need an explicit interaction after reload due to browser autoplay restrictions.

REVO-006 files added: `src/lib/revo/progress.ts`, `src/components/revo/RevoProgressProvider.tsx`, `src/components/revo/RevoLevelCompleted.tsx`, `src/app/revo-lab/industry-1/completion.css`, `tests/revo-progress.test.ts` and `tests/revo-progress.e2e.spec.ts`. Integration updates are in RevoExperience, RevoLab, RevoMainMenu, QuizPanel, MissionPanel, `resourceFilling.ts`, `steamEngine.ts`, the Steam Engine simulation hook, menu/HUD CSS and Playwright configuration; the simulation and menu regression tests were updated for the separated reset actions.

Executed REVO-006 verification:

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 98 passed across 7 files |
| REVO Playwright, production build | 34 passed in 15.0 minutes |
| Studio Playwright | 2 passed (`npm run test:e2e`) |
| Responsive / viewport fit | Completion and persistence flows tested at 5 viewport sizes; existing REVO keyboard, touch and fullscreen regressions also pass |
| Runtime / console | No critical console errors in the REVO browser suite |

The Playwright regression covers menu Continue, reload at exploration/assembly/experiment/reflection/result checkpoints, incomplete and completed mission recovery, score accuracy, malformed/unsupported storage, level reset confirmation, no premature Experiment access, safe pressure, resource filling, transmission, pause/resume, keyboard/touch interactions and responsive fullscreen fit. At that checkpoint, REVO-007 — Audio & Visual Polish was the next task.

## REVO-007 — audio, animation and visual polish

The simulator keeps one lazy Web Audio context, created only after the learner explicitly enables sound. Its low-volume procedural engine, flywheel and loom layers follow simulation speed and fade to silence when the engine stops, the simulator pauses or the learner leaves gameplay. Muting fades the shared output and stops transient effects. A cached noise buffer supports steam sounds without creating a new buffer for every effect. Assembly placement, rejection and mission completion have distinct quiet feedback cues. The saved sound preference never starts playback on page load; browser gesture rules still apply.

The historical narration dialog has a persistent Indonesian transcript and play/replay, pause, resume and stop controls. When browser speech synthesis or an Indonesian voice is unavailable, the transcript stays available and the interface reports that playback is unavailable. The audio hook closes its context and disconnects its sound graph on unmount.

Placement feedback now eases a component into its fixed assembly socket, briefly highlights it and gently returns a rejected part. Reduced-motion preference skips these movement transitions and disables the new entrance animations. Route changes focus the current screen heading, styled with REVO's olive/gold focus indicator. The Main Menu, fullscreen HUD, dialogs, assembly completion and results screen use brief restrained entrances; gameplay rules and simulation equations remain unchanged.

The visual regression captures desktop and mobile versions of the Main Menu, gameplay HUD and completion screen, plus rejected and successful assembly feedback. Its short WebM recording shows the interactive menu, assembly, running engine and result sequence. Playwright's video recorder captures the visual stream only, so the recording has no embedded Web Audio soundtrack; audio behavior is tested separately in a browser.

### REVO-007 verification

| Check | Result |
| --- | --- |
| Typecheck | Passed |
| ESLint | Passed |
| Production build | Passed |
| Vitest | 98 passed across 7 files |
| REVO Playwright, production build | 38 passed in 14.7 minutes |
| Studio Playwright | 2 passed in 27 seconds |
| Visual regression | 8 desktop/mobile and assembly feedback screenshots captured and inspected; interactive WebM demo recorded |
| Audio lifecycle | Browser test confirms sound is opt-in, only one AudioContext is created, sound gains track simulation speed and fade to zero on pause/menu, and preference restores without autoplay |
| Accessibility and viewport | Heading focus, reduced-motion behavior, transcript fallback, mobile fit and no document scrolling passed |
| Runtime / console | No critical browser console errors in the REVO audio/visual suite |

Generated visual artifacts are in `test-results/revo/screenshots/revo-007/`: `main-menu-desktop.png`, `main-menu-mobile.png`, `gameplay-hud-desktop.png`, `gameplay-hud-mobile.png`, `assembly-feedback-wrong-target.png`, `assembly-feedback-correct-snap.png`, `level-completed-desktop.png` and `level-completed-mobile.png`. The short visual recording is `test-results/revo/videos/revo-007/revo-007-interactive-demo.webm`.

Known limitations: speech playback depends on browser speech-synthesis support and an available Indonesian voice; visible transcript remains the fallback. Browser recording contains no soundtrack. The assembly movement and engine sounds are intentionally illustrative and do not represent measurements of a historical machine. **REVO-007 is implemented and awaits PM review. REVO-008 — Final QA & Lecturer Demo Preparation is next.**
