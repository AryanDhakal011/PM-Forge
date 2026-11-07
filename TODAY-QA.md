# Today page QA

## Automated checks

- [x] TypeScript typecheck passes.
- [x] Production build passes.
- [x] Master room list is sourced from `CATEGORIES`; constellation totals are derived from `questions`.
- [x] Progress store is versioned and guarded by try/catch.
- [x] Completed and unfinished runs use the existing IndexedDB run model.
- [x] Table view exposes all seven rooms and reports 63 scenarios.
- [x] Storage failure is surfaced by the local chip state.

## Visual and interaction review

- [x] Desktop row uses a 7/5 case and constellation grid, equal 560px height.
- [x] Tablet row stacks case and constellation; lower cards become two columns.
- [x] Mobile uses a bottom app rail from the existing shell and a simplified full-width constellation.
- [x] Chart supports pointer, focus, and arrow-key value changes.
- [x] Sky and table controls support keyboard selection.
- [x] CTA has press, hover, focus-visible, and route fallback behavior.
- [x] Reduced-motion CSS disables animation and decoration movement.

## Manual verification still needed

- [ ] Compare 1440x900 and 1280x720 screenshots after the dev server is running.
- [ ] Verify Safari and Firefox paint behavior for CSS `:has()`, SVG thread coordinates, and View Transitions fallback.
- [ ] Validate screen-reader announcements for the interactive chart and constellation groups.
- [ ] Measure Lighthouse LCP, CLS, and interaction latency with seeded and populated run data.
- [ ] Exercise Storage failure by blocking IndexedDB/localStorage in browser devtools.
