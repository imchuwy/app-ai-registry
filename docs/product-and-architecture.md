# Product and architecture

Status: locally implemented; publication pending. Updated 17 November 2026.

## Product

An interactive portfolio application showing how an AI inventory, assessment workflow, transparent risk model and review history fit together. Visitors start with ten fictional examples and change only their own browser data.

The OC AI Trail Sunset palette, mascot and semantic CSS tokens supersede the earlier visual concept. The working application uses neutral surfaces, coral actions, readable data and modest motion. System, Light and Dark preferences resolve before rendering. Inter and Manrope are bundled locally. No externally hosted fonts are loaded.

Primary destinations: Overview, Registry and Methodology. The assessment has two stages, About and Assessment. Case entries separate Overview, Assessment and Activity. Demo roles and maintenance tools live in the navigation.

## Data and rules

One schema-validated snapshot contains a revision, current policy and records. Each record has a version, answers, independent review flags, a workflow status, saved assessment evidence and local activity. Save draft invalidates the current workflow approval without deleting historical evidence. Submit captures a new immutable-by-workflow evidence object. Reviews need an explanation and only apply to active cases awaiting review. Archive/restore preserves history. Permanent deletion requires the administrator role and a UI confirmation.

The synthetic role check is in the service as well as the UI. This prevents confusing demo transitions but is explicitly not authentication. Reviewer visibility is filtered before calculating charts or showing registry rows.

All four answers must be present before a score is calculated. The example factors are complexity, potential impact, audience reach and reliance, each 0–3. Risk bands are configurable. Saved assessments retain their policy version and original boundaries. Charts use the current policy without mutating saved evidence. The distribution chart groups bands; its drilldown includes each case's numeric score.

The original dataset has 9 active records, 1 archived record and 7 active plotted cases. The meeting-notes case is an unfinished draft; the expense checker is rules-only. A grouped scatter point contains three equal-coordinate cases. Examples include Low, Medium and High scores, plus a Medium case with a separate sensitive-information review flag.

## Persistence

`oc-ai-registry-v1` contains the browser snapshot. Seeding happens only when no data is present. Schema failures do not silently overwrite saved data; editing is blocked until an explicit reset. Storage failures fall back to memory with a persistence warning. Tab events refresh readable snapshots; the service compares the persisted value before writes and record versions before edits. This is optimistic protection, not a transactional or collaborative database.

Dates and IDs in seed fixtures are deterministic. Real visitor actions use the local clock and generated IDs; tests inject both dependencies. Browser theme preference has its own key and is independent of demo reset.

## UI responsibilities

The shell owns routing, theme controls, simulated role and global notices. Screens own local filters, active tabs and form state. The service owns transitions and persistence. Pure domain functions own calculations. Native HTML controls, semantic tables and buttons are preferred over a general component framework.

Shared components include page headings, risk labels, review flags, floating previews, information popovers and native confirmation dialogs. Scatter geometry uses the measured container width. Mark numbers are membership counts; case titles appear in the preview and comparison table. Popovers do not dim or lock the page. Confirmations for reset/deletion are modal.

The form reserves the measured action-bar height plus 24px. Safe-area padding is applied at the bottom. Mobile columns wrap and secondary details expand in the existing row. No page-level horizontal scrolling is intended.

## Acceptance criteria

- Exactly ten synthetic examples on a clean start; saved changes survive reload and reset restores the seed.
- Create, edit, draft, submit, review, comment, archive, restore, delete, export and policy updates work locally.
- Counts, group membership, bands and saved/current evidence agree with the shared domain model.
- No original organisation identity, corporate settings, personal records or deployment configuration appears in the publishable tree.
- Application data and fonts stay local; no real account, model, email or database is connected.
- Mobile retains a readable table and charts fit their containers; menu opening does not alter row height.
- Light, Dark and System are usable; focus, dismissal, forms, long labels and narrow layouts are reviewed.
- Fresh install, types, lint, tests and production build pass; publish only the audited static output.

## Change log

- 17 November 2026: implemented the independent static application, generic domain rules and browser service; adopted the supplied OC AI design kit; added deterministic examples, responsive screens, theme control, tests and publication documentation.
