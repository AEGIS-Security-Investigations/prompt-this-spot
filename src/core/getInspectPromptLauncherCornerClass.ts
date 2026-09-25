import type { InspectPromptLauncherCorner } from "./inspectPromptLauncherCorner";

/**
 * Tailwind positioning classes for a snapped launcher corner.
 */
export const getInspectPromptLauncherCornerClass = (
  corner: InspectPromptLauncherCorner
): string => {
  switch (corner) {
    case "top-left":
      return "top-6 left-6";
    case "top-right":
      return "top-6 right-6";
    case "bottom-right":
      return "bottom-6 right-6";
    default:
      return "bottom-6 left-6";
  }
};
