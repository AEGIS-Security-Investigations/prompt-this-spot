import { afterEach, describe, expect, test } from "bun:test";
import { bindAppPushLayout } from "../../src/core/bindAppPushLayout";

const addPushRoot = () => {
  const root = document.createElement("div");
  root.setAttribute("data-app-push-root", "");
  root.style.width = "50%";
  document.body.append(root);
  return root;
};

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.style.overflowX = "";
});

describe("bindAppPushLayout", () => {
  test("pushes and narrows the root, then restores it and <html>", () => {
    const root = addPushRoot();

    const unbind = bindAppPushLayout(() => 300);
    expect(root.style.transform).toBe("translateX(300px)");
    expect(root.style.width).toBe("calc(100% - 300px)");
    expect(document.documentElement.style.overflowX).toBe("hidden");

    unbind();
    expect(root.style.transform).toBe("");
    expect(root.style.width).toBe("50%");
    expect(document.documentElement.style.overflowX).toBe("");
  });

  test("re-reads the offset when the viewport resizes", () => {
    const root = addPushRoot();
    let offset = 360;

    const unbind = bindAppPushLayout(() => offset);
    offset = 270;
    window.dispatchEvent(new Event("resize"));
    expect(root.style.transform).toBe("translateX(270px)");

    unbind();
  });

  test("does nothing without a push root", () => {
    bindAppPushLayout(() => 360)();
    expect(document.documentElement.style.overflowX).toBe("");
  });
});
