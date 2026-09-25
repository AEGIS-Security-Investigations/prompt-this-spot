import { describe, expect, it } from "bun:test";
import {
  hasUnsupportedColorFunction,
  replaceUnsupportedColorFunctions,
} from "../../src/core/unsupportedColorFunctions";

/** Stand-in for the canvas converter: every colour resolves to the same rgba. */
const convert = () => "rgba(1, 2, 3, 1)";

describe("hasUnsupportedColorFunction", () => {
  it("detects the functions html2canvas cannot parse", () => {
    // What Chrome actually reports for a computed `color-mix()` value.
    expect(hasUnsupportedColorFunction("color(srgb 0.5 0.2 0.1)")).toBe(true);
    expect(
      hasUnsupportedColorFunction("color-mix(in srgb, #fff 10%, #000)")
    ).toBe(true);
    expect(hasUnsupportedColorFunction("oklch(0.7 0.1 200)")).toBe(true);
    expect(hasUnsupportedColorFunction("lab(50% 40 59.5)")).toBe(true);
    expect(hasUnsupportedColorFunction("hwb(194 0% 0%)")).toBe(true);
  });

  it("leaves colours html2canvas already understands alone", () => {
    expect(hasUnsupportedColorFunction("rgb(1, 2, 3)")).toBe(false);
    expect(hasUnsupportedColorFunction("rgba(1, 2, 3, 0.5)")).toBe(false);
    expect(hasUnsupportedColorFunction("hsl(210 40% 50%)")).toBe(false);
    expect(hasUnsupportedColorFunction("#abcdef")).toBe(false);
    expect(hasUnsupportedColorFunction("transparent")).toBe(false);
    expect(hasUnsupportedColorFunction("none")).toBe(false);
  });

  it("does not match a function name embedded in an identifier", () => {
    // `--my-color(` and `accent-color(` are not the CSS `color()` function.
    expect(hasUnsupportedColorFunction("var(--my-color)")).toBe(false);
    expect(hasUnsupportedColorFunction("accent-color(1)")).toBe(false);
    expect(hasUnsupportedColorFunction("scrollbar-color(1)")).toBe(false);
  });
});

describe("replaceUnsupportedColorFunctions", () => {
  it("replaces a bare unsupported colour", () => {
    expect(
      replaceUnsupportedColorFunctions("color(srgb 0.5 0.2 0.1)", convert)
    ).toBe("rgba(1, 2, 3, 1)");
  });

  it("returns supported values untouched", () => {
    expect(replaceUnsupportedColorFunctions("rgb(9, 9, 9)", convert)).toBe(
      "rgb(9, 9, 9)"
    );
  });

  it("replaces the whole call when parens are nested", () => {
    // Cutting at the first ')' would corrupt this into invalid CSS.
    expect(
      replaceUnsupportedColorFunctions(
        "color-mix(in srgb, rgb(1 2 3) 10%, hsl(200 50% 50%))",
        convert
      )
    ).toBe("rgba(1, 2, 3, 1)");
  });

  it("rewrites only the unsupported parts of a gradient", () => {
    expect(
      replaceUnsupportedColorFunctions(
        "linear-gradient(to right, rgb(255, 0, 0) 0%, color(srgb 0 1 0) 100%)",
        convert
      )
    ).toBe(
      "linear-gradient(to right, rgb(255, 0, 0) 0%, rgba(1, 2, 3, 1) 100%)"
    );
  });

  it("handles several unsupported colours in one value", () => {
    expect(
      replaceUnsupportedColorFunctions(
        "0 1px 2px oklch(0.7 0.1 200), 0 2px 4px color(srgb 0 0 1)",
        convert
      )
    ).toBe("0 1px 2px rgba(1, 2, 3, 1), 0 2px 4px rgba(1, 2, 3, 1)");
  });

  it("keeps the original when the browser cannot resolve it", () => {
    // A wrong colour would be worse than an unchanged one.
    const value = "color(nonsense 1 2 3)";
    expect(replaceUnsupportedColorFunctions(value, () => null)).toBe(value);
  });

  it("emits unbalanced input verbatim instead of corrupting it", () => {
    const value = "color(srgb 0 0 1";
    expect(replaceUnsupportedColorFunctions(value, convert)).toBe(value);
  });
});
