import { describe, expect, it } from "bun:test";
import { truncateToWidth } from "../../src/core/applyTextEllipsis";
import { endAtWordBoundary } from "../../src/core/lineClampEllipsis";

/** Fixed-width font stand-in: every character is one unit wide. */
const monospace = (value: string): number => value.length;

describe("truncateToWidth", () => {
  it("returns null when the text already fits", () => {
    expect(truncateToWidth("orion", 10, monospace)).toBeNull();
  });

  it("returns null when the text exactly fills the box", () => {
    expect(truncateToWidth("orion", 5, monospace)).toBeNull();
  });

  it("truncates with an ellipsis that fits the available width", () => {
    // 10 units: 9 characters plus the 1-unit ellipsis.
    const result = truncateToWidth(
      "ORION Security & Investigations",
      10,
      monospace
    );
    expect(result).toBe("ORION Sec…");
    expect(monospace(result ?? "")).toBeLessThanOrEqual(10);
  });

  it("never returns a string wider than the box", () => {
    const text = "ORION Security & Investigations";
    for (let width = 1; width <= text.length; width++) {
      const result = truncateToWidth(text, width, monospace);
      expect(monospace(result ?? text)).toBeLessThanOrEqual(width);
    }
  });

  it("drops the space before the ellipsis rather than stranding it", () => {
    // Cutting "ORION Security" at 7 would leave "ORION …"; the browser does not
    // render that trailing space, so neither do we.
    expect(truncateToWidth("ORION Security", 7, monospace)).toBe("ORION…");
  });

  it("yields an empty string when not even the ellipsis fits", () => {
    expect(truncateToWidth("ORION", 0.5, monospace)).toBe("");
  });

  it("measures with the caller's font, not character count", () => {
    // A font twice as wide halves how much survives the same box.
    const wide = (value: string): number => value.length * 2;
    expect(truncateToWidth("ORION Security", 10, wide)).toBe("ORIO…");
  });
});

describe("endAtWordBoundary", () => {
  it("backs up to the previous word when the cut lands mid-word", () => {
    expect(endAtWordBoundary("in the app, and escalate", 20)).toBe(
      "in the app, and"
    );
  });

  it("keeps the cut when it already lands on a boundary", () => {
    expect(endAtWordBoundary("in the app, and escalate", 15)).toBe(
      "in the app, and"
    );
  });

  it("keeps the whole string when the index covers it", () => {
    expect(endAtWordBoundary("short", 5)).toBe("short");
  });

  it("falls back to a character cut for one unbroken word", () => {
    // No boundary to retreat to; returning "" would drop the text entirely.
    expect(endAtWordBoundary("Unbrokenlongword", 6)).toBe("Unbrok");
  });
});
