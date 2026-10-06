import { afterEach, describe, expect, it, jest, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

// Picking an element also queues a real browser render + upload. Neither
// exists under happy-dom, so stub the two edges and keep this a state test.
const captureDocumentRegion = mock(async () => "data:image/png;base64,stub");

mock.module("../../src/core/captureDocumentRegion", () => ({
  captureDocumentRegion,
}));

import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../../src/core/types";
import { useCaptureController } from "../../src/core/useCaptureController";

// The uploader is injected now rather than module-mocked, so the test states
// the edge it is stubbing instead of reaching through an import.
const upload = mock(async () => ({
  url: "https://cdn.example.com/stub.png",
  expiresAt: "2026-08-13T00:00:00.000Z",
}));

const renderController = () =>
  renderHook(() => useCaptureController({ upload, screenshotsEnabled: true }));

afterEach(() => jest.useRealTimers());

const makeElement = (html: string): Element => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.firstElementChild as Element;
};

describe("useCaptureController", () => {
  it("removing a hung capture releases actions and ignores its late result", async () => {
    let finish!: (value: string) => void;
    captureDocumentRegion.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderController();
    const button = makeElement('<button data-testid="late">Late</button>');
    await act(async () => result.current.addSelection(button, "/p"));
    act(() => result.current.setRequest("Keep this request"));
    expect(result.current.capturing).toBe(true);
    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;
    const uploadsBefore = upload.mock.calls.length;

    act(() => result.current.removeScreenshot(id));
    expect(result.current.capturing).toBe(false);
    expect(result.current.selections).toHaveLength(1);
    expect(result.current.request).toBe("Keep this request");
    await act(async () => finish("data:image/png;base64,late"));
    expect(result.current.screenshots).toHaveLength(0);
    expect(result.current.getScreenshotSource(id)).toBeUndefined();
    expect(upload.mock.calls.length).toBe(uploadsBefore);
  });

  it("times out a hung capture, advances the queue, and retries without losing context", async () => {
    jest.useFakeTimers();
    let finish!: (value: string) => void;
    captureDocumentRegion.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderController();
    const button = makeElement(
      '<button data-testid="timeout">Timed out</button>'
    );
    await act(async () => result.current.addSelection(button, "/p"));
    act(() => result.current.setRequest("Fix this spot"));
    await act(async () => result.current.capturePageScreenshot());
    expect(result.current.capturing).toBe(true);
    await act(async () => jest.advanceTimersByTime(25_000));
    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;
    expect(result.current.screenshots[0]?.status).toBe("failed");
    expect(result.current.screenshots[0]?.error).toContain("capture timed out");
    expect(result.current.screenshots[1]?.status).toBe("ready");
    expect(result.current.capturing).toBe(false);
    expect(result.current.selections).toHaveLength(1);
    expect(result.current.request).toBe("Fix this spot");
    await act(async () => result.current.retryScreenshot(id));
    expect(result.current.screenshots[0]?.status).toBe("ready");
    await act(async () => finish("data:image/png;base64,late"));
    expect(result.current.getScreenshotSource(id)).toBe(
      "data:image/png;base64,stub"
    );
    expect(result.current.screenshots).toHaveLength(2);
  });

  it("times out an injected uploader and never accepts its late URL", async () => {
    jest.useFakeTimers();
    let finish!: (value: { url: string; expiresAt: string }) => void;
    upload.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    expect(result.current.screenshots[0]?.status).toBe("uploading");
    await act(async () => jest.advanceTimersByTime(20_000));
    expect(result.current.screenshots[0]?.status).toBe("failed");
    expect(result.current.screenshots[0]?.error).toContain("upload timed out");
    expect(result.current.capturing).toBe(false);
    await act(async () =>
      finish({
        url: "https://cdn.example.com/late.png",
        expiresAt: "2030-01-01",
      })
    );
    expect(result.current.screenshots[0]?.url).toBeNull();
    expect(result.current.screenshots[0]?.status).toBe("failed");
  });

  it("clearAll releases actions and skips captures removed from the queue", async () => {
    let finish!: (value: string) => void;
    captureDocumentRegion.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    const capturesBefore = captureDocumentRegion.mock.calls.length;
    await act(async () => result.current.capturePageScreenshot());
    act(() => result.current.clearAll());
    expect(result.current.capturing).toBe(false);
    await act(async () => finish("data:image/png;base64,late"));
    expect(result.current.screenshots).toHaveLength(0);
    expect(captureDocumentRegion.mock.calls.length).toBe(capturesBefore);
    await act(async () => result.current.capturePageScreenshot());
    expect(result.current.screenshots[0]?.status).toBe("ready");
  });

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
    const { id } = result.current.selections[0] as ElementDescription;

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
    expect(result.current.screenshots[0]?.kind).toBe("element");
    expect(result.current.screenshots[0]?.selectionId).toBe(
      result.current.selections[0]?.id
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
    const { id } = result.current.selections[0] as ElementDescription;
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

    expect(result.current.screenshots[0]?.status).toBe("failed");
    expect(result.current.screenshots[0]?.error).toBe("canvas blew up");

    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;
    await act(async () => result.current.retryScreenshot(id));

    // The same row recovers in place — no duplicate, no lost selections.
    expect(result.current.screenshots).toHaveLength(1);
    expect(result.current.screenshots[0]?.id).toBe(id);
    expect(result.current.screenshots[0]?.status).toBe("ready");
    expect(result.current.screenshots[0]?.error).toBeNull();
    expect(result.current.screenshots[0]?.url).toBe(
      "https://cdn.example.com/stub.png"
    );
  });

  it("uploads a marked-up image in place and keeps the clean capture", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;

    // The clean capture stays available so markup is redrawn on the original,
    // never stacked on an already-marked image.
    expect(result.current.getScreenshotSource(id)).toBe(
      "data:image/png;base64,stub"
    );

    upload.mockImplementationOnce(async () => ({
      url: "https://cdn.example.com/marked.png",
      expiresAt: "2026-08-13T00:00:00.000Z",
    }));
    const marks = [
      {
        id: "m1",
        tool: "box" as const,
        color: "#ef4444",
        from: { x: 0, y: 0 },
        to: { x: 40, y: 40 },
      },
    ];
    await act(async () =>
      result.current.annotateScreenshot(
        id,
        marks,
        "data:image/png;base64,marked"
      )
    );

    expect(upload).toHaveBeenLastCalledWith("data:image/png;base64,marked");
    expect(result.current.screenshots).toHaveLength(1);
    expect(result.current.screenshots[0]?.status).toBe("ready");
    expect(result.current.screenshots[0]?.url).toBe(
      "https://cdn.example.com/marked.png"
    );
    expect(result.current.screenshots[0]?.annotations).toEqual(marks);
    expect(result.current.getScreenshotSource(id)).toBe(
      "data:image/png;base64,stub"
    );
  });

  it("retries a failed markup upload with the marked-up image, not a re-capture", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;
    const capturesBefore = captureDocumentRegion.mock.calls.length;

    upload.mockImplementationOnce(async () => {
      throw new Error("network down");
    });
    await act(async () =>
      result.current.annotateScreenshot(id, [], "data:image/png;base64,marked")
    );
    expect(result.current.screenshots[0]?.status).toBe("failed");

    await act(async () => result.current.retryScreenshot(id));

    expect(result.current.screenshots[0]?.status).toBe("ready");
    expect(upload).toHaveBeenLastCalledWith("data:image/png;base64,marked");
    expect(captureDocumentRegion.mock.calls.length).toBe(capturesBefore);
  });

  it("forgets a removed screenshot's capture so retry cannot resurrect it", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    const { id } = result.current.screenshots[0] as InspectPromptScreenshot;

    await act(async () => result.current.removeScreenshot(id));
    await act(async () => result.current.retryScreenshot(id));

    expect(result.current.screenshots).toHaveLength(0);
  });

  it("stores a per-screenshot note without disturbing the others", async () => {
    const { result } = renderController();
    await act(async () => result.current.capturePageScreenshot());
    await act(async () => result.current.capturePageScreenshot());

    const [first, second] = result.current.screenshots as [
      InspectPromptScreenshot,
      InspectPromptScreenshot,
    ];
    expect(first.note).toBe("");

    await act(async () =>
      result.current.setScreenshotNote(first.id, "this column is too wide")
    );

    expect(result.current.screenshots[0]?.note).toBe("this column is too wide");
    // The note is per-shot: its sibling must be untouched.
    expect(result.current.screenshots[1]?.note).toBe("");
    expect(result.current.screenshots[1]?.id).toBe(second.id);
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

  it("keeps each capture's page URL when the app navigates afterwards", async () => {
    const happy = (
      window as unknown as { happyDOM: { setURL: (u: string) => void } }
    ).happyDOM;
    happy.setURL("https://app.example.com/orders?status=open");
    try {
      const { result } = renderController();
      const button = makeElement(`<button data-testid="first">First</button>`);

      await act(async () => {
        result.current.addSelection(
          button,
          "/orders",
          "https://app.example.com/orders?status=open"
        );
      });
      await act(async () => result.current.capturePageScreenshot());

      // Client-side navigation, then a capture on the new page.
      history.pushState({}, "", "/orders/42?tab=items");
      await act(async () => result.current.capturePageScreenshot());

      const [selection] = result.current.selections;
      const [elementShot, firstPage, secondPage] = result.current.screenshots;
      expect(selection?.pageUrl).toBe(
        "https://app.example.com/orders?status=open"
      );
      expect(elementShot?.pageUrl).toBe(
        "https://app.example.com/orders?status=open"
      );
      expect(firstPage?.pageUrl).toBe(
        "https://app.example.com/orders?status=open"
      );
      expect(secondPage?.pageUrl).toBe(
        "https://app.example.com/orders/42?tab=items"
      );
      expect(secondPage?.pathname).toBe("/orders/42");
    } finally {
      happy.setURL("about:blank");
    }
  });
});
