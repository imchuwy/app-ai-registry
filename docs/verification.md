# Verification

Updated 17 November 2026. This file distinguishes completed checks from release follow-ups. The final verification uses Node 24; the supported minimum is Node 22.13.

## Automated checks

- Strict TypeScript checking and ESLint: passed.
- An isolated clean copy installed successfully with `npm ci` and passed the complete check pipeline. The workstation's npm launcher reported Node 22.8 engine warnings; upgrade the local Node installation to the documented minimum before routine development.
- Domain tests cover incomplete answers, every band boundary, ten-record seed validation, plotted/archived counts, overlapping group membership, saved/current policy separation, review completion, simulated visibility and CSV formula escaping.
- Service tests cover reload persistence, draft/submission transitions, review explanations, role restrictions, archive/restore/delete, stale records and stale tabs, corrupt/incompatible data, in-memory fallback, quota failure, policy changes, deterministic reset and storage isolation.
- 29 domain and service tests passed.
- Production Vite build generates a static `dist` directory with relative assets and no server runtime. Build passed; informational dependency annotation warnings do not affect output.
- npm audit after patched dependency upgrades: zero reported vulnerabilities, including development dependencies, on the verification date.
- Bundled application JavaScript is approximately 352 KB (106 KB gzip); CSS is approximately 28 KB (7 KB gzip). Two local variable fonts total approximately 73 KB. Optimised brand images total approximately 53 KB. These are build sizes, not field-performance measurements.

## Browser review

The development preview was used exclusively with synthetic local data. Desktop and mobile reviews covered Light and Dark, the responsive registry table, floating actions, and chart group counts. At 320px and 390px the registry document width did not exceed the viewport. The grouped scatter button labelled 3 opened exactly three cases.

On a 320px viewport, the two-stage form saved a draft; reload retained the selected reliance answer and completed review checklist. Submit changed the record to Awaiting review with a calculated score. Switching to Demo Reviewer allowed an explained approval and Activity displayed the decision. Administrator threshold changes incremented the methodology version. Explicit reset restored 10 cases, 9 active and 7 plotted, and policy version 1.

The form's action bar was visually checked at the viewport bottom. Native reset confirmation initially focused Cancel. No production data or hosted application was accessed.

The production build was served under `/portfolio/` on a separate local static server. Assets loaded correctly and refreshing a case deep link retained the case. The distribution popup listed its four Medium cases. Responsive chart resizing was checked at 320, 390, 768 and 1024px; after layout settled, the 320px dashboard had no horizontal overflow. Screenshots are saved in `docs/screenshots/`.

The publishable source and built text were scanned for excluded organisation identifiers, internal hosting IDs and local workstation paths. The supplied local design kit is preserved but ignored by Git and excluded from the static build. Font and dependency notices are retained.

## Not yet measured

- Field Core Web Vitals, a real mid-range mobile device or throttled mobile network.
- Full screen-reader audit and physical phone soft-keyboard/safe-area testing.
- Public hosting or a personal GitHub workflow run; neither has been authorised/configured yet.

Accessibility is a design target, not a certification. Local checks do not establish production availability or a public release.
