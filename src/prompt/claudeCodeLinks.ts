/**
 * Builders for "open Claude Code with this prompt pre-filled" links used by the
 * inspect-prompt drawer's "Send to Claude Code" controls.
 *
 * Both targets pre-fill the prompt but never auto-submit it — Claude Code shows
 * the text and waits for the user to review and send. We hand-encode with
 * {@link encodeURIComponent} (spaces -> %20, newlines -> %0A) rather than
 * `URLSearchParams` (which encodes spaces as `+`) to match the format the
 * Claude Code deep-link handler expects.
 *
 * `repoSlug` is the GitHub `owner/name` of the app being inspected. It comes
 * from `PromptThisSpotConfig.repoSlug`; without it the link opens Claude Code
 * with no repository selected.
 */

/**
 * Link that opens Claude Code on the web (claude.ai/code) with the prompt and
 * the repository pre-filled. Works for anyone signed into claude.ai with
 * GitHub authorized — no local install required.
 */
export const buildClaudeCodeWebUrl = (
  prompt: string,
  repoSlug?: string
): string =>
  `https://claude.ai/code?prompt=${encodeURIComponent(prompt)}` +
  (repoSlug ? `&repositories=${encodeURIComponent(repoSlug)}` : "");

/**
 * `claude-cli://` deep link that opens the user's locally installed Claude Code
 * in their existing clone of the repository with the prompt pre-filled.
 * Requires Claude Code v2.1.91+; if the protocol handler isn't registered the
 * browser simply does nothing, so the web button remains the reliable default.
 */
export const buildClaudeCodeDeepLink = (
  prompt: string,
  repoSlug?: string
): string =>
  "claude-cli://open?" +
  (repoSlug ? `repo=${encodeURIComponent(repoSlug)}&` : "") +
  `q=${encodeURIComponent(prompt)}`;
