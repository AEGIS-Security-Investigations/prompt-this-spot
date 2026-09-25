import { afterEach, describe, expect, it } from "bun:test";
import { loadDeferredImages } from "../../src/core/loadDeferredImages";

/** happy-dom never loads images, so pin whether each one has finished. */
const image = (id: string, loading: "lazy" | "eager", complete: boolean) => {
  const element = document.createElement("img");
  element.id = id;
  element.loading = loading;
  Object.defineProperty(element, "complete", { value: complete });
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("loadDeferredImages", () => {
  it("switches a pending lazy image to eager, then back to lazy", () => {
    const root = document.createElement("div");
    const hidden = image("hidden", "lazy", false);
    root.append(hidden);
    document.body.append(root);

    const restore = loadDeferredImages(root);
    expect(hidden.loading).toBe("eager");

    restore();
    expect(hidden.loading).toBe("lazy");
  });

  it("leaves loaded lazy images and eager images alone", () => {
    const root = document.createElement("div");
    const loaded = image("loaded", "lazy", true);
    const eager = image("eager", "eager", false);
    root.append(loaded, eager);
    document.body.append(root);

    const restore = loadDeferredImages(root);
    expect(loaded.loading).toBe("lazy");
    expect(eager.loading).toBe("eager");

    restore();
    expect(loaded.loading).toBe("lazy");
    expect(eager.loading).toBe("eager");
  });

  it("only touches images under the capture root", () => {
    const root = document.createElement("div");
    const outside = image("outside", "lazy", false);
    document.body.append(root, outside);

    loadDeferredImages(root);
    expect(outside.loading).toBe("lazy");
  });
});
