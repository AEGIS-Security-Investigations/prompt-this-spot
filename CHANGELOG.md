# Changelog

All notable changes to this package. Versions follow [Semantic Versioning](https://semver.org/):
a patch for fixes, a minor version for new options or exports, a major version
for breaking changes. The publish workflow uses the section for a version as
its GitHub release notes.

## 0.1.1

- Screenshot captures and uploads have overall deadlines so stalled media or
  network requests show a retryable error and release Copy/Send actions.
- Removing or clearing pending screenshots releases the prompt actions without
  losing the remaining selections or request. Removed queued work is skipped.
- Timed-out rendering restores page layout and disposes its capture context;
  timed-out HTTP uploads are aborted, including stalled response bodies.

## 0.1.0

Initial public npm release as `@brotskyllc/prompt-this-spot`. Earlier installs came from GitHub by commit
and carry the same code.

- "Prompt this spot": pick spots in a React app, screenshot them, mark the
  screenshots up, and copy the prompt or open it in Claude Code.
- "Send feedback": the same capture flow, filed through the host app's
  `submitFeedback`.
- Prompts name the configured repository and the full page URL of each
  capture, with credentials and tokens removed from the URL.
- Entry points: `@brotskyllc/prompt-this-spot`, `@brotskyllc/prompt-this-spot/inspect-prompt` and
  `@brotskyllc/prompt-this-spot/styles.css` (a prebuilt stylesheet for apps without
  Tailwind).
- Ships TypeScript source: add the package to your bundler's list of packages
  to compile (for Next.js, `transpilePackages`).
