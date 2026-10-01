import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { REDACTED } from "../../src/core/sanitizePageUrl";
import { useCurrentPageUrl } from "../../src/core/useCurrentPageUrl";

interface HappyDomWindow {
  happyDOM: { setURL: (url: string) => void };
}

const setUrl = (url: string) =>
  (window as unknown as HappyDomWindow).happyDOM.setURL(url);

/** Longer than the hook's poll interval. */
const waitForPoll = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 650)));

beforeEach(() => setUrl("https://app.example.com/orders?status=open"));
afterEach(() => setUrl("about:blank"));

describe("useCurrentPageUrl", () => {
  it("reads the sanitized current URL", () => {
    setUrl("https://app.example.com/callback?code=abc&tab=1");
    const { result } = renderHook(() => useCurrentPageUrl());
    expect(result.current).toBe(
      `https://app.example.com/callback?code=${REDACTED}&tab=1`
    );
  });

  it("follows pushState and replaceState, which fire no event", async () => {
    const { result } = renderHook(() => useCurrentPageUrl());

    act(() => history.pushState({}, "", "/orders/42?tab=items"));
    await waitForPoll();
    expect(result.current).toBe("https://app.example.com/orders/42?tab=items");

    // Query-only change.
    act(() => history.replaceState({}, "", "/orders/42?tab=notes"));
    await waitForPoll();
    expect(result.current).toBe("https://app.example.com/orders/42?tab=notes");
  });

  it("updates on hash navigation without waiting for the poll", async () => {
    const { result } = renderHook(() => useCurrentPageUrl());

    await act(async () => {
      window.location.hash = "#history";
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(result.current).toBe(
      "https://app.example.com/orders?status=open#history"
    );
  });

  it("updates on Back/Forward (popstate) without waiting for the poll", () => {
    const { result } = renderHook(() => useCurrentPageUrl());

    act(() => {
      setUrl("https://app.example.com/orders?status=closed");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current).toBe("https://app.example.com/orders?status=closed");
  });

  it("stops listening while disabled (drawer closed)", async () => {
    const { result } = renderHook(() => useCurrentPageUrl(false));
    const before = result.current;

    act(() => history.pushState({}, "", "/somewhere-else"));
    await waitForPoll();
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current).toBe(before);
  });
});
