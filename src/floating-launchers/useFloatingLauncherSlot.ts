"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";

import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";

import { useFloatingLauncherStack } from "./FloatingLauncherStackProvider";
import type { FloatingLauncherId } from "./floatingLauncherStack";
import {
  getFloatingLauncherStackStyle,
  resolveFloatingLauncherSlot,
} from "./floatingLauncherStack";

/**
 * Registers a floating launcher in the shared corner stack and returns the
 * inline style that keeps it clear of the launchers in front of it
 * (`undefined` when it has the corner to itself, so nothing is set at all).
 *
 * Pass `corner: null` whenever the launcher is not actually occupying a corner
 * — hidden, or mid-drag — so it stops holding a slot the others would stack on
 * top of.
 *
 * Safe to call with no `FloatingLauncherStackProvider` above it (Storybook,
 * isolated tests): the launcher just renders in its corner with no offset.
 */
export const useFloatingLauncherSlot = ({
  id,
  corner,
}: {
  id: FloatingLauncherId;
  corner: InspectPromptLauncherCorner | null;
}): CSSProperties | undefined => {
  const stack = useFloatingLauncherStack();
  const setLauncherCorner = stack?.setLauncherCorner;

  useEffect(() => {
    if (!setLauncherCorner) {
      return;
    }
    setLauncherCorner(id, corner);
    // Release the slot on unmount so a launcher that disappears (feature flag
    // off, drawer opened, route without it) closes the gap behind it.
    return () => setLauncherCorner(id, null);
  }, [setLauncherCorner, id, corner]);

  if (!stack || !corner) {
    return undefined;
  }

  return getFloatingLauncherStackStyle(
    corner,
    resolveFloatingLauncherSlot({ id, corner, corners: stack.corners })
  );
};
