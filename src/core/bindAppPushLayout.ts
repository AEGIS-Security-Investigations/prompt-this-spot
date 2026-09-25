import { getAppPushRoot } from "./getAppPushRoot";

/**
 * Slide `[data-app-push-root]` right by `getOffsetPx()` and narrow it to match,
 * so the app reflows beside a left drawer instead of sitting under it. Returns
 * a cleanup that restores the root and `<html>` exactly as they were.
 *
 * The offset is re-read on every resize, because a drawer clamped to the
 * viewport (`max-w-[90vw]`) is narrower on a phone than its nominal width.
 * `<html>` clips horizontal overflow meanwhile, so content wider than the
 * narrowed root can't add a scrollbar. Without a push root it does nothing.
 */
export const bindAppPushLayout = (getOffsetPx: () => number): (() => void) => {
  const pushRoot = getAppPushRoot();
  if (!pushRoot) {
    return () => {};
  }

  const { style } = pushRoot;
  const html = document.documentElement;
  const previous = {
    transform: style.transform,
    width: style.width,
    transition: style.transition,
    boxSizing: style.boxSizing,
    htmlOverflowX: html.style.overflowX,
  };

  const apply = () => {
    const offsetPx = getOffsetPx();
    style.transform = `translateX(${offsetPx}px)`;
    style.width = `calc(100% - ${offsetPx}px)`;
  };

  style.transition = "transform 300ms ease-in-out, width 300ms ease-in-out";
  style.boxSizing = "border-box";
  html.style.overflowX = "hidden";
  apply();
  window.addEventListener("resize", apply);

  return () => {
    window.removeEventListener("resize", apply);
    style.transform = previous.transform;
    style.width = previous.width;
    style.transition = previous.transition;
    style.boxSizing = previous.boxSizing;
    html.style.overflowX = previous.htmlOverflowX;
  };
};
