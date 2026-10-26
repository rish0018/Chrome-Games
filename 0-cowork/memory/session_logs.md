## 2026-10-26 — React + TS migration

**Worked on:** Ported GesturePlay to Vite + React 19 + TS + Tailwind v4 with a DOM-free engine, MediaPipe hand tracking and a redesigned UI.
**Decisions made:** Dino→Flappy at 2000 stays core; distance-based Dino score and +10 per pipe pair; model and WASM self-hosted; gesture and manual are a persisted control-mode setting; practice modes show the hand skeleton to verify gestures; birds respawned at heights that force ducking; ground shifted up 40px because the original drew feet off-canvas; Flappy bird hovers until the first flap.
**Files changed:** everything under `src/`, `public/`, config files; originals moved to `legacy/`.
**Validation:** tsc 0 errors, 26 vitest tests pass, build OK, headless Chrome run with fake camera: 0 console errors, all flows pass.
**Open items:** gesture accuracy on a real hand untested by me; delete `legacy/` once parity confirmed; deploy is user's.
**Watch out for:** No external runtime requests (fonts are self-hosted since the pixel redesign); `public/` ships about 34 MB of WASM and model.

## 2026-10-26 — Pixel redesign

**Worked on:** Replaced the vector/glass look with a hand-authored pixel-art system (sprites, day/night sky, effects) and a warm paper + sky + Game Boy LCD UI with self-hosted fonts.
**Decisions made:** 400x200 art grid at 2x engine units; sprites composed from rectangles and tested against hitboxes; cacti/pipes tiled from a cap + 1-row body; sky cycles day->dusk->night across 0-2000, Flappy opens at dawn; dither dissolve for the transition; component CSS in a layer; modals fixed full-screen; ligatures off; Space no longer blocked on focused buttons.
**Files changed:** `src/art/*`, `src/engine/render/*`, all `src/components/*`, `src/index.css`, `index.html`, `public/favicon.svg`, hooks (`useSnappedWidth`, `useKeyboardInput`).
**Validation:** tsc 0 errors, 57 tests pass, build OK, headless Chrome flow with 0 console errors and 0 external requests; desktop and 390px phone screenshots reviewed.
**Open items:** sprite art quality is a first pass (tweak on feedback); real-hand gesture accuracy untested; `legacy/` still holds the originals.
**Watch out for:** narrow phones (<400px) scale the canvas fractionally; pixel fonts lack some glyphs, so keep UI text ASCII.
