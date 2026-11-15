# Account-free portfolio showcase

Production walkthrough on 15 November 2026, revision `21d907c`.

- Vercel reported successful deployments for the app and reader. The production signup URL for Career Studio returned 307 directly to the requested workspace route.
- The live landing page showed Open workspace. Opening the full scenario led directly to the guided Easy preflight. The live Projects library and The Pivot Point entrance opened without signing in. Career Studio showed the local download flow.
- A local production build at `127.0.0.1:3002` opened a scenario from an old signup link, began the interview, committed a typed answer and retained the conversation on reload. Hot Seat started a guided room. A fictional case was authored, marked ready, selected, and exported through the Share tab.
- The export regression passed. It exercises simulation labeling, HTML escaping, and exclusion of private, draft, unconfirmed, unselected, and attached material. Typecheck, production build, portfolio suite, and Hot Seat suite passed.

The showcase keeps work in the visitor's browser. Visitors can download backups and an HTML portfolio, and use the browser print dialog to save that file as PDF. Account-based sync, hosted publication, and generative Hot Seat remain part of the earlier account-enabled scope.

The Share tab references the quiet, project-focused editorial spacing from [Office Commun](https://officecommun.com/), found through Subframe. The implementation uses PMForge's existing panels, buttons and case reader.
