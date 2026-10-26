# Project Instructions

Use live code evidence before planning or editing. Make the smallest safe change. Preserve existing behavior unless the user explicitly asks to change it.

## Context
GesturePlay — a browser game that plays the Chrome Dinosaur runner (morphs into Flappy Bird at score 2000) using hand gestures read from the webcam via TensorFlow.js Handpose. React + TypeScript static app (Vite), deployable on Vercel with no backend. The original vanilla version is kept in `legacy/` until parity is confirmed.

## Tech Stack
| Layer | Technology |
|---|---|
| Language | TypeScript (strict) |
| Framework | React 19 + Vite, Tailwind CSS v4 |
| Hand tracking | `@mediapipe/tasks-vision` HandLandmarker, model + WASM self-hosted in `public/` |
| Database | None (localStorage: settings, high scores, calibration) |
| Tests | Vitest (node environment, pure logic only) |

## Project Structure
- `src/engine/` — DOM-free game logic: `game.ts` (phase machine, 60 Hz fixed step, 2000-point switch), `dino.ts`, `flappy.ts`, `constants.ts`; `render/` holds canvas drawing
- `src/hand/` — `gesture.ts` (rotation-invariant classifier + smoother), `calibration.ts`, `useHandTracking.ts` (camera + model lifecycle)
- `src/hooks/` — settings, high scores, keyboard/pointer input
- `src/components/` — screens, overlays, camera panel, calibration modal
- `public/models`, `public/mediapipe/wasm` — self-hosted model and runtime (no CDN or other external requests at runtime)
- `legacy/` — original HTML/CSS/JS

## Key Entry Points
- **App**: `src/App.tsx` — screen routing, camera-needed prompt, owns the single `useHandTracking` instance
- **Game**: `src/engine/game.ts` — `update(dt, input)`; read `phase`, `stage`, `score`
- **GameScreen**: `src/components/GameScreen.tsx` — wires input (gesture or manual) into the canvas loop

## Build & Run
- **Dev**: `npm run dev`
- **Build**: `npm run build` (typecheck + Vite); output `dist/`
- **Test**: `npm test`
- **Env required**: none; webcam needs https or localhost

## Pixel art system
- Art grid is 400x200; one art pixel = 2 engine units, so sprite size x2 must equal the hitbox (sprite tests enforce this). The canvas is 400x200 with `image-rendering: pixelated`; `useSnappedWidth` keeps the on-screen width a multiple of 400.
- Sprites live in `src/art/sprites/*`, built with `compose()` (rectangles/pixels into a grid) and registered via `defineSprite`; every sprite is validated by `sprites.test.ts`. Cacti and pipes are assembled from a cap, a 1-row body stretched with `drawSpriteScaled`, and a base.
- Palette: `src/art/palette.ts` (canvas + UI) mirrors the `--color-*` tokens in `src/index.css`; `palette.test.ts` fails on drift.
- Sky/day-night is a pure function of mode, stage and score (`src/art/atmosphere.ts`). Visual effects (dust, feathers, shake, dissolve) are derived from frame state in `src/engine/render/effects.ts`, so the engine emits no events.
- Fonts are self-hosted via `@fontsource` (Press Start 2P for headings/HUD, Pixelify Sans for body). Ligatures are disabled. No emoji or non-ASCII arrows in UI text: the pixel fonts may lack the glyphs.
- UI component classes (`px-box`, `px-btn`, `lcd`...) live in `@layer components` in `index.css` so Tailwind utilities can override them. Modals are `fixed` full-screen.

## Conventions
- Engine stays free of React and DOM; physics constants live in `src/engine/constants.ts` (60 Hz tick units)
- Game state mutates in place and is read per frame via refs; React state only for UI-visible changes
- Gestures are named `index`, `peace`, `none`; control modes are `gesture` and `manual`
- localStorage goes through `src/lib/storage.ts` (memory fallback, validated reads, versioned keys)

## Design & Planning Rules

1. Never plan, defer, exclude, simplify, or mark anything "not needed" without first checking the relevant live source files.

2. Never invent, replace, or shrink schema. Inspect existing migrations, models, validators, `types.ts`, API contracts, and mappings first, then extend the current shape.

3. Never assume subsystem behavior such as sync, cache, Redis, auth, jobs, storage, state, permissions, routing, billing, or import/export. Inspect the implementation before describing or changing it.

4. Every assumption must become one of:
   - verified code evidence
   - a specific clarification question
   - an explicit unresolved risk

5. Existing behavior found in live code must be preserved and included in the plan unless code proves it obsolete or the user explicitly asks to remove it.

6. Any plan without file-level evidence is invalid and must not be treated as actionable.

