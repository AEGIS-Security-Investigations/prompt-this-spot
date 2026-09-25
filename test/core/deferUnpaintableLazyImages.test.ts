import { afterEach, describe, expect, it } from "bun:test";
import { deferUnpaintableLazyImages } from "../../src/core/deferUnpaintableLazyImages";

const CROP = { x: 0, y: 0, width: 400, height: 300 };

afterEach(() => {
  document.body.innerHTML = "";
});

interface ImageState {
  complete: boolean;
  /** Client rect in viewport coordinates, or null for no layout box. */
  box: { left: number; top: number; width: number; height: number } | null;
}

const addImage = (attributes: string, state: ImageState): HTMLImageElement => {
  document.body.insertAdjacentHTML("beforeend", `<img ${attributes}>`);
  const image = document.body.lastElementChild as HTMLImageElement;
  Object.defineProperty(image, "complete", { value: state.complete });
  const box = state.box;
  image.getClientRects = () => (box ? [box] : []) as unknown as DOMRectList;
  image.getBoundingClientRect = () =>
    ({ ...(box ?? { left: 0, top: 0, width: 0, height: 0 }) }) as DOMRect;
  return image;
};

describe("deferUnpaintableLazyImages", () => {
  it("takes the source off a hidden lazy image and puts it back", () => {
    const image = addImage(
      'loading="lazy" src="/logo-dark.svg" srcset="/logo-dark.svg 1x"',
      { complete: false, box: null }
    );

    const deferred = deferUnpaintableLazyImages(document.body, CROP);

    expect(image.hasAttribute("src")).toBe(false);
    expect(image.hasAttribute("srcset")).toBe(false);

    deferred.release();

    expect(image.getAttribute("src")).toBe("/logo-dark.svg");
    expect(image.getAttribute("srcset")).toBe("/logo-dark.svg 1x");
  });

  it("takes the source off a lazy image that lies outside the crop", () => {
    const image = addImage('loading="lazy" src="/row.png"', {
      complete: false,
      box: { left: 0, top: 2000, width: 50, height: 50 },
    });

    const deferred = deferUnpaintableLazyImages(document.body, CROP);

    expect(image.hasAttribute("src")).toBe(false);
    deferred.release();
    expect(image.getAttribute("src")).toBe("/row.png");
  });

  it("leaves a lazy image inside the crop to load", () => {
    const image = addImage('loading="lazy" src="/hero.png"', {
      complete: false,
      box: { left: 10, top: 10, width: 50, height: 50 },
    });

    deferUnpaintableLazyImages(document.body, CROP);

    expect(image.getAttribute("src")).toBe("/hero.png");
  });

  it("leaves eager and already-loaded images alone", () => {
    const eager = addImage('src="/eager.png"', { complete: false, box: null });
    const loaded = addImage('loading="lazy" src="/loaded.png"', {
      complete: true,
      box: null,
    });

    deferUnpaintableLazyImages(document.body, CROP);

    expect(eager.getAttribute("src")).toBe("/eager.png");
    expect(loaded.getAttribute("src")).toBe("/loaded.png");
  });

  it("restores only once when released twice", () => {
    const image = addImage('loading="lazy" src="/logo-dark.svg"', {
      complete: false,
      box: null,
    });

    const deferred = deferUnpaintableLazyImages(document.body, CROP);
    deferred.release();
    image.setAttribute("src", "/changed-by-app.svg");
    deferred.release();

    expect(image.getAttribute("src")).toBe("/changed-by-app.svg");
  });
});
