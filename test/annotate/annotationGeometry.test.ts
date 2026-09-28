import { describe, expect, it } from "bun:test";
import {
  annotationStrokeWidth,
  arrowHeadPoints,
  isMeaningfulDrag,
  normalizeBox,
  toImagePoint,
} from "../../src/annotate/annotationGeometry";

describe("annotationStrokeWidth", () => {
  it("never goes below a visible 4px", () => {
    expect(annotationStrokeWidth(200, 100)).toBe(4);
  });

  it("scales up on a large retina capture", () => {
    expect(annotationStrokeWidth(2800, 1600)).toBe(11);
  });
});

describe("toImagePoint", () => {
  const displayed = { left: 100, top: 50, width: 500, height: 250 };
  const image = { width: 2000, height: 1000 };

  it("maps a pointer on the scaled-down canvas to image pixels", () => {
    expect(
      toImagePoint({ clientX: 350, clientY: 175 }, displayed, image)
    ).toEqual({ x: 1000, y: 500 });
  });

  it("clamps a drag that leaves the canvas to the image edge", () => {
    expect(
      toImagePoint({ clientX: 0, clientY: 900 }, displayed, image)
    ).toEqual({ x: 0, y: 1000 });
  });
});

describe("normalizeBox", () => {
  it("turns a drag up and to the left into a top-left rectangle", () => {
    expect(normalizeBox({ x: 50, y: 40 }, { x: 10, y: 0 })).toEqual({
      x: 10,
      y: 0,
      width: 40,
      height: 40,
    });
  });
});

describe("arrowHeadPoints", () => {
  it("puts both barbs behind the tip of a rightward arrow", () => {
    const head = arrowHeadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 5);
    expect(head).not.toBeNull();
    const [a, b] = head ?? [];
    expect(a?.x).toBeLessThan(100);
    expect(b?.x).toBeLessThan(100);
    // One barb each side of the shaft.
    expect(Math.sign(a?.y ?? 0)).toBe(-Math.sign(b?.y ?? 0));
  });

  it("has no head when the arrow has no length", () => {
    expect(arrowHeadPoints({ x: 5, y: 5 }, { x: 5, y: 5 }, 5)).toBeNull();
  });
});

describe("isMeaningfulDrag", () => {
  it("drops a click that did not drag", () => {
    expect(isMeaningfulDrag({ x: 10, y: 10 }, { x: 12, y: 11 }, 3)).toBe(false);
  });

  it("keeps a real drag", () => {
    expect(isMeaningfulDrag({ x: 10, y: 10 }, { x: 60, y: 10 }, 3)).toBe(true);
  });
});
