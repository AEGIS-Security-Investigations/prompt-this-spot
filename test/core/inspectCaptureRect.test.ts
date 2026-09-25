import { describe, expect, it } from "bun:test";
import {
  computeCaptureScale,
  computeElementCapturePadding,
  computePaddedElementCaptureRect,
  computeViewportCaptureRect,
} from "../../src/core/inspectCaptureRect";

const PAGE = { documentWidth: 1400, documentHeight: 4000 };

describe("inspect capture rects", () => {
  it("gives a small element the minimum context band", () => {
    expect(computeElementCapturePadding(24, 24)).toBe(80);
  });

  it("scales padding with the element and caps it", () => {
    expect(computeElementCapturePadding(400, 200)).toBe(140);
    expect(computeElementCapturePadding(2000, 100)).toBe(320);
  });

  it("pads an element outward in document coordinates", () => {
    const rect = computePaddedElementCaptureRect({
      rect: { left: 500, top: 300, width: 200, height: 100 },
      scrollX: 0,
      scrollY: 400,
      ...PAGE,
    });

    // 200x100 element → padding 80 (min). Page Y = 300 + 400 scroll = 700.
    expect(rect).toEqual({ x: 420, y: 620, width: 360, height: 260 });
  });

  it("clamps the padded rect to the document bounds", () => {
    const rect = computePaddedElementCaptureRect({
      rect: { left: 10, top: 5, width: 40, height: 20 },
      scrollX: 0,
      scrollY: 0,
      ...PAGE,
    });

    // Padding would push past the top-left origin; the crop starts at 0,0.
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.width).toBe(130); // 10 + 40 + 80
    expect(rect.height).toBe(105); // 5 + 20 + 80
  });

  it("never returns a zero-size rect for a collapsed element", () => {
    const rect = computePaddedElementCaptureRect({
      rect: { left: 0, top: 0, width: 0, height: 0 },
      scrollX: 0,
      scrollY: 0,
      documentWidth: 0,
      documentHeight: 0,
    });

    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  it("clips the viewport rect to what remains of the page", () => {
    const rect = computeViewportCaptureRect({
      scrollX: 0,
      scrollY: 3900,
      viewportWidth: 1200,
      viewportHeight: 800,
      ...PAGE,
    });

    expect(rect).toEqual({ x: 0, y: 3900, width: 1200, height: 100 });
  });

  it("caps the render scale so big crops stay under the upload limit", () => {
    // A small crop keeps the sharper preferred scale...
    expect(
      computeCaptureScale({
        width: 400,
        height: 300,
        maxDimension: 2000,
        preferredScale: 2,
      })
    ).toBe(2);

    // ...a full-width one is scaled down to the pixel ceiling.
    expect(
      computeCaptureScale({
        width: 4000,
        height: 1000,
        maxDimension: 2000,
        preferredScale: 2,
      })
    ).toBe(1);
  });
});