## Required Plan Format

Every implementation plan must include:

### Code Evidence Checked
List the files, functions, routes, components, schemas, migrations, validators, tests, or configs inspected.

### Confirmed Existing Behavior
State what the checked code currently does.

### Proposed Change
Describe the smallest safe change that solves the confirmed problem.

### Risks / Unknowns
List anything not verified, unclear, environment-dependent, or outside the inspected scope.

### Not Deferred
Confirm that no required behavior, field, branch, route, migration, test, or edge case was skipped without evidence.

## Working Style

Don't present a menu of next steps and ask the user to choose. Identify the highest-priority, highest-impact next step, recommend it with brief reasoning, then list subsequent steps in order. Make the recommendation — don't outsource the decision.

## Communication Style

Be direct. Sound like a senior engineer, not a language model.

**Be direct and specific:**
- State findings plainly — "this can be nil" not "there may be a potential null reference issue"
- Reference exact locations — `file:line`, function name, variable name
- State opinions as opinions — "I don't think this is right" not "it might be worth considering whether"
- Skip pleasantries — no "great question", "hope this helps", "let me know if you have questions"
- Question design decisions bluntly — "why do we need this?", "is this necessary?"

**Language patterns to avoid:**
- Filler: "It's important to note", "It's worth mentioning", "In order to" (→ "to"), "That being said", "Moving forward"
- Overused words: "leverage" → "use", "utilize" → "use", "facilitate" → "help", "ensure" → "make sure", "robust" → "solid", "comprehensive" → "full", "seamless" → skip, "enhance" → "improve"
- Hedging: "I think maybe we could consider" → state the opinion; "It would seem that" → state the fact
- Padding: "Furthermore", "Additionally", "Moreover", "In conclusion" → drop or use "also"
- Meta-commentary: "This approach works by..." → just describe it; "The benefit of this is..." → state the benefit directly

## Development Execution Rules

1. Stay on the requested task only. Do not refactor, redesign, rename, reformat, optimize, or touch unrelated code unless explicitly required.

2. Before editing, identify the exact affected files, functions, routes, components, schemas, and tests.

3. Keep changes limited to the confirmed scope.

4. Make the smallest safe change that solves the confirmed problem while preserving existing behavior.

5. Follow existing project patterns for naming, structure, formatting, validation, logging, errors, tests, and architecture.

6. Do not introduce new patterns, dependencies, APIs, files, environment variables, or requirements unless the task requires them.

7. Prefer small diffs over rewrites.

8. Handle errors where the existing code expects them to be handled.

9. Add or update tests when behavior changes.

10. Do not weaken, delete, skip, or bypass tests to make the build pass.

11. Do not remove code, fields, branches, tests, routes, feature flags, migrations, or edge-case handling unless proven unused or explicitly requested.

12. Do not add comments that restate the code. Add comments only when they explain non-obvious intent, constraints, or tradeoffs.

13. Do not over-engineer abstractions for one use case.

14. Explain tradeoffs only when they affect the implementation.

15. Do not use placeholder code, fake package names, imaginary methods, invented APIs, or guessed file paths.

16. If implementation reveals new scope, stop and report it as `Scope Discovered`. Do not expand the task silently.

17. Do not "clean up while here." Cleanup must be directly required for the task or separately requested.

18. After changes, verify affected imports, types, call paths, tests, and runtime behavior.

## Quick Checks

Before returning code, confirm:

- Relevant files were inspected before planning or editing.
- Existing behavior was identified and preserved.
- Public APIs, schemas, routes, migrations, and contracts were preserved unless intentionally changed.
- The diff is limited to the requested task.
- No unrelated refactor, rename, reformat, redesign, or optimization slipped in.
- Imports, types, call paths, and runtime paths were checked.
- Error handling follows the existing project pattern.
- Tests were added or updated for intentional behavior changes.
- No tests were weakened, deleted, skipped, or bypassed.
- No placeholder code, fake package names, imaginary methods, guessed files, or invented requirements were introduced.
- Anything not verified was reported as a risk or clarification question.

## Output Rules

Every final response after implementation must include:

### Changed Files
List each changed file and what changed.

### Behavior Changed
Describe the user-visible or system behavior that changed.

### Behavior Preserved
Call out important existing behavior that remains intact.

### Verification Run
List commands, tests, type checks, lint checks, builds, or manual checks run.

### Verification Not Run
List anything not run and why.

### Risks / Follow-up
Mention only real risks, unresolved unknowns, or follow-up work discovered during implementation.

## Notes
- Generated by dn-setup on 2026-10-26 — review and edit to add project-specific rules
