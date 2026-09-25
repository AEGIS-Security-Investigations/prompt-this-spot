"use client";

import {
  hasUnsupportedColorFunction,
  replaceUnsupportedColorFunctions,
} from "./unsupportedColorFunctions";

/**
 * Properties html2canvas reads colours from. Longhands only — reading the
 * `border` / `background` shorthands off a computed style gives inconsistent
 * results across browsers, and writing them back would clobber unrelated parts
 * of the declaration.
 */
const COLOR_PROPERTIES = [
  "color",
  "background-color",
  "background-image",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
  "caret-color",
  "box-shadow",
  "text-shadow",
  "fill",
  "stroke",
] as const;

/**
 * Resolve any CSS colour the browser understands down to `rgba()`.
 *
 * Painting one pixel and reading it back is the only conversion that covers
 * every colour syntax the browser supports — there is no API that asks CSS to
 * serialise `color(srgb …)` as legacy `rgb()`. Results are memoised because a
 * page typically repeats a handful of theme colours across thousands of nodes.
 */
export const createColorConverter = (): ((color: string) => string | null) => {
  const context = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) {
    return () => null;
  }

  const cache = new Map<string, string | null>();

  return (color: string): string | null => {
    const cached = cache.get(color);
    if (cached !== undefined) {
      return cached;
    }

    let resolved: string | null = null;
    try {
      context.clearRect(0, 0, 1, 1);
      // An unparseable value leaves fillStyle at its previous setting, so seed a
      // known sentinel and treat "unchanged" as "the browser rejected it".
      context.fillStyle = "#000000";
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
      resolved = `rgba(${red}, ${green}, ${blue}, ${Number(
        (alpha / 255).toFixed(3)
      )})`;
    } catch {
      resolved = null;
    }

    cache.set(color, resolved);
    return resolved;
  };
};

/**
 * Pin every unsupported colour on one element to an `rgba()` inline value.
 *
 * Returns true when something was rewritten (used only to keep the walk cheap
 * to reason about; callers don't need it).
 */
const sanitizeElement = (
  element: HTMLElement | SVGElement,
  computed: CSSStyleDeclaration,
  convert: (color: string) => string | null
): boolean => {
  let changed = false;

  for (const property of COLOR_PROPERTIES) {
    const value = computed.getPropertyValue(property);
    if (!value || !hasUnsupportedColorFunction(value)) {
      continue;
    }

    const replacement = replaceUnsupportedColorFunctions(value, convert);
    if (replacement !== value) {
      element.style.setProperty(property, replacement);
      changed = true;
    }
  }

  return changed;
};

/**
 * Normalise every colour in a cloned document that html2canvas cannot parse.
 *
 * Runs from html2canvas's `onclone` hook, which fires after the clone (and its
 * pseudo-element stand-ins) exist but before the tree is parsed — the one point
 * where a rewrite both sees everything and still lands ahead of the parser.
 * Mutating the clone is safe: it is a throwaway document inside html2canvas's
 * own iframe, never the page the user is looking at.
 */
export const sanitizeUnsupportedColors = (clonedDocument: Document): void => {
  const view = clonedDocument.defaultView;
  if (!view) {
    return;
  }

  const convert = createColorConverter();

  for (const element of clonedDocument.querySelectorAll<HTMLElement>("*")) {
    // Script/style/meta nodes carry no painted colour; skip the getComputedStyle.
    if (
      element.tagName === "SCRIPT" ||
      element.tagName === "STYLE" ||
      element.tagName === "LINK" ||
      element.tagName === "META"
    ) {
      continue;
    }

    try {
      sanitizeElement(element, view.getComputedStyle(element), convert);
    } catch {
      // One unreadable node must not abort the screenshot; leave it as-is.
    }
  }
};
