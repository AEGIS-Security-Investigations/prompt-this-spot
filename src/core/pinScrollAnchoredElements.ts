"use client";

/** Temporary marker linking a live element to its copy in the rendered clone. */
const ANCHOR_ATTR = "data-prompt-this-spot-anchor";

/** Inline styles to force onto one element's copy. */
type StyleOverrides = Record<string, string>;

/**
 * Computed values that make an element the containing block for its `fixed`
 * descendants, so they no longer track the viewport.
 */
const createsFixedContainingBlock = (style: CSSStyleDeclaration): boolean => {
  const isSet = (value: string | undefined) =>
    Boolean(value && value !== "none");
  return (
    isSet(style.transform) ||
    isSet(style.perspective) ||
    isSet(style.filter) ||
    isSet(style.backdropFilter) ||
    /\b(paint|layout|strict|content)\b/.test(style.contain) ||
    /\b(transform|perspective|filter)\b/.test(style.willChange)
  );
};

/**
 * True when a `fixed` element is positioned against the viewport, which is the
 * only case the page's scroll offset moves it.
 */
const isViewportAnchored = (element: Element): boolean => {
  const root = element.ownerDocument.documentElement;
  const view = element.ownerDocument.defaultView;
  if (!view) {
    return false;
  }
  for (
    let ancestor = element.parentElement;
    ancestor && ancestor !== root;
    ancestor = ancestor.parentElement
  ) {
    if (createsFixedContainingBlock(view.getComputedStyle(ancestor))) {
      return false;
    }
  }
  return true;
};

/**
 * How far a `sticky` element has been pushed from its place in the flow by the
 * current scroll. Read by switching it to `static` for one synchronous layout,
 * which the browser never paints.
 */
const measureStickyShift = (
  element: HTMLElement
): { top: number; left: number } => {
  const stuck = element.getBoundingClientRect();
  const previous = element.style.getPropertyValue("position");
  const priority = element.style.getPropertyPriority("position");
  element.style.setProperty("position", "static", "important");
  const inFlow = element.getBoundingClientRect();
  element.style.setProperty("position", previous, priority);
  if (!previous) {
    element.style.removeProperty("position");
  }
  return { top: stuck.top - inFlow.top, left: stuck.left - inFlow.left };
};

export interface ScrollAnchorPins {
  /** Move each marked element in the clone to where it sits on screen. */
  apply: (clone: Element) => void;
  /** Remove the temporary markers from the live page. */
  release: () => void;
}

/**
 * Keep sticky headers and fixed bars where the user sees them.
 *
 * The screenshot is rendered from a copy of the page laid out as if it were
 * scrolled to the top, because a serialized document has no scroll position.
 * Normal content is unaffected (the crop is in document coordinates), but a
 * `fixed` toolbar or a stuck `sticky` header would be drawn at the top of the
 * document instead of over the content the user is looking at. This records
 * each one's on-screen offset and pins the copy there.
 *
 * `skip` excludes the tool's own chrome, which is filtered out of the render.
 * When only part of the page is copied, `origin` is that part's position in
 * the document, which is where a copied `fixed` element measures from.
 */
export const pinScrollAnchoredElements = (
  document: Document,
  skip: (element: Element) => boolean,
  /** Document position of the copied subtree's top-left corner. */
  origin: { x: number; y: number } = { x: 0, y: 0 }
): ScrollAnchorPins => {
  const view = document.defaultView;
  const overrides = new Map<string, StyleOverrides>();
  const marked: Element[] = [];
  let next = 0;

  const mark = (element: Element, styles: StyleOverrides) => {
    const existing = element.getAttribute(ANCHOR_ATTR);
    if (existing !== null) {
      Object.assign(overrides.get(existing) ?? {}, styles);
      return;
    }
    const id = String(next++);
    element.setAttribute(ANCHOR_ATTR, id);
    overrides.set(id, { ...styles });
    marked.push(element);
  };

  const pin = (
    position: "fixed" | "relative",
    top: number,
    left: number
  ): StyleOverrides | null =>
    Number.isFinite(top) && Number.isFinite(left)
      ? {
          position,
          top: `${top}px`,
          left: `${left}px`,
          bottom: "auto",
          right: "auto",
        }
      : null;

  if (view) {
    const { scrollX, scrollY } = view;
    for (const element of document.body?.querySelectorAll<HTMLElement>("*") ??
      []) {
      if (skip(element)) {
        continue;
      }
      try {
        const style = view.getComputedStyle(element);
        if (style.position === "fixed") {
          const styles =
            (scrollX - origin.x || scrollY - origin.y) &&
            isViewportAnchored(element)
              ? pin(
                  "fixed",
                  Number.parseFloat(style.top) + scrollY - origin.y,
                  Number.parseFloat(style.left) + scrollX - origin.x
                )
              : null;
          if (styles) {
            mark(element, styles);
          }
        } else if (style.position === "sticky") {
          const shift = measureStickyShift(element);
          const styles =
            shift.top || shift.left
              ? pin("relative", shift.top, shift.left)
              : null;
          if (!styles) {
            continue;
          }
          const scroller = element.parentElement;
          if (
            style.zIndex === "auto" &&
            scroller &&
            scroller !== document.body &&
            (scroller.scrollTop || scroller.scrollLeft)
          ) {
            // The rows scrolled under a stuck header are shifted with a
            // transform, which paints them over an un-indexed header the live
            // page paints on top. Lift the header, and isolate its panel so the
            // lift can't also raise it over anything outside the panel.
            styles["z-index"] = "1";
            mark(scroller, { isolation: "isolate" });
          }
          mark(element, styles);
        }
      } catch {
        // One unreadable node must not abort the screenshot.
      }
    }
  }

  return {
    apply: (clone) => {
      // The copy's root is laid out at the SVG's origin whatever its own
      // position, so only its descendants are moved.
      clone.removeAttribute(ANCHOR_ATTR);
      for (const element of clone.querySelectorAll(`[${ANCHOR_ATTR}]`)) {
        const styles = overrides.get(element.getAttribute(ANCHOR_ATTR) ?? "");
        element.removeAttribute(ANCHOR_ATTR);
        if (!styles || !(element instanceof HTMLElement)) {
          continue;
        }
        for (const [property, value] of Object.entries(styles)) {
          element.style.setProperty(property, value, "important");
        }
      }
    },
    release: () => {
      for (const element of marked) {
        element.removeAttribute(ANCHOR_ATTR);
      }
    },
  };
};
