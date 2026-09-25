/** Wrapper around app chrome that shifts when the inspect drawer is open. */
export const APP_PUSH_ROOT_SELECTOR = "[data-app-push-root]";

/**
 * Returns the app shell element that receives the inspect-drawer push transform.
 * The inspect tool chrome is rendered outside this node so it stays viewport-fixed.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { APP_PUSH_ROOT_SELECTOR } from "./getAppPushRoot";
 *
 * test("push root selector is stable", () => {
 *   expect(APP_PUSH_ROOT_SELECTOR).toBe("[data-app-push-root]");
 * });
 * ```
 */
export const getAppPushRoot = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(APP_PUSH_ROOT_SELECTOR);
