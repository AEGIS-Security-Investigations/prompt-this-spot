/**
 * Whether the in-app feedback launcher should mount in this browser.
 *
 * Eligibility (decided by the host app) is independent of this. A seeded E2E
 * user is often eligible, and would otherwise get a viewport-fixed button on
 * every page. That button sits at bottom-right — the same corner as most
 * sticky Save bars — and can intercept clicks meant for them.
 *
 * Automated browsers (`navigator.webdriver`) therefore skip the launcher
 * unless the dedicated widget spec opts in. Real users are unaffected.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { shouldMountUserFeedbackLauncher } from "./shouldMountUserFeedbackLauncher";
 *
 * test("shouldMountUserFeedbackLauncher", () => {
 *   expect(
 *     shouldMountUserFeedbackLauncher({
 *       eligible: true,
 *       isAutomatedBrowser: true,
 *       e2eOptIn: false,
 *     })
 *   ).toBe(false);
 * });
 * ```
 */
export const shouldMountUserFeedbackLauncher = ({
  eligible,
  isAutomatedBrowser,
  e2eOptIn,
}: {
  eligible: boolean;
  isAutomatedBrowser: boolean;
  e2eOptIn: boolean;
}): boolean => eligible && (!isAutomatedBrowser || e2eOptIn);
