# prompt-this-spot

Shared source for the "Prompt this spot" inspector and the "Send feedback"
widget. Several apps install this repository by commit and receive every change
merged to `main` through an automated update PR, so a change here ships to all
of them.

- Keep the package app-neutral. Auth, storage, product names, brand colors and
  copy about a specific app go behind `PromptThisSpotConfig`
  (`src/config/PromptThisSpotConfig.tsx`), never into the code.
- Never change a `data-testid` or a `localStorage` / `sessionStorage` key.
  Apps' end-to-end tests select on the test IDs, and changing a storage key
  resets every user's saved preferences.
- Imports are relative. There is no `@/` alias here, and an app's alias would
  resolve to the app's own files.
- This is a public repository. Never commit secrets, internal URLs, customer
  data, or ticket IDs.
- Run `bun run check` (typecheck, biome, tests) before pushing. Tests live in
  `test/`, mirroring `src/`.
- After changing Tailwind classes in `src`, run `bun run build:css` and commit
  `styles/prompt-this-spot.css`, the prebuilt stylesheet for apps without
  Tailwind.
- Apps compile the TypeScript source with their own settings, so the source
  must pass under strict flags such as `noUncheckedIndexedAccess`.
- A new export that apps need goes in `src/index.ts`.
- Once publishing to npm is on (`NPM_PUBLISH`), a change to what the package
  ships (`src`, the prebuilt stylesheet, dependencies) raises `version` in
  `package.json`; CI fails otherwise. Never downgrade it.
- Never point an app at a commit that isn't on `main`. Branch commits vanish
  when the branch is deleted, and the apps' update workflow refuses to move
  such a pin.
- Adding a peer dependency, or raising one's minimum version, is a breaking
  change for every app: call it out in the PR.
