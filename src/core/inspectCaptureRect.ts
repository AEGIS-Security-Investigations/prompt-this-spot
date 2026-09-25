import type { InspectCaptureRect } from "./types";

/**
 * Smallest context band drawn around a picked element, in CSS pixels. Small
 * targets (an icon button, a badge) get at least this much of their
 * surroundings so the AI can see what they sit next to.
 */
const MIN_PADDING_PX = 80;

/** Padding grows with the element so large regions keep proportional context. */
const PADDING_RATIO = 0.35;

/** Ceiling so picking a full-width section doesn't drag in the whole page. */
const MAX_PADDING_PX = 320;

/** Guards against a zero-size crop when an element is collapsed/hidden. */
const MIN_CAPTURE_SIZE_PX = 16;

export interface ElementCaptureRectContext {
  /** Element box in viewport coordinates (getBoundingClientRect output). */
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  /** Current horizontal scroll offset (window.scrollX). */
  scrollX: number;
  /** Current vertical scroll offset (window.scrollY). */
  scrollY: number;
  /** Full scrollable document width. */
  documentWidth: number;
  /** Full scrollable document height. */
  documentHeight: number;
}

/**
 * How much surrounding page to include around an element of this size. Scales
 * with the larger edge, then clamps into [MIN, MAX].
 */
export const computeElementCapturePadding = (
  width: number,
  height: number
): number => {
  const scaled = Math.round(Math.max(width, height) * PADDING_RATIO);
  return Math.min(MAX_PADDING_PX, Math.max(MIN_PADDING_PX, scaled));
};

/**
 * Convert a picked element's viewport box into a document-coordinate crop that
 * includes a padded band of the surrounding page, clamped to the document.
 *
 * The extra padding is the point of the element screenshot: the AI needs to see
 * where in the UI the target sits (which card, which toolbar, which column),
 * not just the target in isolation.
 */
export const computePaddedElementCaptureRect = ({
  rect,
  scrollX,
  scrollY,
  documentWidth,
  documentHeight,
}: ElementCaptureRectContext): InspectCaptureRect => {
  const padding = computeElementCapturePadding(rect.width, rect.height);

  const left = rect.left + scrollX - padding;
  const top = rect.top + scrollY - padding;
  const right = rect.left + scrollX + rect.width + padding;
  const bottom = rect.top + scrollY + rect.height + padding;

  // Clamp to the document so a capture never renders past the page bounds
  // (which produces blank bands and inflates the upload for no context gain).
  const clampedLeft = Math.max(0, Math.floor(left));
  const clampedTop = Math.max(0, Math.floor(top));
  const clampedRight = Math.min(documentWidth, Math.ceil(right));
  const clampedBottom = Math.min(documentHeight, Math.ceil(bottom));

  return {
    x: clampedLeft,
    y: clampedTop,
    width: Math.max(MIN_CAPTURE_SIZE_PX, clampedRight - clampedLeft),
    height: Math.max(MIN_CAPTURE_SIZE_PX, clampedBottom - clampedTop),
  };
};

/**
 * The currently visible viewport, in document coordinates — the crop used for
 * a "capture the page" screenshot.
 */
export const computeViewportCaptureRect = ({
  scrollX,
  scrollY,
  viewportWidth,
  viewportHeight,
  documentWidth,
  documentHeight,
}: {
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  documentHeight: number;
}): InspectCaptureRect => {
  const x = Math.max(0, Math.floor(scrollX));
  const y = Math.max(0, Math.floor(scrollY));

  return {
    x,
    y,
    width: Math.max(
      MIN_CAPTURE_SIZE_PX,
      Math.min(viewportWidth, documentWidth - x)
    ),
    height: Math.max(
      MIN_CAPTURE_SIZE_PX,
      Math.min(viewportHeight, documentHeight - y)
    ),
  };
};

/**
 * Render scale for a crop: sharper than 1x for legible text, but never so large
 * that the PNG blows past the upload cap. Capped by `maxDimension` pixels on the
 * longest edge.
 */
export const computeCaptureScale = ({
  width,
  height,
  maxDimension,
  preferredScale,
}: {
  width: number;
  height: number;
  maxDimension: number;
  preferredScale: number;
}): number => {
  const longestEdge = Math.max(width, height, 1);
  return Math.max(1, Math.min(preferredScale, maxDimension / longestEdge));
};
