"use client";

/**
 * The character the browser appends when it truncates. Matches the rendered
 * glyph for `text-overflow: ellipsis`, not three periods.
 */
export const ELLIPSIS = "\u2026";

/**
 * Cut `text` at `index`, backing up to the previous word boundary.
 *
 * Packing the last line to the character keeps more text than the browser does:
 * Chromium ends a clamp on the last whole word ("…in the app, and…"), not
 * mid-word ("…in the app, and esca…"). A single unbroken word longer than the
 * box has no boundary to back up to, so it keeps the character cut rather than
 * collapsing to nothing.
 */
export const endAtWordBoundary = (text: string, index: number): string => {
  const cut = text.slice(0, index);
  const endsMidWord = index < text.length && !/\s/.test(text.charAt(index));
  const wordSafe = endsMidWord ? cut.replace(/\s+\S*$/, "") : cut;

  return wordSafe.trimEnd() || cut.trimEnd();
};

/**
 * Trim a `-webkit-line-clamp` element down until its own clamp height fits,
 * then end it with an ellipsis.
 *
 * html2canvas does clamp the visible line count correctly, so the block is the
 * right height either way — what it drops is the trailing "…" the browser
 * draws on the last line. Verified in Chromium: the browser renders
 * "…in the app, and…" where the capture rendered "…in the app, and".
 *
 * Measured by mutating the clone and reading `scrollHeight`, because line
 * breaking depends on the element's own width, font and hyphenation rules —
 * re-deriving that from text metrics would be guesswork. Binary search keeps
 * it to ~log n reflows for the elements that actually overflow.
 *
 * That reflow is the one real cost in this file: measured at ~550ms for a
 * pathological 200-clamped-element page, so roughly 2.5ms per element that
 * overflows. A realistic capture region holds a handful, and the surrounding
 * html2canvas render plus PNG encode and upload dominate either way. If a
 * screen ever does make this hurt, the fix is to narrow the search with a
 * proportional first guess (`clientHeight / scrollHeight`) rather than to drop
 * the measurement.
 */
export const clampLines = (element: HTMLElement, text: string): void => {
  const fits = () => element.scrollHeight <= element.clientHeight;

  element.textContent = text;
  if (fits()) {
    return;
  }

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    element.textContent = `${text.slice(0, mid).trimEnd()}${ELLIPSIS}`;
    if (fits()) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  element.textContent = `${endAtWordBoundary(text, low)}${ELLIPSIS}`;
};

/** The clamp count, or null when the element is not line-clamped. */
export const lineClampCount = (style: CSSStyleDeclaration): number | null => {
  const raw =
    style.getPropertyValue("-webkit-line-clamp") || style.webkitLineClamp;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
