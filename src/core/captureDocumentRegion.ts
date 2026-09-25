"use client";

import { createContext, destroyContext, domToPng } from "modern-screenshot";
import { createOffscreenPruner } from "./createOffscreenPruner";
import { computeCaptureScale } from "./inspectCaptureRect";
import { pinScrollAnchoredElements } from "./pinScrollAnchoredElements";
import { resolveCaptureRoot } from "./resolveCaptureRoot";
import type { InspectCaptureRect } from "./types";

/** Marks the tool's own UI so it never appears in a screenshot. */
const IGNORE_ATTR = "data-inspect-ignore";

/**
 * Longest-edge ceiling in device pixels. Keeps the encoded PNG comfortably
 * under the platform's ~4.5MB request body cap while staying legible.
 */
const MAX_CAPTURE_DIMENSION_PX = 2000;

/** Rendered at >1x so small UI text survives the screenshot. */
const PREFERRED_CAPTURE_SCALE = 2;

/** Fallback when the page background is transparent/unset. */
const FALLBACK_BACKGROUND = "#ffffff";

/** Gives up on a render that stalls on an image or font that never loads. */
const CAPTURE_TIMEOUT_MS = 15_000;

const isTransparent = (color: string): boolean =>
  !color || color === "transparent" || color.startsWith("rgba(0, 0, 0, 0)");

/**
 * The colour behind the crop: the first opaque background from the copied
 * root up through its ancestors, so a dark-mode capture, or a card list on a
 * grey panel, isn't matted onto white where the layout leaves gaps.
 */
const resolveBackdrop = (root: Element): string => {
  for (
    let element: Element | null = root;
    element;
    element = element.parentElement
  ) {
    const { backgroundColor } = window.getComputedStyle(element);
    if (!isTransparent(backgroundColor)) {
      return backgroundColor;
    }
  }
  return FALLBACK_BACKGROUND;
};

const isIgnored = (node: Node): boolean =>
  node instanceof Element && node.hasAttribute(IGNORE_ATTR);

/**
 * Inherited properties the copy's root must carry itself. Below `<html>` the
 * root would otherwise inherit from the SVG document instead of from its real
 * ancestors, and text would sit at a different line height or in another font.
 */
const INHERITED_TEXT_PROPERTIES = [
  "color",
  "direction",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-variation-settings",
  "font-weight",
  "letter-spacing",
  "line-height",
  "text-align",
  "text-indent",
  "text-rendering",
  "text-transform",
  "visibility",
  "white-space",
  "word-spacing",
  "-webkit-font-smoothing",
] as const;

const pinInheritedText = (source: Element, clone: HTMLElement): void => {
  const computed = window.getComputedStyle(source);
  for (const property of INHERITED_TEXT_PROPERTIES) {
    const value = computed.getPropertyValue(property);
    if (value) {
      clone.style.setProperty(property, value);
    }
  }
};

const isInsideIgnored = (element: Element): boolean =>
  Boolean(element.closest(`[${IGNORE_ATTR}]`));

/**
 * Take the window's own scroll back out of the copy.
 *
 * `restoreScrollPosition` shifts the children of every scrolled element by its
 * scroll offset, which is right for a scrolled panel. The document is scrolled
 * too, but the crop is already in document coordinates, so that shift would
 * count the page scroll twice. An identity matrix is reset to `none` rather
 * than left in place, because any transform on `<body>` would become the
 * containing block for the page's `fixed` elements.
 */
const undoDocumentScrollShift = (clone: Element): void => {
  const { scrollLeft, scrollTop } = document.documentElement;
  if (!scrollLeft && !scrollTop) {
    return;
  }
  for (const child of clone.children) {
    if (!(child instanceof HTMLElement || child instanceof SVGElement)) {
      continue;
    }
    const matrix = new DOMMatrix(child.style.transform || "none");
    matrix.e += scrollLeft;
    matrix.f += scrollTop;
    child.style.transform = matrix.isIdentity ? "none" : matrix.toString();
  }
};

/**
 * Rasterize a rectangle of the live document to a PNG data URL.
 *
 * The browser paints the screenshot itself: the page is copied into an SVG
 * `<foreignObject>` with every computed style inlined, and that SVG is drawn to
 * a canvas. Unlike a re-implementation of CSS (html2canvas, which this
 * replaced), it gets the same layout, fonts, `object-fit`, shadows, gradients,
 * ellipses, line clamps and modern colour functions the user is looking at.
 *
 * `rect` is in document coordinates (page origin). Only the smallest subtree
 * that paints the crop is copied (`resolveCaptureRoot`), at its real size so
 * responsive breakpoints resolve as on screen, and the SVG's viewBox crops it
 * to `rect`, so only the crop is rasterized. The tool's own drawer, launcher
 * and hover highlight are excluded via `[data-inspect-ignore]`.
 */
export const captureDocumentRegion = async (
  rect: InspectCaptureRect
): Promise<string> => {
  const scale = computeCaptureScale({
    width: rect.width,
    height: rect.height,
    maxDimension: MAX_CAPTURE_DIMENSION_PX,
    preferredScale: PREFERRED_CAPTURE_SCALE,
  });
  const root = resolveCaptureRoot(rect, isInsideIgnored);
  const isDocument = root.element === document.documentElement;
  const pins = pinScrollAnchoredElements(document, isInsideIgnored, root);
  const isOnscreen = createOffscreenPruner(rect, root.element, root.overlays);

  try {
    const context = await createContext(root.element, {
      scale,
      backgroundColor: resolveBackdrop(root.element),
      timeout: CAPTURE_TIMEOUT_MS,
      filter: (node) => !isIgnored(node) && isOnscreen(node),
      // A scrolled panel (a table, a sidebar, the app's main pane) keeps the
      // rows the user can see instead of snapping back to its first row.
      features: { restoreScrollPosition: true },
      onCloneNode: (clone) => {
        if (clone instanceof HTMLElement) {
          if (isDocument) {
            undoDocumentScrollShift(clone);
          } else {
            pinInheritedText(root.element, clone);
            if (root.contentShift) {
              clone.style.setProperty("display", "flow-root", "important");
            }
          }
          // The copy is placed at the SVG's origin; a margin would push it off.
          clone.style.setProperty("margin", "0", "important");
          pins.apply(clone);
        }
        // The copy has now been laid out at the root's real size. From here
        // on the context's size is the output size: the crop.
        context.width = rect.width;
        context.height = rect.height;
      },
      onCreateForeignObjectSvg: (svg) => {
        svg.setAttribute(
          "viewBox",
          `${rect.x - root.x} ${rect.y - root.y + root.contentShift} ${
            rect.width
          } ${rect.height}`
        );
        const foreignObject = svg.querySelector("foreignObject");
        foreignObject?.setAttribute("x", "0");
        foreignObject?.setAttribute("y", "0");
        foreignObject?.setAttribute("width", String(root.width));
        foreignObject?.setAttribute(
          "height",
          String(root.height + 2 * root.contentShift)
        );
      },
    });

    try {
      return await domToPng(context);
    } finally {
      destroyContext(context);
    }
  } finally {
    pins.release();
  }
};
