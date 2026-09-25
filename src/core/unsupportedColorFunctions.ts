/**
 * html2canvas 1.4.1 predates the modern CSS colour functions and throws
 * `Attempting to parse an unsupported color function "color"` the moment it
 * meets one — aborting the whole screenshot.
 *
 * This matters here because the app uses `color-mix()` (operational tag pills,
 * the licence import table, tour-management site-group headers). Chrome
 * *resolves* `color-mix()` in computed styles to `color(srgb r g b)`, so the
 * value html2canvas actually sees is an unsupported function even though no
 * source file ever writes `color(...)` literally.
 *
 * These helpers find those functions inside a CSS value so the caller can swap
 * them for an equivalent the parser understands. Kept string-only (no DOM, no
 * canvas) so the scanning logic is directly testable.
 */

/**
 * Colour functions html2canvas cannot parse. Longest names first so the scanner
 * prefers `color-mix` over the `color` prefix it starts with.
 */
export const UNSUPPORTED_COLOR_FUNCTIONS = [
  "color-mix",
  "oklch",
  "oklab",
  "lch",
  "lab",
  "hwb",
  "color",
] as const;

/**
 * CSS identifiers may contain these, so a match must not start mid-word. An
 * out-of-range index (`undefined`) is not an identifier character: it means the
 * match sits at the very start of the value.
 */
const isIdentifierChar = (character: string | undefined): boolean =>
  character !== undefined && /[A-Za-z0-9_-]/.test(character);

/** Cheap pre-check so untouched values skip the scanner entirely. */
export const hasUnsupportedColorFunction = (value: string): boolean =>
  UNSUPPORTED_COLOR_FUNCTIONS.some((name) => {
    const index = value.indexOf(`${name}(`);
    if (index === -1) {
      return false;
    }
    return index === 0 || !isIdentifierChar(value[index - 1]);
  });

/** Index just past the `)` that closes the `(` at `openIndex`, or -1. */
const findClosingParen = (value: string, openIndex: number): number => {
  let depth = 0;
  for (let index = openIndex; index < value.length; index += 1) {
    if (value[index] === "(") {
      depth += 1;
    } else if (value[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
};

/** The unsupported function starting exactly at `index`, if any. */
const matchFunctionAt = (value: string, index: number): string | null => {
  if (index > 0 && isIdentifierChar(value[index - 1])) {
    return null;
  }
  return (
    UNSUPPORTED_COLOR_FUNCTIONS.find(
      (name) =>
        value.startsWith(name, index) && value[index + name.length] === "("
    ) ?? null
  );
};

/**
 * Rewrite every unsupported colour function in `value` using `convert`.
 *
 * Works on composite values too — a gradient or box-shadow can carry several
 * colours, and only the unsupported ones are touched. Nested parentheses are
 * matched by depth, so `color-mix(in srgb, rgb(1 2 3) 10%, #fff)` is replaced
 * as one unit rather than cut at the first `)`.
 *
 * When `convert` returns null (the browser could not resolve that colour) the
 * original text is left alone: a wrong colour is worse than an unchanged one,
 * and html2canvas will simply fail on it as it does today.
 */
export const replaceUnsupportedColorFunctions = (
  value: string,
  convert: (color: string) => string | null
): string => {
  if (!hasUnsupportedColorFunction(value)) {
    return value;
  }

  let result = "";
  let index = 0;

  while (index < value.length) {
    const name = matchFunctionAt(value, index);
    if (!name) {
      result += value[index];
      index += 1;
      continue;
    }

    const openIndex = index + name.length;
    const closeIndex = findClosingParen(value, openIndex);
    if (closeIndex === -1) {
      // Unbalanced input — emit the rest verbatim rather than corrupting it.
      result += value.slice(index);
      break;
    }

    const original = value.slice(index, closeIndex + 1);
    result += convert(original) ?? original;
    index = closeIndex + 1;
  }

  return result;
};
