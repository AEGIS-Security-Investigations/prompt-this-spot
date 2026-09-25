import type { CSSProperties } from "react";

import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";

/**
 * Every viewport-fixed launcher that can float over a page.
 *
 * They are built independently and each picks its own corner, so nothing stops
 * two of them landing on the same one: a host app's AI assistant button is
 * typically pinned to `bottom-6 right-6`, and the feedback widget *defaults* to
 * `bottom-right` (deliberately opposite the inspector's `bottom-left`). Without
 * the stack they sit directly on top of each other.
 */
export type FloatingLauncherId =
  | "ai-assistant"
  | "user-feedback"
  | "inspect-prompt";

/**
 * Who gets the corner itself when several launchers land in the same one,
 * nearest first.
 *
 * The host app's AI assistant ("ai-assistant") is the anchor because it is the
 * one launcher with no way to move it — it is a plain product button, not a
 * draggable tool — so everything else stacks above it. The capture launchers
 * follow, and the engineer-only inspector
 * sits furthest out: it is the launcher fewest people ever see, and both of
 * them can be dragged to another corner by anyone who wants a different order.
 */
export const FLOATING_LAUNCHER_STACK_ORDER: readonly FloatingLauncherId[] = [
  "ai-assistant",
  "user-feedback",
  "inspect-prompt",
];

/**
 * Distance between two stacked launchers, edge to edge of their slots.
 *
 * The tallest launcher is the feedback / inspector pill at 44px (`py-3` around
 * a 20px icon), so 64px leaves a 20px gap — wide enough that neither pill's
 * shadow touches the other, and clear of the 44px minimum tap target on a
 * phone.
 */
export const FLOATING_LAUNCHER_STACK_STEP_PX = 64;

/** Which corner each currently mounted launcher is anchored to. */
export type FloatingLauncherCorners = Partial<
  Record<FloatingLauncherId, InspectPromptLauncherCorner>
>;

/**
 * Which slot a launcher occupies in its own corner: 0 is the corner itself, 1
 * is one step in from it, and so on.
 *
 * Launchers anchored elsewhere are ignored, so dragging one out of a crowded
 * corner closes the gap behind it rather than leaving a hole.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { resolveFloatingLauncherSlot } from "./floatingLauncherStack";
 *
 * test("resolveFloatingLauncherSlot", () => {
 *   expect(
 *     resolveFloatingLauncherSlot({
 *       id: "user-feedback",
 *       corner: "bottom-right",
 *       corners: { "ai-assistant": "bottom-right" },
 *     })
 *   ).toBe(1);
 * });
 * ```
 */
export const resolveFloatingLauncherSlot = ({
  id,
  corner,
  corners,
}: {
  id: FloatingLauncherId;
  corner: InspectPromptLauncherCorner;
  corners: FloatingLauncherCorners;
}): number => {
  // The caller's own corner wins over whatever it last registered: a launcher
  // must resolve its slot on the first render, before its registration effect
  // has run, or it would paint one frame in the corner and then jump.
  const occupants = { ...corners, [id]: corner };
  return FLOATING_LAUNCHER_STACK_ORDER.filter(
    (candidate) => occupants[candidate] === corner
  ).indexOf(id);
};

/**
 * The offset that lifts a stacked launcher clear of the one in front of it.
 *
 * A transform rather than an overridden `bottom` / `top` on purpose: the
 * launchers do not share one base inset — a bottom-anchored launcher is lifted
 * above the mobile bottom nav below `lg` — so a transform composes with
 * whatever that inset resolves to at the current breakpoint instead of having
 * to restate it for each one.
 */
export const getFloatingLauncherStackStyle = (
  corner: InspectPromptLauncherCorner,
  slot: number
): CSSProperties | undefined => {
  if (slot <= 0) {
    return undefined;
  }
  const distance = slot * FLOATING_LAUNCHER_STACK_STEP_PX;
  // Top-anchored launchers stack downwards, bottom-anchored ones upwards —
  // either way the stack grows towards the middle of the viewport.
  const offset = corner.startsWith("top-") ? distance : -distance;
  return { transform: `translateY(${offset}px)` };
};
