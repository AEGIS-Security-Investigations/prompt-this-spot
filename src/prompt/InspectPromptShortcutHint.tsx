"use client";

import { useEffect, useState } from "react";
import { formatInspectPromptShortcutLabel } from "./formatInspectPromptShortcutLabel";
import { inspectPromptShortcutHint } from "./inspectPromptChromeClasses";

/**
 * Small kbd chip showing the platform-correct inspect prompt shortcut.
 */
export const InspectPromptShortcutHint = () => {
  const [label, setLabel] = useState("⌘⇧P");

  useEffect(() => {
    setLabel(formatInspectPromptShortcutLabel());
  }, []);

  return (
    <kbd
      className={inspectPromptShortcutHint}
      title="Toggle prompt tool (Mod+Shift+P)"
      data-testid="inspect-prompt-shortcut-hint"
    >
      {label}
    </kbd>
  );
};
