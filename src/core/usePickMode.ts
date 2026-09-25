"use client";

import { useEffect } from "react";

/** Marks a tool's own UI so it is never treated as an inspect target. */
export const INSPECT_IGNORE_ATTR = "data-inspect-ignore";

const isToolChrome = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest(`[${INSPECT_IGNORE_ATTR}]`) !== null;

export interface UsePickModeOptions {
  /** Whether click-to-pick is currently active. */
  active: boolean;
  /** Called with each picked element and the route it was picked on. */
  onPick: (element: Element, pathname: string) => void;
  /** Report the box under the pointer so the host can draw a highlight. */
  onHover: (rect: DOMRect | null) => void;
  /** Escape pressed — stop picking (the host decides whether to also close). */
  onEscape: () => void;
}

/**
 * Installs the capture-phase listeners that turn the whole page into a picker.
 *
 * Every listener is registered on `document` in the CAPTURE phase, which is
 * what makes picking work inside an open dialog. Outside-click dismissers —
 * Radix's `DismissableLayer` behind every dialog, popover, dropdown and sheet,
 * plus the admin command search — close on `pointerdown`/`mousedown`, which
 * fire BEFORE `click`. Intercepting only `click` is too late: the dialog is
 * already gone by the time it runs. So the pointer/mouse DOWN is swallowed at
 * `document` in the capture phase, before the document-level dismissal
 * listeners (registered in the bubble phase) can see it — leaving any open
 * dialog in place while the user picks inside or behind it. `preventDefault`
 * also stops the target taking focus or activating.
 *
 * Selection itself still happens on `click`, and pick mode stays active
 * afterwards so rapid multi-pick works; Esc or the host's toggle stops it.
 *
 * Extracted from the admin inspector so the feedback widget inherits this
 * behaviour rather than re-deriving it — it is the single subtlest piece of
 * the capture experience.
 */
export const usePickMode = ({
  active,
  onPick,
  onHover,
  onEscape,
}: UsePickModeOptions): void => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const target = event.target;
      if (isToolChrome(target) || !(target instanceof Element)) {
        onHover(null);
        return;
      }
      onHover(target.getBoundingClientRect());
    };

    const swallowInteractionDown = (event: MouseEvent | PointerEvent) => {
      if (isToolChrome(event.target)) {
        return; // Let the tool's own controls (drawer inputs/buttons) behave.
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleClick = (event: MouseEvent) => {
      if (isToolChrome(event.target)) {
        return; // Let clicks on the tool's own controls through.
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      // Capture phase + stop: prevents activating the element and stops any
      // remaining click-based dismissal, so picking inside an open dialog is safe.
      event.preventDefault();
      event.stopPropagation();
      onPick(target, window.location.pathname);
      // Stay in pick mode for rapid multi-pick; Esc / the toggle stops it.
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    document.addEventListener("mousemove", handleMove, true);
    document.addEventListener("pointerdown", swallowInteractionDown, true);
    document.addEventListener("mousedown", swallowInteractionDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("pointerdown", swallowInteractionDown, true);
      document.removeEventListener("mousedown", swallowInteractionDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.cursor = previousCursor;
    };
  }, [active, onPick, onHover, onEscape]);
};
