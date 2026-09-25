import { afterEach, describe, expect, it } from "bun:test";
import { pinScrollAnchoredElements } from "../../src/core/pinScrollAnchoredElements";

const ANCHOR_ATTR = "data-prompt-this-spot-anchor";

const scrollPage = (x: number, y: number) => {
  Object.defineProperty(window, "scrollX", { value: x, configurable: true });
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
};

afterEach(() => {
  document.body.innerHTML = "";
  scrollPage(0, 0);
});

const pinAndClone = () => {
  const pins = pinScrollAnchoredElements(document, (element) =>
    Boolean(element.closest("[data-inspect-ignore]"))
  );
  const clone = document.body.cloneNode(true) as HTMLElement;
  pins.apply(clone);
  pins.release();
  return clone;
};

describe("pinScrollAnchoredElements", () => {
  it("moves a viewport-fixed bar down by the page scroll in the copy", () => {
    document.body.innerHTML =
      '<div id="bar" style="position: fixed; top: 10px; left: 20px; bottom: 0"></div>';
    scrollPage(0, 500);

    const clone = pinAndClone();
    const bar = clone.querySelector<HTMLElement>("#bar");

    expect(bar?.style.top).toBe("510px");
    expect(bar?.style.left).toBe("20px");
    expect(bar?.style.bottom).toBe("auto");
    // The live page is left exactly as it was.
    const live = document.getElementById("bar");
    expect(live?.hasAttribute(ANCHOR_ATTR)).toBe(false);
    expect(live?.style.top).toBe("10px");
    expect(bar?.hasAttribute(ANCHOR_ATTR)).toBe(false);
  });

  it("leaves a fixed element inside a transformed container alone", () => {
    // A transform makes the container, not the viewport, its containing
    // block, so the page scroll doesn't move it and the copy already agrees.
    document.body.innerHTML =
      '<div style="transform: translateX(10px)"><div id="bar" style="position: fixed; top: 10px; left: 0"></div></div>';
    scrollPage(0, 500);

    const bar = pinAndClone().querySelector<HTMLElement>("#bar");

    expect(bar?.style.top).toBe("10px");
  });

  it("does nothing when the page isn't scrolled", () => {
    document.body.innerHTML =
      '<div id="bar" style="position: fixed; top: 10px; left: 0"></div>';

    const bar = pinAndClone().querySelector<HTMLElement>("#bar");

    expect(bar?.style.top).toBe("10px");
    expect(bar?.hasAttribute(ANCHOR_ATTR)).toBe(false);
  });

  it("skips the tool's own chrome", () => {
    document.body.innerHTML =
      '<div data-inspect-ignore><div id="bar" style="position: fixed; top: 10px; left: 0"></div></div>';
    scrollPage(0, 500);

    const bar = pinAndClone().querySelector<HTMLElement>("#bar");

    expect(bar?.style.top).toBe("10px");
  });
});
