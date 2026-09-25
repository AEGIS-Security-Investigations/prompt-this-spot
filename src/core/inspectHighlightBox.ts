/**
 * Coordinate math for the "Prompt this spot" pick-mode highlight overlay.
 *
 * While the inspect drawer is open the app shell is pushed aside by transforming
 * `[data-app-push-root]` (`translateX` + `width` shrink). A transformed ancestor
 * becomes the containing block for its `position: fixed` descendants, so an
 * overlay rendered inside that element is positioned relative to the transformed
 * shell — not the viewport. `getBoundingClientRect()`, however, returns viewport
 * coordinates that already include that transform. Subtracting the container's
 * own viewport origin converts the target rect into the container's coordinate
 * space, so the highlight lands exactly on the element regardless of the push
 * transform or scroll position. Without this the border is offset by the drawer
 * width.
 */

/** A plain, framework-free box for absolutely/fixed-positioning the highlight. */
export interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The bits of a {@link DOMRect} we need from the highlight's container. */
export interface RectOrigin {
  left: number;
  top: number;
}

/**
 * Position the highlight over `target`, expressed relative to `origin` (the
 * container the highlight is rendered into — `[data-app-push-root]`, which
 * carries the push transform). Pass a zeroed origin to fall back to viewport coordinates.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { computeInspectHighlightBox } from "./inspectHighlightBox";
 *
 * test("compensates for the body push transform", () => {
 *   const target = { left: 400, top: 660, width: 120, height: 40 } as DOMRect;
 *   const box = computeInspectHighlightBox(target, { left: 360, top: 0 });
 *   expect(box).toEqual({ left: 40, top: 660, width: 120, height: 40 });
 * });
 * ```
 */
export const computeInspectHighlightBox = (
  target: Pick<DOMRect, "left" | "top" | "width" | "height">,
  origin: RectOrigin
): HighlightBox => ({
  left: target.left - origin.left,
  top: target.top - origin.top,
  width: target.width,
  height: target.height,
});
