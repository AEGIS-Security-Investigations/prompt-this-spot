export type InspectPromptLauncherCorner =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export const INSPECT_PROMPT_LAUNCHER_CORNERS: InspectPromptLauncherCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export const DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER: InspectPromptLauncherCorner =
  "bottom-left";

export const isInspectPromptLauncherCorner = (
  value: string
): value is InspectPromptLauncherCorner =>
  INSPECT_PROMPT_LAUNCHER_CORNERS.includes(
    value as InspectPromptLauncherCorner
  );
