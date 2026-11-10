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
Menu → Era selection → Learning Objectives / Briefing → Explore → Assembly → Experiment → Reflection → Learning Summary
```

- **Era selection and briefing:** Industry 1.0 is playable from briefing to final summary. Its briefing introduces four proposed learning objectives that can also be opened in the gameplay HUD and reviewed in the final summary. Industry 2.0 has a separate flow through briefing, exploration, assembly, and experiment. Industry 3.0 and 4.0 remain locked.
- **Explore:** Inspect the boiler, steam pipe, piston mechanism, flywheel, and textile machine. Every component must be explored once.
- **Assembly:** Install those five parts in their fixed sockets, then answer three conceptual questions about steam generation, rotary motion, and factory power. The 3D drag interaction has inventory/socket controls for keyboard and touch users.
- **Experiment:** Run the engine explicitly. Observe motion and output above zero, inspect transmission hotspot T during Experiment, and keep the educational pressure scale at or below 75. Choose **Lanjut ke Refleksi** when the evidence is complete. There is no production target, waiting period, automatic completion, or stop at 100. Any crossing above 75 invalidates the safe attempt; emergency protection at 90 remains unchanged.
- **Reflection and results:** Submit the three-question history quiz to see the score and learning takeaways. Results report actual exploration, assembly, safety, production, and quiz state.

The simulator does not start automatically. Pause, dialogs, route changes, and hidden tabs stop simulation time, resource consumption, production, moving machinery, and engine audio.

## Machine model

The scene is a teaching model labelled **INGGRIS, MODEL ±1800**. The energy path is represented as:

```text
Boiler → Steam pipe → Piston → Crank → Flywheel → Belt → Line shaft → Bevel gears → Loom
```

Steam pressure drives reciprocating piston motion. A connecting rod and crank convert that motion to rotation; the flywheel helps smooth rotation. Belts, shafts, and a right-angle gear stage represent how power can reach textile machinery. Historical factory layouts varied, so this is not a reconstruction of one specific mill or a mechanically complete engineering assembly.

The simulator is deterministic and dimensionless. Its 0–100 readings are teaching scales, not physical units or operating guidance. It does not model real thermodynamics, combustion, steam mass flow, efficiency, or valve timing. Fuel and water controls, cooling, pressure release, safety thresholds, production, and experiment retries are governed by the model in `src/lib/simulation/steamEngine.ts` and `src/lib/simulation/simulationConstants.ts`.

## Progress and reset behavior

Progress is stored in the browser at `revo:industry-1:progress`, schema version 2. The app validates saved IDs, answers, and stage dependencies before restoring progress. It saves exploration, assembly, knowledge checks, experimental observations, reflection, level results, and sound preference.

An unfinished experiment is restored in a safe, stopped state; active resource filling never resumes. Saved observations are distinct from live machine readings. The engine always reloads stopped with fresh resources and zero current output; measured observation records remain available. Saved audio preference does not bypass the browser's user-gesture requirement for playback.

- **Reset machine** stops the machine and cancels active filling while retaining observed production and safety history.
- **Retry experiment** resets experiment conditions while retaining exploration and assembly.
- **Retry assembly** clears placements and knowledge checks but retains exploration.
- **Retry level** clears the Industry 1.0 journey and saved record after confirmation.

Saved data is local to one browser/device. It is not account-backed, tamper-proof, or synchronized across devices.

## Audio, motion, and accessibility

Sound is opt-in. A single lazy Web Audio context supplies quiet procedural engine, flywheel, loom, steam, placement, rejection, and completion cues. The simulation bed follows engine speed and fades out when gameplay pauses. Indonesian browser speech synthesis has visible transcript fallback and play, pause, resume, and stop controls.

The interface supports keyboard navigation, visible focus, reduced-motion preferences, native accessible dialogs, screen-reader labels, and responsive fullscreen layouts. If WebGL is unavailable, learning descriptions, controls, observation guidance, and quiz remain usable. Lower-end devices may have reduced frame rates, and speech playback depends on browser support and installed Indonesian voices.

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

## REVO-008R.1 — lecturer feedback revision

The interface now prioritizes learning objectives, readable explanations, observations, and historical reflection for Grade XII at SMAN 16 Bandung. The mission panel, 100-unit requirement, and mission completion dialog were removed. Machine geometry, thermodynamic teaching equations, filling animations, safety latch, audio opt-in, narration transcript, pause, assembly interactions, and the three historical reflection questions remain in place.

The shared `RevoLearningObjectives` card has a dark industrial green background, warm white text, and yellow action verbs. Proposed wording (still subject to teacher validation):

1. Mengidentifikasi komponen utama mesin uap dan menjelaskan fungsinya.
2. Menjelaskan bagaimana mekanisme piston, batang penghubung, dan engkol menghasilkan gerak putar yang diteruskan ke roda gila.
3. Mendemonstrasikan bagaimana tenaga mekanis disalurkan menuju mesin tenun.
4. Menganalisis peran mekanisasi dalam perubahan proses produksi pada Revolusi Industri pertama.

### Deterministic observation rules

`src/lib/revo/experiment.ts` derives evidence from actual simulation samples, separate from display animations. Reflection requires all five exploration IDs, five installed assembly parts, three correct assembly checks, and:

- The engine has actually been running.
- A running sample has speed at least 5 on the model’s 0–100 scale and cumulative production above zero. This movement criterion is a state measurement, not a waiting period.
- Production output has been observed above zero (including fractional output, before the whole-unit counter reaches 1).
- The student opens **Informasi Transmisi Tenaga** (T) during Experiment (or opens the same dialog using **Pelajari transmisi tenaga (T)**, the keyboard/mobile/WebGL fallback).
- No pressure crossing above the model threshold 75 occurred and recorded peak pressure is ≤75.

The explicit **Lanjut ke Refleksi** button stops the engine and finalizes this evidence. Production can continue beyond 100 if the student continues observing. No timer or animation grants completion. Machine reset and venting cannot erase unsafe history; **Ulangi eksperimen** clears that attempt and dependent reflection while preserving exploration and assembly. Assembly reset revokes dependent completion; full replay clears the full level only after confirmation.

The internal `RevoLevelCompleted` screen now says **PEMBELAJARAN SELESAI** and reports real component counts, check counts, measured production/pressure/transmission evidence, and score computed from submitted quiz answers. Gameplay completion is evidence of participation and correct in-game answers, not proof of all historical learning outcomes.

### Question clarity

The piston assembly check now has four options and explicitly distinguishes the connecting rod/crank (motion conversion) from the flywheel (steadier rotation). Correct answer B and explanatory feedback use the lecturer's proposed wording. Existing historical reflection items, scoring, imperfect-score completion, and retry behavior remain intact.

### Save migration

The storage key remains `revo:industry-1:progress`. V2 includes validated observation values and flags. V1 known exploration IDs, valid placements/checks, reflection drafts/results, and dependency-valid completed levels migrate to V2. A V1 completed experiment receives explicit `legacyCompleted` provenance: its original completion is honored, but missing measurements and T inspection are **not fabricated**. The summary states that details were not stored. An incomplete V1 experiment must collect new observation evidence; valid exploration and assembly are retained. Invalid downstream flags are revoked, malformed/future-version data use the existing fallback, and the engine never auto-starts after reload.

### Readability and limits

Content text is generally 16–18px on desktop and 15–16px on compact screens. Supporting metadata is smaller; the 320px stage bar uses compact labels. The final CSS layer improves educational card, quiz, component, control, warning, and summary text contrast while retaining REVO colors. The factory remains the main workspace; sidebars, briefing, dialogs, and summary scroll internally. Objectives pause the experiment while open and return keyboard focus when closed.

This is not a full WCAG conformance certification. Contrast checks and six viewport checks are recorded in [the revision audit](REVO-008R1.md). Teacher validation, classroom testing, and a broader assistive-technology/browser/device audit remain outstanding. Mechanical geometry, full audiovisual review, and asset accuracy belong to REVO-008R.2.


### Verified checkpoint — 2 November 2026

Typecheck, lint, production build, and 79 unit tests passed. The browser sequence validated 43 unique scenarios across the full suite and focused reruns: the first full run passed 39/42; its three findings were corrected and a 14/14 rerun passed; the final filling/learning run passed 11/11. All six lecturer viewport sizes passed. See [the revision audit and exact run accounting](REVO-008R1.md) and [selected before/after screenshots](revo-008r1-media/README.md). No classroom validation or production deployment is claimed.


## REVO-008R.1.1 — UI consistency

Water actions use blue with droplet icons, fuel actions use amber with flame icons, and ordinary decrement actions use a neutral surface. Shared answer cards provide visible selection, correct/incorrect labels and icons, and keyboard focus. Learning progression, simulation formulas, questions, and scoring remain as documented above. See [the UI/UX audit](REVO-008R1-1.md) for measured contrast, the 98→79 test-count reconciliation, verification results and [before/after evidence](revo-008r1-1-media/README.md).

The [REVO-009A readiness audit](REVO-009A.md) documents the Industry 2.0 learning design, isolated state/progress architecture, remaining REVO-008R.2 work, implementation backlog, and criteria required before a student trial.

The [REVO-009B.1 report](REVO-009B1.md) documents the implemented Industry 2.0 briefing and exploration, the independent save format, the test runs, and the remaining work before school validation.

The [REVO-009B.2 report](REVO-009B2.md) documents the functional electrical and mechanical connections, concept checks, V1→V2 save migration, and browser evidence.

The Main Menu shows a separate resume choice for each era with a valid save. From the lab, use the stage rail to review unlocked stages and **Pilih Era** to switch eras. In Industry 2.0, **Ulangi Perakitan** preserves completed exploration; the separate HUD reset returns Industry 2.0 to its briefing. Both leave the Industry 1.0 save intact. See the [cross-era contract and browser evidence](REVO-009B2-1.md).

After seven inspections, five connections, and three correct concept checks, open **Uji Penggerak**. Press **Mulai** and use the three switches to compare normal operation, power loss, disconnected transmission, and an obstructed conveyor. Use **Catat observasi** in each condition. **Reset Eksperimen** clears those observations and preserves Assembly. Reload restores valid observations with the machine stopped. Industry 2.0 Reflection and the learning summary are unavailable. See the [experiment report](REVO-009B3.md) for the simplified model and validation limits.

[REVO-009B.3R](REVO-009B3R.md) compares the two eras before and after the visual redesign across six viewports. The [REVO design system](REVO-DESIGN-SYSTEM.md) documents shared component information, controls, typography, and layout. The Industry 2.0 laboratory adds camera focus options without changing learning progress or experiment rules.

[REVO-009B.3R.1](REVO-009B3R1.md) documents the compact steam inspector, shared gameplay navigation, and before/after checks with component information open.
