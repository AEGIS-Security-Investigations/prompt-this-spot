import { afterEach, describe, expect, it } from "bun:test";
import { createOffscreenPruner } from "../../src/core/createOffscreenPruner";

const crop = { x: 0, y: 500, width: 400, height: 200 };

/** Give an element a box in the (unscrolled) document. */
const place = (element: Element, top: number, height = 40) => {
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top,
      width: 400,
      height,
      right: 400,
      bottom: top + height,
    }) as DOMRect;
};

const build = (html: string) => {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById("root") as HTMLElement;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createOffscreenPruner", () => {
  it("empties a box that lies wholly outside the crop but keeps the box", () => {
    const root = build('<div id="far"><span id="text">Row</span></div>');
    const far = document.getElementById("far") as HTMLElement;
    place(far, 100);

    const keep = createOffscreenPruner(crop, root, []);

    expect(keep(far)).toBe(true);
    expect(keep(document.getElementById("text") as HTMLElement)).toBe(false);
  });

  it("keeps the contents of a box that reaches into the crop", () => {
    const root = build('<div id="near"><span id="text">Row</span></div>');
    place(document.getElementById("near") as HTMLElement, 480);

    const keep = createOffscreenPruner(crop, root, []);

    expect(keep(document.getElementById("text") as HTMLElement)).toBe(true);
  });

  it("never empties an inline box, whose size comes from its content", () => {
    const root = build('<span id="far"><b id="text">Row</b></span>');
    place(document.getElementById("far") as HTMLElement, 100);

    const keep = createOffscreenPruner(crop, root, []);

    expect(keep(document.getElementById("text") as HTMLElement)).toBe(true);
  });

  it("keeps a far box whole when it holds an overlay drawn over the crop", () => {
    const root = build(
      '<div id="far"><div id="bar" style="position: fixed"></div></div>'
    );
    place(document.getElementById("far") as HTMLElement, 100);
    const bar = document.getElementById("bar") as HTMLElement;

    const keep = createOffscreenPruner(crop, root, [bar]);

    expect(keep(bar)).toBe(true);
  });

  it("never empties the root", () => {
    const root = build('<span id="text">Row</span>');
    place(root, 100);

    const keep = createOffscreenPruner(crop, root, []);

    expect(keep(document.getElementById("text") as HTMLElement)).toBe(true);
  });
});
