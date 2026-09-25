import { describe, expect, it } from "bun:test";
import { computeInspectHighlightBox } from "../../src/core/inspectHighlightBox";

const rect = (
  left: number,
  top: number,
  width: number,
  height: number
): Pick<DOMRect, "left" | "top" | "width" | "height"> => ({
  left,
  top,
  width,
  height,
});

describe("computeInspectHighlightBox", () => {
  it("falls back to viewport coordinates when the container is at the origin", () => {
    // Drawer closed → <body> is not transformed → origin is (0, 0), so the box
    // matches the raw viewport rect.
    const box = computeInspectHighlightBox(rect(400, 660, 120, 40), {
      left: 0,
      top: 0,
    });
    expect(box).toEqual({ left: 400, top: 660, width: 120, height: 40 });
  });

  it("cancels the body push transform so the border stays on the element", () => {
    // Drawer open → <body> is translated right by the drawer width (360px), so
    // its viewport origin is (360, 0). Subtracting it converts the target's
    // viewport rect into <body>'s coordinate space; without this the highlight
    // would be offset by the full drawer width.
    const target = rect(400, 660, 120, 40);
    const box = computeInspectHighlightBox(target, { left: 360, top: 0 });
    expect(box).toEqual({ left: 40, top: 660, width: 120, height: 40 });

    // Re-projecting the box back through the origin lands exactly on the target.
    expect(box.left + 360).toBe(target.left);
    expect(box.top + 0).toBe(target.top);
  });

  it("compensates for a scrolled container origin on both axes", () => {
    // A negative origin (e.g. <body> scrolled up the viewport) is added back,
    // keeping the box aligned with the element.
    const box = computeInspectHighlightBox(rect(400, 120, 80, 30), {
      left: 360,
      top: -500,
    });
    expect(box).toEqual({ left: 40, top: 620, width: 80, height: 30 });
  });

  it("never alters the element's own size", () => {
    const box = computeInspectHighlightBox(rect(10, 20, 222, 333), {
      left: 360,
      top: 48,
    });
    expect(box.width).toBe(222);
    expect(box.height).toBe(333);
  });
});
