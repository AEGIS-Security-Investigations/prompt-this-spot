"use client";

import html2canvas from "html2canvas";
import { applyTextEllipsis } from "./applyTextEllipsis";
import { flattenTranslucentBackgrounds } from "./flattenTranslucentBackgrounds";
import { computeCaptureScale } from "./inspectCaptureRect";
import {
  createColorConverter,
  sanitizeUnsupportedColors,
} from "./sanitizeUnsupportedColors";
import type { InspectCaptureRect } from "./types";
import { replaceUnsupportedColorFunctions } from "./unsupportedColorFunctions";

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

/**
 * The page's own background colour, so a dark-mode capture isn't matted onto
 * white where the layout leaves gaps.
 *
 * Normalised through the same colour converter as the cloned tree: this value
 * is handed straight to html2canvas's parser, so a `color(srgb …)` here would
 * throw before a single node was rendered.
 */
const resolvePageBackground = (): string => {
  const convert = createColorConverter();
  const normalize = (value: string): string =>
    replaceUnsupportedColorFunctions(value, convert);

  const bodyBackground = window.getComputedStyle(document.body).backgroundColor;
  if (bodyBackground && !bodyBackground.startsWith("rgba(0, 0, 0, 0")) {
    return normalize(bodyBackground);
  }
  const rootBackground = window.getComputedStyle(
    document.documentElement
  ).backgroundColor;
  if (rootBackground && !rootBackground.startsWith("rgba(0, 0, 0, 0")) {
    return normalize(rootBackground);
  }
  return FALLBACK_BACKGROUND;
};

/**
 * Rasterize a rectangle of the live document to a PNG data URL.
 *
 * `rect` is in document coordinates (page origin), which is what html2canvas's
 * `x`/`y`/`width`/`height` crop options expect. The tool's own drawer, launcher,
 * and hover highlight are excluded via `[data-inspect-ignore]` so the screenshot
 * shows the app exactly as the reviewer sees it, minus our chrome.
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

  const canvas = await html2canvas(document.documentElement, {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    scale,
    // Render the clone at the real viewport size so responsive breakpoints
    // resolve the same way they do on screen.
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    backgroundColor: resolvePageBackground(),
    useCORS: true,
    allowTaint: true,
    logging: false,
    removeContainer: true,
    ignoreElements: (element) => element.hasAttribute(IGNORE_ATTR),
    // Fires after the clone (and its pseudo-element stand-ins) is built but
    // before html2canvas parses it — the only point where modern colour
    // functions can be rewritten ahead of the parser that chokes on them.
    onclone: (clonedDocument) => {
      sanitizeUnsupportedColors(clonedDocument);
      // Order matters: the sanitizer has now reduced every modern colour
      // function to `rgba()`, which is the form this pass matches on.
      flattenTranslucentBackgrounds(clonedDocument);
      // Last: it measures text against the clone's laid-out box widths, so it
      // must see the final styles.
      applyTextEllipsis(clonedDocument);
    },
  });

  return canvas.toDataURL("image/png");
};
