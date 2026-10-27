# Reveal system notes

Last verified: **2026-10-26**

## Design

- One shared `IntersectionObserver` lives in `src/components/ui/Reveal.tsx`. Components never create their own reveal observers.
- The initial hidden state is scoped to `html.js-ready`. The class is only added by the client effect after confirming `IntersectionObserver` exists, so content stays visible without JavaScript.
- Variants: `fade-up`, `paper-settle`, `ink-write`, `draw`, `node-snap`. Each is CSS-first; GSAP is used only where a scroll-scrubbed value is required (hero, beats).
- Nodes unobserve after their first reveal, so a section never re-animates on scroll-back.

## Loader gate and failsafe

- The preloader locks scroll and manages focus during load, then releases with `pmforge:loader-done`.
- Above-the-fold nodes that intersect before the page is ready wait for that event and are released in document order.
- The 2.5-second failsafe reveals only nodes that are currently intersecting the viewport. It does not reveal below-the-fold content early.
- Layout readiness waits for `document.fonts.ready` and for already-loaded images to decode before observing. Decode failures are logged while observation continues.

## Reduced motion

- `prefers-reduced-motion` and the in-page preference both set `data-reduced-motion="true"` on `<html>`.
- In that mode all reveal nodes are visible immediately, with no transform and no clip-path.
- Global CSS forces `animation-duration` and `transition-duration` to near-zero **and** forces `animation-delay` / `transition-delay` to `0ms`, so staggered variants cannot leave content waiting.
- The hero’s `300vh` pin collapses to `100svh` on desktop and to `auto` below 1024 px, so there is no long empty scroll after the hero.
- Lenis is disabled; anchor jumps use instant scrolling.
- The beats show their final state and branch labels immediately.

## Beats

- Each strip is `clamp(120px, 15vh, 168px)` tall (162 px measured at 1440 × 1080).
- The scene is centred and non-interactive; the full sentence is exposed as the section’s accessible label.
- The branch labels (PIVOT / STAY) span the beat width and sit just inside the scene edges. The old `min(26%, 210px)` box clipped longer labels, so the width was removed.
- Scroll progress is written to CSS custom properties (`--beat-*`) inside a `requestAnimationFrame`, with passive scroll and resize listeners.

## Validation

- `npm run typecheck` passes.
- Fresh production build loaded at 1440 × 1080, 390 × 844, and 320 × 844.
- No horizontal overflow at 390 (375 px content) or 320 (305 px content).
- Reduced-motion screenshots at 1440 show every section and footer in its final state, with no missing or clipped content.
- Normal-motion 800 px spot checks show the hero, header, and sticky layers in the expected single copy; a scaled-iframe screenshot artifact can duplicate sticky layers but DOM geometry confirms one element.
- CLS on a fresh normal-motion load: **0.0215** at 1440 and **0.0051** at 390.
