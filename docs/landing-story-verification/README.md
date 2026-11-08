# Landing storybook motion

Implemented November 8, 2026. Preview: http://localhost:3002/.

## Chapter direction

- Hero: preserve the existing paper-card entrance and airplane flight; the headline gently lifts as the reader leaves.
- Monday morning: clock hands fast-forward through three rotations; Saturday/Sunday labels resolve to Monday, 9:02. Both hands agree with the displayed time. Work requests arrive as paper notes.
- First decision: the three signal lines arrive separately, the chart draws, and the release marker becomes visible. Scenario choices still work.
- Practice to proof: the three paths unfold as the reader reaches them.
- Portfolio proof: a paper record straightens into place, followed by its evidence rows and labeling stamps.
- Starting scenarios and simulations: cards settle individually, including when stacked on phones.
- Trust: small seals settle into place.
- FAQ: questions move slightly into alignment; disclosure interaction stays native.
- Closing: the clock settles into the quieter Friday scene.
- Footer: the wordmark rises gently into place.

Thin rules and small folded corners tie the chapters together. Motion follows native scroll and reverses naturally when scrolling back; there is no pinning or scroll interception.

## Implementation constraints

One scoped GSAP/ScrollTrigger controller loads dynamically. Most animation changes transforms or opacity; the clock updates cached DOM references without React state on each frame. The SVG chart uses stroke offset. No new animation dependencies, WebGL, decorative polling loop, permanent will-change layers, animated layout dimensions, or artificial scroll pauses were added.

Each controller is reverted on unmount or motion preference changes. A debounced size observer refreshes triggers after FAQ expansion and demo content changes. Fonts also trigger a refresh. Individually stacked artifacts have their own viewport triggers so their animations do not finish before the reader reaches them.

Content remains available without the animation library. Reduced motion skips the controller and leaves the clock at its final time. Animated clock labels are hidden from assistive technology; the stable accessible label says Monday, 9:02.

## Verification

- Production build and TypeScript check passed.
- Default `npm test` passed, including clock bounds, final hand angles, and label/hand agreement throughout the montage.
- Browser checked all 11 chapter hooks and the enabled motion controller.
- Observed intermediate clock labels and final Monday, 9:02; inspected final hand transforms and CSS rotation.
- Tested scenario selection and its evidence/next-check reveal; tested FAQ expansion and anchor navigation.
- Checked document width at 320, 375, 768, 1024, and 1440 px: no horizontal document overflow.
- Inspected phone signal/composer-free demo layout and desktop FAQ layout visually.
- Enabled Reduced motion through Settings, verified no story controller or animated signal styles and the final static clock, then restored the original setting.
- Fixed the rotation unit issue found by browser inspection (`0deg`, rather than invalid `0`) and a GSAP warning from applying DOM-only defaults to the clock's plain progress object. No new landing warning appeared after rebuilding.
- Screenshot: `clock-chapter.png`.

These are local browser checks, not a measured FPS, Lighthouse, low-end physical-device, or field Core Web Vitals certification. Those measurements remain separate release QA.

## Inspiration consulted

A real Subframe MCP inspiration search was performed for editorial storytelling, scroll animation, paper typography, playful clocks and timelines. References included [Life Stories](https://lifestories.org/), [The Vessel](https://vessel-magazine.no/), [Motion Grid](https://wannathis.one/online-tools/motion-grid), and [Money in Check](https://moneyincheck.org/). The implementation retains PMForge's existing typography, colors, components, and interaction patterns.
