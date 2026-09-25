"use client";

import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";
import { DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER } from "../core/inspectPromptLauncherCorner";
import {
  INSPECT_PROMPT_ENABLED_STORAGE_KEY,
  INSPECT_PROMPT_LAUNCHER_CORNER_STORAGE_KEY,
  INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY,
  INSPECT_PROMPT_TEST_COVERAGE_STORAGE_KEY,
} from "./inspectPromptPreferencesStorageKey";
import { readInspectPromptEnabledPreference } from "./readInspectPromptEnabledPreference";
import { readInspectPromptLauncherCornerPreference } from "./readInspectPromptLauncherCornerPreference";
import { readInspectPromptScreenshotsPreference } from "./readInspectPromptScreenshotsPreference";
import { readInspectPromptTestCoveragePreference } from "./readInspectPromptTestCoveragePreference";

type InspectPromptPreferencesContextType = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  launcherCorner: InspectPromptLauncherCorner;
  setLauncherCorner: (corner: InspectPromptLauncherCorner) => void;
  /** Whether picks and the page button capture screenshots at all. */
  screenshotsEnabled: boolean;
  setScreenshotsEnabled: (enabled: boolean) => void;
  /** Whether assembled prompts also ask the agent for unit + e2e coverage. */
  testCoverageRequested: boolean;
  setTestCoverageRequested: (requested: boolean) => void;
};

const InspectPromptPreferencesContext =
  createContext<InspectPromptPreferencesContextType | null>(null);

export const useInspectPromptPreferences = () => {
  const context = use(InspectPromptPreferencesContext);
  if (!context) {
    return {
      enabled: true,
      setEnabled: () => {},
      launcherCorner: DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER,
      setLauncherCorner: () => {},
      screenshotsEnabled: true,
      setScreenshotsEnabled: () => {},
      testCoverageRequested: false,
      setTestCoverageRequested: () => {},
    };
  }

  return context;
};

export const InspectPromptPreferencesProvider = ({
  children,
}: PropsWithChildren) => {
  const [enabled, setEnabledState] = useState(true);
  const [launcherCorner, setLauncherCornerState] =
    useState<InspectPromptLauncherCorner>(
      DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER
    );
  const [screenshotsEnabled, setScreenshotsEnabledState] = useState(true);
  const [testCoverageRequested, setTestCoverageRequestedState] =
    useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabledState(readInspectPromptEnabledPreference());
    setLauncherCornerState(readInspectPromptLauncherCornerPreference());
    setScreenshotsEnabledState(readInspectPromptScreenshotsPreference());
    setTestCoverageRequestedState(readInspectPromptTestCoveragePreference());
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === INSPECT_PROMPT_ENABLED_STORAGE_KEY) {
        setEnabledState(readInspectPromptEnabledPreference());
      }
      if (event.key === INSPECT_PROMPT_LAUNCHER_CORNER_STORAGE_KEY) {
        setLauncherCornerState(readInspectPromptLauncherCornerPreference());
      }
      if (event.key === INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY) {
        setScreenshotsEnabledState(readInspectPromptScreenshotsPreference());
      }
      if (event.key === INSPECT_PROMPT_TEST_COVERAGE_STORAGE_KEY) {
        setTestCoverageRequestedState(
          readInspectPromptTestCoveragePreference()
        );
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  const setEnabled = useCallback(
    (nextEnabled: boolean) => {
      setEnabledState(nextEnabled);
      if (mounted) {
        localStorage.setItem(
          INSPECT_PROMPT_ENABLED_STORAGE_KEY,
          String(nextEnabled)
        );
      }
    },
    [mounted]
  );

  const setLauncherCorner = useCallback(
    (corner: InspectPromptLauncherCorner) => {
      setLauncherCornerState(corner);
      if (mounted) {
        localStorage.setItem(
          INSPECT_PROMPT_LAUNCHER_CORNER_STORAGE_KEY,
          corner
        );
      }
    },
    [mounted]
  );

  const setScreenshotsEnabled = useCallback(
    (nextEnabled: boolean) => {
      setScreenshotsEnabledState(nextEnabled);
      if (mounted) {
        localStorage.setItem(
          INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY,
          String(nextEnabled)
        );
      }
    },
    [mounted]
  );

  const setTestCoverageRequested = useCallback(
    (nextRequested: boolean) => {
      setTestCoverageRequestedState(nextRequested);
      if (mounted) {
        localStorage.setItem(
          INSPECT_PROMPT_TEST_COVERAGE_STORAGE_KEY,
          String(nextRequested)
        );
      }
    },
    [mounted]
  );

  return (
    <InspectPromptPreferencesContext.Provider
      value={{
        enabled,
        setEnabled,
        launcherCorner,
        setLauncherCorner,
        screenshotsEnabled,
        setScreenshotsEnabled,
        testCoverageRequested,
        setTestCoverageRequested,
      }}
    >
      {children}
    </InspectPromptPreferencesContext.Provider>
  );
};
