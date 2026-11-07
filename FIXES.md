# Today Fixes

Correction commit: `d03f6cf` (`Fix Today page correction defects`)

## Closed defects

- D1-D3: Warm-up data is now validated and rendered from scenario-safe fields; invalid warm-ups are omitted and Resume follows the normal card skeleton.
- D4-D5: The chart now uses a 14px inline icon and a vertical `release` marker; the chart SVG preserves its aspect ratio and has one dashed marker.
- D6-D9: Case content is normal-flow, the surface/tab/clip/peek layers are separated, metadata and CTA no longer collide, and peeks point downward.
- D7: The thread exits from the case surface right edge at the metadata-row center and targets the Market Strategy room star.
- D10-D11: Headline sizing, manual hyphen behavior, summary rhythm, and CTA hierarchy were normalized.
- D12-D13: The constellation uses the corrected 420x380 deterministic arm geometry, concentric rings, pulsing target star, canonical codes, and readable legend.
- D14: Canonical room names and codes are provided by the shared rooms module.
- D15-D18: Chart height, spacing, card skeletons, and viewport-safe text/card structure were corrected.
- D19: The existing workspace shell and top-bar local/search/avatar controls remain visible at desktop widths.
- D20: Browser verification covered responsive rendering, chart crosshair controls, view switching, keyboard navigation structure, reduced-motion CSS, and resize behavior.

## Automated verification

- `npm test`: passed, including the Today geometry and warm-up guard tests.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Browser descendant-containment sweep: no `.caseSurface`, `.lowerCard`, or `.constellationPanel` descendant overflow at 1440x900, 1280x720, 1100x800, 768x1024, or 390x844.
- Warm-up leak regex sweep: zero `→`, `MCQ`, or `RF <number>` matches in the rendered document.
