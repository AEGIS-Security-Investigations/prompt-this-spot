"use client";

import { MessageSquarePlus } from "lucide-react";
import { getInspectPromptLauncherCornerClass } from "../core/getInspectPromptLauncherCornerClass";
import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";
import { useInspectPromptLauncherDrag } from "../core/useInspectPromptLauncherDrag";
import { INSPECT_IGNORE_ATTR } from "../core/usePickMode";
import { floatingLauncherAboveMobileNav } from "../floating-launchers/floatingLauncherAboveMobileNav";
import { floatingLauncherExpandLabelClass } from "../floating-launchers/floatingLauncherExpandLabel";
import { useFloatingLauncherSlot } from "../floating-launchers/useFloatingLauncherSlot";
import { cn } from "../lib/cn";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

type UserFeedbackLauncherProps = {
  corner: InspectPromptLauncherCorner;
  onCornerChange: (corner: InspectPromptLauncherCorner) => void;
  onOpen: () => void;
};

/**
 * The floating "Send feedback" button.
 *
 * Kept free of heavy imports on purpose. Once the global flag is switched on
 * this renders for every signed-in user, so anything it pulls in is paid for on
 * every page view — the drawer, the screenshot renderer and the pick-mode machinery all
 * live behind the click-time dynamic import in `UserFeedbackTool`.
 *
 * Shares the inspector's drag/snap behaviour but defaults to the opposite
 * corner, so a super admin who sees both launchers never gets two stacked
 * buttons. Whichever corner it ends up in, `useFloatingLauncherSlot` keeps it
 * clear of any other launcher already anchored there.
 */
export const UserFeedbackLauncher = ({
  corner,
  onCornerChange,
  onOpen,
}: UserFeedbackLauncherProps) => {
  const { userFeedbackLauncher, userFeedbackLauncherDragging } =
    useUserFeedbackTheme();
  const expandsLeft = corner.endsWith("-right");
  // Only a bottom-anchored launcher can collide with the mobile bottom nav.
  const sitsAtBottom = corner.startsWith("bottom-");

  const {
    dragging,
    dragStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useInspectPromptLauncherDrag({ onOpen, onCornerChange });

  // A dragged launcher follows the pointer rather than a corner, so it releases
  // its slot until it snaps — otherwise the launchers behind it would stay
  // pushed out around a button that is no longer there.
  const stackStyle = useFloatingLauncherSlot({
    id: "user-feedback",
    corner: dragging ? null : corner,
  });

  return (
    <button
      type="button"
      {...{ [INSPECT_IGNORE_ATTR]: "" }}
      data-testid="user-feedback-toggle"
      data-launcher-corner={corner}
      aria-label="Send feedback"
      title="Send feedback. Drag to move."
      className={cn(
        userFeedbackLauncher,
        !dragging && getInspectPromptLauncherCornerClass(corner),
        !dragging && sitsAtBottom && floatingLauncherAboveMobileNav,
        dragging && userFeedbackLauncherDragging,
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
      <MessageSquarePlus className="h-5 w-5 shrink-0" aria-hidden />
      <span
        className={cn(
          "text-xs font-semibold",
          floatingLauncherExpandLabelClass(expandsLeft)
        )}
      >
        Send feedback
      </span>
    </button>
  );
};
