# Publication handoff

The owner supplied [the GitHub repository](https://github.com/imchuwy/app-ai-registry), configured as `origin`. Read and write access are verified. The owner authorised publishing the complete application through a pull request and merging after checks. Hosting is a separate, unconfigured release step.

The implementation branch is `codex/portfolio-implementation`, based on the existing personal repository's main branch. Commits use the same personal GitHub no-reply identity as its initial commit. No corporate repository history or settings are included.

## Owner decisions

1. Project source-code licence. Publication does not itself grant an open-source licence.
2. Optional custom domain; the approved hosting destination is GitHub Pages at `https://imchuwy.github.io/app-ai-registry/`.
3. Visual feedback on the OC AI treatment and the simplified small favicon; the supplied raster logo family still lacks a canonical vector master.

## Release steps

- Review the application using only fictional examples.
- Run `npm ci`, `npm run check`, and `npm audit`.
- Inspect the selected Git contents and built output. Keep the local design-reference directory excluded; it contains internal workstation information.
- Preserve the personal repository's existing history and merge the implementation through a checked pull request.
- Publish `dist/` after the hosting destination is agreed and deployment is authorised.
- Verify the actual published subpath, deep links, refresh, fonts and favicon on desktop and a real phone.

## Further validation

Manual screen-reader testing, actual mobile soft-keyboard behaviour and field performance measurements remain release follow-ups. Automated checks and desktop browser resizing are not substitutes for those checks. The app has no shared backend, real authentication, notification delivery, or installable/offline-first PWA capability.
