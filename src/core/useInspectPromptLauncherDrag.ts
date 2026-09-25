"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef, useState } from "react";
import type { InspectPromptLauncherCorner } from "./inspectPromptLauncherCorner";
import { resolveNearestInspectPromptLauncherCorner } from "./resolveNearestInspectPromptLauncherCorner";

const DRAG_THRESHOLD_PX = 5;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type UseInspectPromptLauncherDragArgs = {
  onOpen: () => void;
  onCornerChange: (corner: InspectPromptLauncherCorner) => void;
};

type UseInspectPromptLauncherDragResult = {
  dragging: boolean;
  dragStyle: { left: number; top: number } | null;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

/**
 * Pointer drag handling for the floating launcher: small movement opens, larger
 * movement snaps the button to the nearest viewport corner.
 */
export const useInspectPromptLauncherDrag = ({
  onOpen,
  onCornerChange,
}: UseInspectPromptLauncherDragArgs): UseInspectPromptLauncherDragResult => {
  const dragRef = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStyle, setDragStyle] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const resetDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
    setDragStyle(null);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
    },
    []
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = Math.abs(event.clientX - drag.startX);
      const deltaY = Math.abs(event.clientY - drag.startY);
      if (
        !drag.moved &&
        deltaX <= DRAG_THRESHOLD_PX &&
        deltaY <= DRAG_THRESHOLD_PX
      ) {
        return;
      }

      drag.moved = true;
      setDragging(true);
      setDragStyle({ left: event.clientX, top: event.clientY });
    },
    []
  );

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (drag.moved) {
        onCornerChange(
          resolveNearestInspectPromptLauncherCorner(
            event.clientX,
            event.clientY,
            window.innerWidth,
            window.innerHeight
          )
        );
      } else {
        onOpen();
      }

      resetDrag();
    },
    [onCornerChange, onOpen, resetDrag]
  );

  const onPointerUp = finishPointer;
  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      finishPointer(event);
    },
    [finishPointer]
  );

  return {
    dragging,
    dragStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
};
