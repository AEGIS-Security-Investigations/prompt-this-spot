"use client";

import {
  computePaddedElementCaptureRect,
  computeViewportCaptureRect,
} from "./inspectCaptureRect";
import type { InspectCaptureRect } from "./types";

/** Full scrollable page size — the clamp bound for every capture rect. */
const readDocumentSize = () => ({
  documentWidth: Math.max(
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth
  ),
  documentHeight: Math.max(
    document.documentElement.scrollHeight,
    document.documentElement.clientHeight
  ),
});

/**
 * The visible viewport in document coordinates, read from the live page.
 *
 * Called at capture time rather than ahead of it, so a page shot taken with the
 * drawer's app-push transform suppressed measures the un-pushed layout.
 */
export const resolveViewportCaptureRect = (): InspectCaptureRect =>
  computeViewportCaptureRect({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    ...readDocumentSize(),
  });

/**
 * A picked element's padded crop, in document coordinates.
 *
 * Resolved at PICK time, not capture time: by the time the queue reaches the
 * capture the element may have moved or its dialog may have closed, so the
 * rectangle has to be frozen while the element is still where the user saw it.
 */
export const resolveElementCaptureRect = (
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">
): InspectCaptureRect =>
  computePaddedElementCaptureRect({
    rect,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    ...readDocumentSize(),
  });
