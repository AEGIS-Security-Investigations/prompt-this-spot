"use client";

import type { InspectCaptureRect } from "./types";

/** Sub-pixel slack when testing whether one box contains another. */
const CONTAIN_TOLERANCE_PX = 1;

export interface CaptureRoot {
  element: HTMLElement;
  /** The root's border box, in document coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Positioned boxes drawn over the crop, all inside `element`. */
  overlays: Element[];
  /**
   * How far the root's content moves down once the root stops sharing its
   * children's top margin (see `measureCollapsedMargin`). Zero for `<html>`.
   */
  contentShift: number;
}

/**
 * The top margin a block root's first child lends it.
 *
 * In the page, that margin collapses through the root and sits above it, so
 * the root's box starts at the child's border. In the copy the root is the
 * outermost box, so the same margin would land inside the SVG and push every
 * line down by it. The copy is made a `flow-root`, which keeps the margin
 * inside the root, and the crop is moved down by the same amount. Measured by
 * switching the live root to `flow-root` for one synchronous layout, which
 * the browser never paints.
 */
const measureCollapsedMargin = (element: HTMLElement): number => {
  if (
    !element.firstElementChild ||
    window.getComputedStyle(element).display !== "block"
  ) {
    return 0;
  }
  // The child's own position doesn't change; the root's top edge moves up to
  // take the margin in, and that distance is the shift.
  const before = element.getBoundingClientRect().top;
  const previous = element.style.getPropertyValue("display");
  const priority = element.style.getPropertyPriority("display");
  element.style.setProperty("display", "flow-root", "important");
  const after = element.getBoundingClientRect().top;
  element.style.setProperty("display", previous, priority);
  if (!previous) {
    element.style.removeProperty("display");
  }
  return Math.max(0, before - after);
};

const documentBox = (element: Element) => {
  const box = element.getBoundingClientRect();
  return {
    x: box.left + window.scrollX,
    y: box.top + window.scrollY,
    width: box.width,
    height: box.height,
  };
};

const intersects = (a: InspectCaptureRect, b: InspectCaptureRect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const contains = (outer: InspectCaptureRect, inner: InspectCaptureRect) =>
  outer.x <= inner.x + CONTAIN_TOLERANCE_PX &&
  outer.y <= inner.y + CONTAIN_TOLERANCE_PX &&
  outer.x + outer.width >= inner.x + inner.width - CONTAIN_TOLERANCE_PX &&
  outer.y + outer.height >= inner.y + inner.height - CONTAIN_TOLERANCE_PX;

/**
 * Whether the copy of `element` would be drawn where the element is.
 *
 * The root of the copy is placed at the SVG's origin and sized to its own box,
 * so anything that moves a box away from its layout position (a transform, or
 * a `fixed` / `sticky` / offset position) would shift the whole screenshot.
 */
const isStableRoot = (style: CSSStyleDeclaration): boolean =>
  (style.transform === "none" || style.transform === "") &&
  (style.position === "static" ||
    (style.position === "relative" &&
      ["0px", "auto"].includes(style.top) &&
      ["0px", "auto"].includes(style.left)));

/**
 * Positioned boxes that cover part of the crop — a stuck header, a floating
 * toolbar, an open popover, a handle laid over a card. They are often rendered
 * away from the picked element in the DOM (a portal, the app shell, a sibling),
 * so the copied subtree has to be widened until it includes them.
 */
const findOverlays = (
  rect: InspectCaptureRect,
  skip: (element: Element) => boolean
): Element[] => {
  const overlays: Element[] = [];
  for (const element of document.body.querySelectorAll("*")) {
    if (skip(element)) {
      continue;
    }
    const { position } = window.getComputedStyle(element);
    if (
      (position === "fixed" ||
        position === "sticky" ||
        position === "absolute") &&
      intersects(documentBox(element), rect)
    ) {
      overlays.push(element);
    }
  }
  return overlays;
};

/**
 * The smallest element whose copy can stand in for the page inside `rect`.
 *
 * Copying the whole document costs a computed-style read and an inline style
 * for every node on the page, which on a long table runs to seconds. The crop
 * only needs the subtree that paints it, so start from what is under the crop
 * and climb until an ancestor's box covers the crop, sits where it is laid
 * out, and contains every fixed or sticky box drawn over the crop.
 *
 * Falls back to `<html>`, which is always correct, just slower.
 */
export const resolveCaptureRoot = (
  rect: InspectCaptureRect,
  skip: (element: Element) => boolean
): CaptureRoot => {
  const html = document.documentElement;
  const fallback: CaptureRoot = {
    element: html,
    x: 0,
    y: 0,
    width: Math.max(html.scrollWidth, html.clientWidth),
    height: Math.max(html.scrollHeight, html.clientHeight),
    overlays: [],
    contentShift: 0,
  };

  const centerX = rect.x + rect.width / 2 - window.scrollX;
  const centerY = rect.y + rect.height / 2 - window.scrollY;
  if (
    centerX < 0 ||
    centerY < 0 ||
    centerX >= html.clientWidth ||
    centerY >= html.clientHeight
  ) {
    return fallback;
  }

  const overlays = findOverlays(rect, skip);
  fallback.overlays = overlays;

  const start = document
    .elementsFromPoint(centerX, centerY)
    .find((element) => !skip(element));
  if (!start) {
    return fallback;
  }

  for (
    let element: Element | null = start;
    element && element !== html && element !== document.body;
    element = element.parentElement
  ) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const box = documentBox(element);
    if (
      contains(box, rect) &&
      isStableRoot(window.getComputedStyle(element)) &&
      overlays.every((overlay) => element?.contains(overlay))
    ) {
      return {
        element,
        ...box,
        overlays,
        contentShift: measureCollapsedMargin(element),
      };
    }
  }
  return fallback;
};
