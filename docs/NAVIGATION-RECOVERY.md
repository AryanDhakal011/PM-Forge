# Navigation recovery — 31 October 2026

Port 3001 was served by a long-running development process. Its log showed a repeating sequence of compilation and landing-page requests without intentional navigation. Replacing that process with a production preview stopped the observed cycle. No guest databases or preferences were cleared.

The exact internal trigger for the dev-server invalidations remains unproven. Fresh controlled development sessions, with logs both inside and outside the repository, each stayed at one document load during a 12-second idle check. Logging inside the repository alone did not reproduce the failure.

## Prevention

`npm start` now snapshots the completed `.next` build into ignored `.pmforge-preview/` storage before starting Next. The server uses that snapshot as its `distDir`. Rebuilding the application cannot replace the scripts or manifests underneath the running preview. Restart `npm start` to select a newer build. Keep development on a separate port and stop development before building into its `.next` directory.

During verification, build `LS_cxUdloxYhwDJBy8Blu` completed while port 3001 continued serving pinned build `Rg3FLOvxyhv__kyQeuXQx`. All 53 assets discovered before the rebuild still returned 200 afterwards. See [rebuild isolation evidence](navigation-verification/rebuild-isolation.json).

## Coverage

- Enumerated every `page.tsx`, expanded all 63 scenario slugs, 12 project IDs, three chapter numbers and curriculum slugs: 312 concrete URLs, including recovery fixtures for unavailable run IDs and `/reset.html`.
- All 312 URLs and 53 JavaScript/CSS assets returned 200 after following intended redirects. No reset control was activated.
- The browser sweep rendered all 312 URLs in a disposable Chrome profile. Additional idle, shared-navigation, project-card and mobile checks brought the first pass to 337 rendered screens. No uncaught exceptions, workspace recovery screens or unexpected document reloads were observed.
- Separate click checks exercise landing links, all 12 project entries, workspace sidebar links, Help/Settings/Account, a newly created interview run, actual back/forward navigation, Saved/History and other legacy redirects, and the mobile More dialog. Signup links use the expected existing-guest destination; their intercepted click behavior differs from a raw HTTP request.
- The final reports contain 398 rendered-screen observations and 92 passing navigation/layout assertions across the full sweep and two focused passes. All three reports contain zero runtime errors and zero unexpected reloads.
- Mobile layout checks cover the landing page, Today, Practice, Projects and Settings at 390px and 320px.
- Production compilation and TypeScript checks passed. All 50 default automated tests passed.

Raw results live in [HTTP report](navigation-verification/http.json), [browser report](navigation-verification/browser.json), [landing/project click report](navigation-verification/clicks/browser.json), and [focused journey report](navigation-verification/flows/browser.json). The route sweep can be reproduced with the commands in the README; the additional focused journey checks run with `node scripts/verify-navigation-flows.mjs`.

This verifies local routing and rendered navigation. It does not certify real OAuth provider completion, every possible simulation decision, or the original browser tab's cached development client. A tab loaded from the old dev process needs one manual refresh to switch to the stable preview.
