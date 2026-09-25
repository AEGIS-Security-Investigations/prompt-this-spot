"use client";

import { Sparkles } from "lucide-react";
import { getInspectPromptLauncherCornerClass } from "../core/getInspectPromptLauncherCornerClass";
import { useInspectPromptLauncherDrag } from "../core/useInspectPromptLauncherDrag";
import { floatingLauncherAboveMobileNav } from "../floating-launchers/floatingLauncherAboveMobileNav";
import { floatingLauncherExpandLabelClass } from "../floating-launchers/floatingLauncherExpandLabel";
import { useFloatingLauncherSlot } from "../floating-launchers/useFloatingLauncherSlot";
import { cn } from "../lib/cn";
import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";
import {
  inspectPromptLauncher,
  inspectPromptLauncherDragging,
} from "./inspectPromptChromeClasses";

/** Marks the tool's own UI so it is never treated as an inspect target. */
const IGNORE_ATTR = "data-inspect-ignore";

type InspectPromptLauncherProps = {
  onOpen: () => void;
};

/**
 * Draggable floating launcher that snaps to viewport corners (Next dev style).
 *
 * Drag it onto a corner another launcher already holds and it stacks above that
 * one instead of covering it — see `useFloatingLauncherSlot`.
 */
export const InspectPromptLauncher = ({
  onOpen,
}: InspectPromptLauncherProps) => {
  const { launcherCorner, setLauncherCorner } = useInspectPromptPreferences();
  const expandsLeft = launcherCorner.endsWith("-right");
  // Only a bottom-anchored launcher can collide with the mobile bottom nav.
  const sitsAtBottom = launcherCorner.startsWith("bottom-");

  const {
    dragging,
    dragStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useInspectPromptLauncherDrag({
    onOpen,
    onCornerChange: setLauncherCorner,
  });

  // A dragged launcher follows the pointer rather than a corner, so it releases
  // its slot until it snaps.
  const stackStyle = useFloatingLauncherSlot({
    id: "inspect-prompt",
    corner: dragging ? null : launcherCorner,
  });

  return (
    <button
      type="button"
      {...{ [IGNORE_ATTR]: "" }}
      data-testid="inspect-prompt-toggle"
      data-launcher-corner={launcherCorner}
      aria-label="Open prompt tool"
      title="Toggle prompt tool (Mod+Shift+P). Drag to move."
      className={cn(
        inspectPromptLauncher,
        !dragging && getInspectPromptLauncherCornerClass(launcherCorner),
        !dragging && sitsAtBottom && floatingLauncherAboveMobileNav,
        dragging && inspectPromptLauncherDragging,
        expandsLeft && "flex-row-reverse"
      )}
      style={
        dragging && dragStyle
          ? {
              left: dragStyle.left,
              top: dragStyle.top,
              transform: "translate(-50%, -50%)",
              right: "auto",
              bottom: "auto",
            }
          : stackStyle
      }
      onPointerDown={(event) => {
        // Let the drag/open handler run, then keep this activation away from
        // document-bubble outside-click dismissers for already-open dialogs.
        event.stopPropagation();
        onPointerDown(event);
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <Sparkles className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          "font-mono text-xs font-medium",
          floatingLauncherExpandLabelClass(expandsLeft)
        )}
      >
        Prompt this spot
      </span>
    </button>
  );
};
