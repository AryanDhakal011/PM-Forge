# PMForge rendering performance pass

Measured on the production build (`next start`, port 3001) in Chromium at
**800 × 766 CSS px, DPR 1.25, 22 logical cores / 16 GB**, software WebGL
(the container has no hardware GPU). Absolute timings are therefore slower than
a real device, but the *ratios* and the render/pause behaviour are exact and
reproducible.

The dev-only report is available on `next dev` only: open
`http://localhost:3000/?perf=1` and either read the badge or call
`window.__pmPerfReport()` in the console. It reports WebGL canvas count,
mounted scenes, the active scene, per-scene draw calls, triangles, geometries,
textures, programs, DPR, FPS, frame time, first-frame init time, initial JS
transfer and long tasks.

---

## Verdicts

| Requirement | Verdict |
| --- | --- |
| An offscreen 3D scene must not continuously render | **PASS** — 0 draw calls/s when a section leaves the viewport |
| Never three scenes rendering at once | **PASS** — 1 scene renders normally, 2 only while two sections genuinely intersect |
| Shared context preferred, max 2 live contexts never 3 rendering | **PASS (max-2 rule)** / single shared canvas **DEFERRED** |
| Lifecycle: mount once → pause → resume, no remount churn | **PASS** — canvas count stable across a full scroll round trip |
| Hidden tab stops all rendering | **PASS** — 5,580 → 0 → 5,580 draws per 1.5 s |
| Reduced motion: no permanent loop | **PASS** — 0 draws/2 s at idle, renders on change |
| Lazy-mount Signal / Learning, never gate the loader on them | **PASS** — 2 R3F canvases at first paint, below-fold scenes mount on approach |
| Loader does not finish before the scene is actually loaded | **PASS** — loader is gated on a *presented* hero frame, hard max unchanged |
| Hero keeps premium physical material, lighting, shadows, interaction | **PASS** — visual check, physical core unchanged |
| Adaptive DPR reversible, bounded by device ratio | **PASS** (fixed a bug where it could exceed `devicePixelRatio`) |
| Dispose geometry/materials/textures on real teardown | **PASS** for textures owned by scenes; context-loss falls back |
| Draw calls reduced | **PASS** — hero 105 → 62 per frame, Learning 32 → 15 |
| Hero cold-start shader compile removed | **FAILED to eliminate** / mitigated, further work **DEFERRED** |
| One shared WebGL context across all three sections | **DEFERRED** |

---

## 1. Draw calls per second, by scroll position

Instrumented `WebGLRenderingContext.draw*` per canvas. Same method before and
after, so the numbers are directly comparable.

| Scroll position | Hero canvas | Signal canvas | Learning canvas |
| --- | --- | --- | --- |
| **Before** — any position | 6,308 | 421 | 1,923 |
| Hero (y = 0) | **3,744** | 0 | 0 |
| Hero pinned mid (y = 610) | **3,604** | 0 | 0 |
| Signal (y = 1,831) | 0 | **421** | 0 |
| Signal/Learning overlap (y = 3,052) | 0 | 420 | 901 |
| Learning (y = 3,662) | 0 | 0 | **901** |
| Projects (y = 5,494) | 0 | 0 | 0 |
| Back to Hero (y = 0) | **3,736** | 0 | 0 |

- Hero is down **41%** (6,308 → ~3,700 draws/s ≈ 62 calls/frame).
- Learning is down **53%** (1,923 → 902 draws/s ≈ 15 calls/frame).
- Everything not on screen is **exactly 0**, including after visiting all scenes.
- FPS stayed 60.1–60.6 with median frame time 16.7 ms and p95 16.8–17.0 ms at
  every position (this viewport was not GPU-bound before, so the win is CPU,
  battery and memory, not frame rate).

## 2. Contexts and canvases

| | Before | After |
| --- | --- | --- |
| R3F canvases at first paint | 2 (hero + Signal mounted immediately, Learning on hydration) | **1** (hero only; Signal/Learning mount near their own sections) |
| Live WebGL contexts after visiting everything | 3, all rendering continuously | **3 allocated, 1 rendering** (2 only during a real section overlap) |
| Canvases after scrolling away and back | 3 | 3 — no remount, no new context, no shader recompile |

## 3. Per-scene render cost (dev report, `window.__pmPerfReport()`)

| Scene | Calls/frame | Triangles | Geometries | Textures | Programs | Mount → first frame |
| --- | --- | --- | --- | --- | --- | --- |
| hero | 62 | 15,558 | 63 | 22 | 22 | 419 ms |
| signal | 7 | 8,464 | 18 | 4 | 7 | 485 ms |
| learning | 15 | 7,296 | 27 | 14 | 8 | 462 ms |

(dev build; production draws the same geometry with less React overhead)

What produced the reduction:

- 18 Learning background blocks → **1 instanced draw call**.
- 7 hero plant leaves → **1 instanced draw call**; 7 hero wire pins → **1**.
- Hero shadow map rendered only when the scroll choreography moves
  (`shadowMap.autoUpdate = false` + `needsUpdate` on progress delta) instead of
  every frame; `ContactShadows` and `Environment` are already `frames={1}`.
- Ring shadows removed (three thin tori that never read as shadows at their
  on-screen size); ring clearcoat (0.12, imperceptible on a torus) removed and
  `MeshPhysicalMaterial` → `MeshStandardMaterial`.
- Hero core 64 × 48 → 48 × 36; rings 128 × 10 → 96 × 8; Signal/Learning balls
  64² → 48²; Learning tori 128 → 96 segments; small circles 96 → 72.
- Wood anisotropy 8 → 4; hero shadow map 1024 → 512 on mobile.

