# App UX

The Registry adopts the OC AI v1.2 visual language. Edit the local semantic palette in src/tokens.css, interactions in src/styles.css and serving assets in public/. The contrast check reads the app palette directly.

## Acceptance criteria

- Light, Dark and System work with bundled branding and fonts.
- Current navigation and chart selections remain visible when focus moves.
- Popovers use the raised surface and respect reduced motion.
- Risk values use consistent numerals. Assessment errors identify the affected field.
- Development, validation and production builds run from the app alone.

## Change log

- 20 November 2026: adopted the standalone template's interaction states, disclosure motion and validation patterns. Moved required foundations into the app and separated the reusable template.
