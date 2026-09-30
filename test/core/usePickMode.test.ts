import { afterEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { REDACTED } from "../../src/core/sanitizePageUrl";
import { usePickMode } from "../../src/core/usePickMode";

interface HappyDomWindow {
  happyDOM: { setURL: (url: string) => void };
}

const setUrl = (url: string) =>
  (window as unknown as HappyDomWindow).happyDOM.setURL(url);

afterEach(() => setUrl("about:blank"));

describe("usePickMode", () => {
  it("hands each pick the route and the sanitized page URL at that moment", () => {
    setUrl("https://someone:pw@app.example.com:8443/orders?tab=open&token=t0p");
    const onPick = mock(
      (_element: Element, _pathname: string, _pageUrl: string) => {}
    );
    renderHook(() =>
      usePickMode({
        active: true,
        onPick,
        onHover: () => {},
        onEscape: () => {},
      })
    );

    const button = document.createElement("button");
    document.body.appendChild(button);
    button.click();

    expect(onPick).toHaveBeenCalledTimes(1);
    const [, pathname, pageUrl] = onPick.mock.calls[0] ?? [];
    expect(pathname).toBe("/orders");
    expect(pageUrl).toBe(
      `https://app.example.com:8443/orders?tab=open&token=${REDACTED}`
    );
  });

  it("still works for hosts whose onPick takes only two arguments", () => {
    const picked: string[] = [];
    const onPick = (_element: Element, pathname: string) => {
      picked.push(pathname);
    };
    setUrl("https://app.example.com/legacy");
    renderHook(() =>
      usePickMode({
        active: true,
        onPick,
        onHover: () => {},
        onEscape: () => {},
      })
    );

    const span = document.createElement("span");
    document.body.appendChild(span);
    span.click();

    expect(picked).toEqual(["/legacy"]);
  });
});
