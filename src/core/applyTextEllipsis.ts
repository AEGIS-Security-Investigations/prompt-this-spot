"use client";

import { clampLines, ELLIPSIS, lineClampCount } from "./lineClampEllipsis";

/** Overflow values that clip the box, and so can trigger truncation. */
const CLIPPING_OVERFLOW = new Set(["hidden", "clip", "auto", "scroll"]);

/** `white-space` values that keep the text on one line. */
const SINGLE_LINE_WHITE_SPACE = new Set(["nowrap", "pre"]);

/**
 * Canvas `font` shorthand for an element's computed text style.
 *
 * Deliberately omits line-height: the canvas shorthand parser rejects some
 * computed values (`normal` combined with a keyword size), and height plays no
 * part in a width measurement.
 */
const fontShorthand = (style: CSSStyleDeclaration): string =>
  `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

/**
 * Width available to the text, in CSS pixels.
 *
 * `clientWidth` already excludes borders and any scrollbar, so only padding has
 * to come off. A negative result means there is no room at all.
 */
const contentWidth = (
  element: HTMLElement,
  style: CSSStyleDeclaration
): number =>
  element.clientWidth -
  Number.parseFloat(style.paddingLeft || "0") -
  Number.parseFloat(style.paddingRight || "0");

/**
 * Only elements whose entire content is text can be safely rewritten.
 *
 * An element with child elements would lose them, and the browser's own
 * truncation of such a subtree is not a simple string operation anyway.
 */
const hasOnlyTextChildren = (element: HTMLElement): boolean => {
  if (!element.hasChildNodes()) {
    return false;
  }
  for (const node of element.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) {
      return false;
    }
  }
  return true;
};

/**
 * The longest prefix of `text` that fits in `available` once the ellipsis is
 * appended, or null when the text already fits.
 *
 * Binary search rather than a character walk: a long label in a narrow column
 * would otherwise cost hundreds of `measureText` calls per element, and this
 * runs over every node in the page.
 *
 * `measure` is injected so the search can be tested without a canvas.
 */
export const truncateToWidth = (
  text: string,
  available: number,
  measure: (value: string) => number
): string | null => {
  if (measure(text) <= available) {
    return null;
  }

  // Not even the ellipsis fits; the browser shows a clipped ellipsis, and an
  // empty string is the closest we can get without drawing outside the box.
  if (measure(ELLIPSIS) > available) {
    return "";
  }

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (measure(text.slice(0, mid) + ELLIPSIS) <= available) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return `${text.slice(0, low).trimEnd()}${ELLIPSIS}`;
};

/**
 * Apply `text-overflow: ellipsis` ourselves, because html2canvas does not.
 *
 * html2canvas 1.4.1 draws the full string and lets the box clip it, so a
 * truncated label renders as a word sliced through the middle of a glyph
 * instead of ending in "…". Every `truncate` in the app hits this — org cards,
 * table cells, sidebar labels — and it reads as a layout bug in the screenshot
 * rather than a rendering limitation.
 *
 * Verified in real Chromium against a browser screenshot of the same card
 * (avatar + `truncate` title + `truncate` subtitle + badge). The rendered
 * string is what changes: the title went from "Orion Security & Investiga",
 * sliced mid-glyph at the box edge, to the browser's exact "Orion Security &
 * Investi…".
 *
 * The pixel delta barely moves (3.28% of pixels over 32/255 before, 3.05%
 * after) and that is expected — it is dominated by html2canvas's own text
 * placement, not by this. Shifting the render down one CSS pixel drops the
 * mean per-channel delta from 3.52 to 1.48, which is the sub-pixel baseline
 * offset and glyph antialiasing documented under fidelity limits. Those are
 * rasteriser limits; the truncated string was a content error, and content is
 * what an agent reads.
 *
 * Both single-line `text-overflow: ellipsis` and multi-line
 * `-webkit-line-clamp` are handled. They need different treatment: the first
 * is a width measurement, the second a height one, since where a clamped
 * paragraph breaks depends on the element's own wrapping.
 *
 * Runs in `onclone`, so every mutation lands on html2canvas's throwaway clone
 * and never on the page the user is looking at.
 */
export const applyTextEllipsis = (clonedDocument: Document): void => {
  const view = clonedDocument.defaultView;
  if (!view) {
    return;
  }

  const context = clonedDocument.createElement("canvas").getContext("2d");
  if (!context) {
    return;
  }

  for (const element of clonedDocument.querySelectorAll<HTMLElement>("*")) {
    try {
      const style = view.getComputedStyle(element);

      // Multi-line clamp: a different mechanism, and the browser puts the
      // ellipsis on the last visible line rather than at a measured width.
      if (
        lineClampCount(style) !== null &&
        CLIPPING_OVERFLOW.has(style.overflowY) &&
        hasOnlyTextChildren(element)
      ) {
        const clampText = element.textContent;
        if (clampText?.trim() && element.clientHeight > 0) {
          clampLines(element, clampText);
        }
        continue;
      }

      if (
        style.textOverflow !== "ellipsis" ||
        !SINGLE_LINE_WHITE_SPACE.has(style.whiteSpace) ||
        !CLIPPING_OVERFLOW.has(style.overflowX) ||
        !hasOnlyTextChildren(element)
      ) {
        continue;
      }

      const text = element.textContent;
      if (!text || !text.trim()) {
        continue;
      }

      const available = contentWidth(element, style);
      if (available <= 0) {
        continue;
      }

      context.font = fontShorthand(style);
      const truncated = truncateToWidth(
        text,
        available,
        (value) => context.measureText(value).width
      );
      if (truncated !== null) {
        element.textContent = truncated;
      }
    } catch {
      // One unreadable node must not abort the screenshot; leave it as-is.
    }
  }
};
