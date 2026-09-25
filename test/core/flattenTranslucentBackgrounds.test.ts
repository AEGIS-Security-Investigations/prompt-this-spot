import { describe, expect, it } from "bun:test";

import { flattenGradientValue } from "../../src/core/flattenTranslucentBackgrounds";

const WHITE = [255, 255, 255] as const;

describe("flattenGradientValue", () => {
  it("composites a translucent stop onto the backdrop", () => {
    // 0.05 × 37 + 0.95 × 255 = 244.1 → 244, and so on per channel.
    expect(
      flattenGradientValue(
        "linear-gradient(45deg, rgba(37, 161, 218, 0.05) 0%)",
        WHITE
      )
    ).toBe("linear-gradient(45deg, rgb(244, 250, 253) 0%)");
  });

  it("leaves opaque stops byte-for-byte alone", () => {
    // html2canvas already renders these correctly; rewriting them would only
    // risk rounding the colour the browser actually paints.
    const value =
      "linear-gradient(45deg, rgb(36, 168, 216) 0%, rgb(255, 255, 255) 100%)";
    expect(flattenGradientValue(value, WHITE)).toBe(value);
  });

  it("leaves a fully transparent stop transparent", () => {
    // A multi-layer background paints front-to-back, so turning `transparent`
    // into an opaque colour would let an upper layer occlude the ones beneath
    // it — which is how the four-layer bgSecurityMesh tile is built.
    expect(
      flattenGradientValue(
        "linear-gradient(45deg, rgba(0, 0, 0, 0) 25%)",
        [240, 245, 250]
      )
    ).toBe("linear-gradient(45deg, rgba(0, 0, 0, 0) 25%)");
  });

  it("composites onto a dark backdrop rather than assuming white", () => {
    expect(
      flattenGradientValue(
        "linear-gradient(rgba(255, 255, 255, 0.5) 0%)",
        [0, 0, 0]
      )
    ).toBe("linear-gradient(rgb(128, 128, 128) 0%)");
  });

  it("rewrites every stop across every layer of a multi-layer value", () => {
    const flattened = flattenGradientValue(
      "linear-gradient(45deg, rgba(0, 0, 0, 0.5) 25%, rgba(0, 0, 0, 0) 25%), " +
        "linear-gradient(-45deg, rgba(0, 0, 0, 0.5) 25%, rgba(0, 0, 0, 0) 25%)",
      WHITE
    );

    expect(flattened).toBe(
      "linear-gradient(45deg, rgb(128, 128, 128) 25%, rgba(0, 0, 0, 0) 25%), " +
        "linear-gradient(-45deg, rgb(128, 128, 128) 25%, rgba(0, 0, 0, 0) 25%)"
    );
  });

  it("passes url() layers through untouched", () => {
    // Only colour tokens are rewritten — an image layer must survive intact, or
    // the screenshot silently loses it.
    const value =
      'url("https://cdn.example.com/logo.png"), linear-gradient(rgba(0, 0, 0, 0.5) 0%)';
    expect(flattenGradientValue(value, WHITE)).toBe(
      'url("https://cdn.example.com/logo.png"), linear-gradient(rgb(128, 128, 128) 0%)'
    );
  });

  it("leaves a value with no gradient alone", () => {
    expect(flattenGradientValue("none", WHITE)).toBe("none");
  });
});
