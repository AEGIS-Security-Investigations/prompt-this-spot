"use client";

import type { InspectCaptureRect } from "./types";

/**
 * Display types whose box keeps its size once emptied, because the copy pins
 * their computed width and height inline. Inline boxes size to their content,
 * so those are never emptied. A table cell is: its pinned width holds its
 * column open just as its content did. Rows and row groups are kept, so every
 * column still has a cell in every row.
 */
const EMPTIABLE_DISPLAY = new Set([
  "block",
  "flow-root",
  "flex",
  "grid",
  "list-item",
  "table-cell",
]);

/** Positions whose box can be drawn away from its own layout slot. */
const FLOATING_POSITION = new Set(["fixed", "sticky"]);

/**
 * A `filter` for the copy that drops the contents of boxes lying wholly
 * outside the crop, while keeping the boxes themselves.
 *
 * A long table or list is where the time goes: every row is cloned with every
 * computed style inlined, only for all but a few to be cut away by the crop.
 * An element outside the crop still has to be copied, or everything after it
 * would move up, but it can be copied empty: its inline width and height hold
 * its place. A box holding one of the `overlays` (a positioned box drawn over
 * the crop) is kept whole. A descendant that overflows a far-away box
 * all the way into the crop is the one thing this can lose.
 */
export const createOffscreenPruner = (
  rect: InspectCaptureRect,
  root: Element,
  overlays: readonly Element[]
): ((node: Node) => boolean) => {
  const verdicts = new WeakMap<Element, boolean>();

  const isEmptiable = (element: Element): boolean => {
    if (element === root) {
      return false;
    }
    const cached = verdicts.get(element);
    if (cached !== undefined) {
      return cached;
    }
    let verdict = false;
    try {
      const style = window.getComputedStyle(element);
      if (
        EMPTIABLE_DISPLAY.has(style.display) &&
        !FLOATING_POSITION.has(style.position) &&
        !overlays.some((overlay) => element.contains(overlay))
      ) {
        const box = element.getBoundingClientRect();
        const x = box.left + window.scrollX;
        const y = box.top + window.scrollY;
        verdict =
          box.width > 0 &&
          box.height > 0 &&
          (x + box.width <= rect.x ||
            x >= rect.x + rect.width ||
            y + box.height <= rect.y ||
            y >= rect.y + rect.height);
      }
    } catch {
      verdict = false;
    }
    verdicts.set(element, verdict);
    return verdict;
  };

  return (node) => {
    const parent = node.parentElement;
    return !(parent && isEmptiable(parent));
  };
};
