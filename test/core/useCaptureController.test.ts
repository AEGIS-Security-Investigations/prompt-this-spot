import { describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

// Picking an element also queues a real html2canvas render + upload. Neither
// exists under happy-dom, so stub the two edges and keep this a state test.
const captureDocumentRegion = mock(async () => "data:image/png;base64,stub");

mock.module("../../src/core/captureDocumentRegion", () => ({
  captureDocumentRegion,
}));

import { useCaptureController } from "../../src/core/useCaptureController";

// The uploader is injected now rather than module-mocked, so the test states
// the edge it is stubbing instead of reaching through an import.
const upload = mock(async () => ({
  url: "https://cdn.example.com/stub.png",
  expiresAt: "2026-08-13T00:00:00.000Z",
}));

const renderController = () =>
  renderHook(() => useCaptureController({ upload, screenshotsEnabled: true }));

const makeElement = (html: string): Element => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.firstElementChild as Element;
};

describe("useCaptureController", () => {
  it("opens the drawer when pick mode turns on", () => {
    const { result } = renderController();
    expect(result.current.drawerOpen).toBe(false);

    act(() => result.current.togglePickMode());

    expect(result.current.pickMode).toBe(true);
    expect(result.current.drawerOpen).toBe(true);
  });

  it("closing the drawer also stops picking", () => {
    const { result } = renderController();
    act(() => result.current.togglePickMode());
    act(() => result.current.closeDrawer());

    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.pickMode).toBe(false);
  });

  it("accumulates selections and dedupes the same spot", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="cta">Go</button>`);
    const link = makeElement(`<a id="privacy" href="/legal">Privacy</a>`);

    await act(async () => {
      result.current.addSelection(button, "/dashboard");
    });
    await act(async () => {
      result.current.addSelection(link, "/dashboard");
    });
    expect(result.current.selections).toHaveLength(2);

    // Same selector + pathname is ignored.
    await act(async () => {
      result.current.addSelection(button, "/dashboard");
    });
    expect(result.current.selections).toHaveLength(2);

    // Same element on a different page is a distinct selection.
    await act(async () => {
      result.current.addSelection(button, "/other");
    });
    expect(result.current.selections).toHaveLength(3);
  });

  it("stopPickMode turns off picking without closing the drawer", () => {
    const { result } = renderController();
    act(() => result.current.togglePickMode());
    expect(result.current.pickMode).toBe(true);

    act(() => result.current.stopPickMode());

    expect(result.current.pickMode).toBe(false);
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.hoverRect).toBeNull();
  });

  it("removes and clears selections", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="a">A</button>`);
    await act(async () => {
      result.current.addSelection(button, "/p");
    });
    const { id } = result.current.selections[0];

    await act(async () => result.current.removeSelection(id));
    expect(result.current.selections).toHaveLength(0);

    await act(async () => {
      result.current.addSelection(button, "/p");
    });
    await act(async () => result.current.clearSelections());
    expect(result.current.selections).toHaveLength(0);
  });

  it("clearAll clears both selections and the request text", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="a">A</button>`);
    await act(async () => {
      result.current.addSelection(button, "/p");
    });
    act(() => result.current.setRequest("Tighten the spacing here"));
    expect(result.current.selections).toHaveLength(1);
    expect(result.current.request).toBe("Tighten the spacing here");

    await act(async () => result.current.clearAll());

    // The drawer's clear() button is a full reset — spots gone AND prompt blank.
    expect(result.current.selections).toHaveLength(0);
    expect(result.current.request).toBe("");
  });

  it("queues one element screenshot per new selection, none on a re-pick", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="shot">Shoot</button>`);

    await act(async () => {
      result.current.addSelection(button, "/p");
    });
    expect(result.current.screenshots).toHaveLength(1);
    expect(result.current.screenshots[0].kind).toBe("element");
    expect(result.current.screenshots[0].selectionId).toBe(
      result.current.selections[0].id
    );

    // Re-picking the same spot is deduped, so it must not queue a second shot.
    await act(async () => {
      expect(result.current.addSelection(button, "/p")).toBeNull();
    });
    expect(result.current.screenshots).toHaveLength(1);
  });

  it("drops a selection's screenshot when the selection is removed", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="drop">Drop</button>`);

    await act(async () => {
      result.current.addSelection(button, "/p");
    });
    const { id } = result.current.selections[0];
    expect(result.current.screenshots).toHaveLength(1);

    await act(async () => result.current.removeSelection(id));

    expect(result.current.selections).toHaveLength(0);
    expect(result.current.screenshots).toHaveLength(0);
  });

  it("captures repeatable standalone page screenshots", async () => {
    const { result } = renderController();

    await act(async () => result.current.capturePageScreenshot());
    await act(async () => result.current.capturePageScreenshot());

    expect(result.current.screenshots).toHaveLength(2);
    expect(
      result.current.screenshots.every((shot) => shot.kind === "page")
    ).toBe(true);
  });

  it("retries a failed screenshot on its original capture", async () => {
    captureDocumentRegion.mockImplementationOnce(async () => {
      throw new Error("canvas blew up");
    });

    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());

    expect(result.current.screenshots[0].status).toBe("failed");
    expect(result.current.screenshots[0].error).toBe("canvas blew up");

    const { id } = result.current.screenshots[0];
    await act(async () => result.current.retryScreenshot(id));

    // The same row recovers in place — no duplicate, no lost selections.
    expect(result.current.screenshots).toHaveLength(1);
    expect(result.current.screenshots[0].id).toBe(id);
    expect(result.current.screenshots[0].status).toBe("ready");
    expect(result.current.screenshots[0].error).toBeNull();
    expect(result.current.screenshots[0].url).toBe(
      "https://cdn.example.com/stub.png"
    );
  });

  it("forgets a removed screenshot's capture so retry cannot resurrect it", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    const { id } = result.current.screenshots[0];

    await act(async () => result.current.removeScreenshot(id));
    await act(async () => result.current.retryScreenshot(id));

    expect(result.current.screenshots).toHaveLength(0);
  });

  it("stores a per-screenshot note without disturbing the others", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    await act(async () => result.current.capturePageScreenshot());

    const [first, second] = result.current.screenshots;
    expect(first.note).toBe("");

    await act(async () =>
      result.current.setScreenshotNote(first.id, "this column is too wide")
    );

    expect(result.current.screenshots[0].note).toBe("this column is too wide");
    // The note is per-shot: its sibling must be untouched.
    expect(result.current.screenshots[1].note).toBe("");
    expect(result.current.screenshots[1].id).toBe(second.id);
  });

  it("clearAll also drops captured screenshots", async () => {
    const { result } = renderController();
    const button = makeElement(`<button data-testid="wipe">Wipe</button>`);

    await act(async () => {
      result.current.addSelection(button, "/p");
      result.current.capturePageScreenshot();
    });
    expect(result.current.screenshots.length).toBeGreaterThan(0);

    await act(async () => result.current.clearAll());

    expect(result.current.screenshots).toHaveLength(0);
  });
});
