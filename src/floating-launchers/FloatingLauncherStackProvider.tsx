"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";

import type {
  FloatingLauncherCorners,
  FloatingLauncherId,
} from "./floatingLauncherStack";

type FloatingLauncherStackValue = {
  /** Corner of every launcher currently on screen, including the caller's. */
  corners: FloatingLauncherCorners;
  /** Claim a corner, or release it by passing `null`. */
  setLauncherCorner: (
    id: FloatingLauncherId,
    corner: InspectPromptLauncherCorner | null
  ) => void;
};

const FloatingLauncherStackContext =
  createContext<FloatingLauncherStackValue | null>(null);

export const useFloatingLauncherStack = (): FloatingLauncherStackValue | null =>
  useContext(FloatingLauncherStackContext);

/**
 * Shared registry that keeps the app's floating launchers off each other.
 *
 * The launchers are mounted from unrelated places — a host app's own AI chrome,
 * and the two tool gates — and none of them can see the others.
 * Each one registers the corner it is anchored to here, and reads back how many
 * higher-priority launchers are already in that corner (see
 * `FLOATING_LAUNCHER_STACK_ORDER`), which is what turns an overlap into a
 * stack.
 *
 * Mounted high enough to wrap all three. Launchers rendered outside it still
 * work — they just fall back to sitting in the corner, exactly as they did
 * before the stack existed.
 */
export const FloatingLauncherStackProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [corners, setCorners] = useState<FloatingLauncherCorners>({});

  const setLauncherCorner = useCallback(
    (id: FloatingLauncherId, corner: InspectPromptLauncherCorner | null) => {
      setCorners((current) => {
        // Bail out when nothing moved. Every launcher re-registers on each
        // corner change, and a new object here would re-render all of them.
        if (current[id] === (corner ?? undefined)) {
          return current;
        }
        const next = { ...current };
        if (corner) {
          next[id] = corner;
        } else {
          delete next[id];
        }
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ corners, setLauncherCorner }),
    [corners, setLauncherCorner]
  );

  return (
    <FloatingLauncherStackContext.Provider value={value}>
      {children}
    </FloatingLauncherStackContext.Provider>
  );
};