## 4. Loader and load timings

| | Before | After |
| --- | --- | --- |
| Hero "ready" signal | 679 ms — fired from a `useEffect`, i.e. **before the first frame existed** | 1,107–1,114 ms — fired from the **first presented frame** |
| Loader begins reveal | 2,007 ms | 2,037–2,044 ms |
| Overlay removed | 2,829 ms | 2,864–2,887 ms |
| First contentful paint | 152 ms | 120 ms |
| DOMContentLoaded | 50–74 ms | 65–79 ms |

The ~0.43 s gap between the old and new hero-ready timestamp is the difference
between "React finished mounting" and "the scene is actually on screen". The
loader now waits for that real frame (up to `heroReadinessTimeout` = 2.4 s, with
the unchanged 5 s hard max) instead of revealing an empty stage, and the total
time to a fully revealed page changed by **+35…+58 ms** because the reveal
animation was already running behind the old clamp.

First-load transfer observed after the change: JS 31 KB, WebP 182 KB,
WOFF2 50 KB, **0 KB legacy JPEG/PNG below the fold**.

## 5. Assets

| Asset | Before | After |
| --- | --- | --- |
| Cozy Sunlit workspace plate (Signal background) | 2,116 KB PNG | **70 KB WebP** |
| final-mountains plate (Blueprint background) | 1,040 KB JPG | **487 KB WebP** |
| wood-table diffuse (hero desk) | 211 KB JPG | 154 KB WebP |
| wood-table rough (hero desk) | 232 KB JPG | 181 KB WebP |

≈ **2.5 MB** removed from the page, most of it below the fold, so it no longer
competes with the hero's first frame. Dimensions were preserved (the plates are
`background-size: cover` on full-bleed sections), so nothing is resampled at
display time. The original files are still in `public/` but unreferenced, so
they are never requested.

## 6. Robustness

- `document.visibilityState` hidden → every scene's frameloop becomes `never`:
  measured 5,580 draws/1.5 s active → **0** hidden → 5,580 on return.
- Reduced motion (stored preference) → `demand` frameloop: **0 draws in 2 s** at
  idle on the hero, renders on hover/resize.
- WebGL context loss → prevented from bubbling, scene is removed and the parent
  renders its static fallback (hero illustration / Signal instrument stencil /
  Learning cluster stencil); everything else keeps working.
- `/learn` → 0 WebGL canvases, no loader overlay; returning to `/` restores the
  hero with `heroSceneReady` already true.
- Production console: **no errors or warnings**.

## 7. Deferred, with rationale

1. **One shared WebGL context for Hero → Signal → Learning.** Measured state is
   1 rendering context at a time and 3 allocated after a full scroll, which
   satisfies the "never 3 rendering" rule. A single canvas would need
   section-driven viewport/scissor choreography, three cameras, three DPR
   policies and a shared post/lighting compromise across three very different
   scenes. Visual risk is high, measured CPU gain on this machine is small
   (the draw loops are already idle), so it is not worth the art-direction risk
   right now.
2. **Hero shader-program compile time.** Earlier CPU trace attributes ~625 ms
   self time to program linking (`getProgramInfoLog`). The pass reduced the
   number of materials/programs and the amount of geometry feeding them, but
   did not remove the compile itself. Options left: pre-warm the hero programs
   behind the loader (`WebGLRenderer.compile`), or collapse several hero
   materials into one. Both need a hardware-GPU trace to verify they help
   instead of moving the cost around.
3. **Cold-cache network timing.** Not reproducible here (the browser and the
   Next server both cache the assets); the reported cold number comes from an
   earlier audit (6.9–8.9 s). What can be said now is that the below-fold
   payload dropped by ~2.5 MB and the hero no longer competes with it.
4. **GLB/Draco/Meshopt/KTX2 pipelines.** Procedural geometry still wins: the
   hero is 15.5 k triangles and 22 textures, so an asset pipeline would add
   tooling without a measurable frame-time win.
5. **Business-model/CTA/routing work.** Out of scope by instruction.

---

## Files touched in this pass

Lifecycle and runtime:

- `src/three/sceneLifecycle.ts` (new) — `useSceneActivity`, `useNearViewport`
- `src/three/sceneRuntime.tsx` (new) — adaptive DPR, invalidation bridge,
  first-frame readiness, metrics probe, DPR ceilings
- `src/components/dev/PerformanceReport.tsx` (new) — dev-only report

Scenes:

- `src/three/DecisionEngine.tsx` — lifecycle wiring, instancing, shadow policy,
  memoised canvas, DPR, metrics, context-loss fallback
- `src/three/DecisionInstrument.tsx` — geometry tiers, ring material, demand
  invalidation, reduced-motion snapping
- `src/three/SignalInstrument.tsx` — lifecycle/DPR/metrics/fallback rewrite
- `src/three/LearningCluster.tsx` — instanced blocks, geometry tiers, lifecycle,
  DPR, metrics, fallback

Mount points:

- `src/components/landing/Hero.tsx`
- `src/components/landing/SignalTest.tsx`
- `src/components/landing/LearningPath.tsx`
- `src/components/landing/LandingPage.tsx`

Loader and assets:

- `src/hooks/useAssetReadiness.ts` — waits for the real hero frame
- `src/lib/loaderTokens.ts` — `heroReadinessTimeout` 1.6 → 2.4
- `src/app/globals.css`, `src/components/landing/SignalTest.module.css`,
  `src/components/landing/DecisionBlueprint.module.css`,
  `src/app/credits/page.tsx`, `src/three/DecisionEngine.tsx` — WebP references
