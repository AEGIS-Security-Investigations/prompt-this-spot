/**
 * Markup colours, first one is the default. These are the conventional "red
 * pen" colours of screenshot markup rather than any app's brand, chosen to
 * stand out against both light and dark pages.
 */
export const ANNOTATION_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#facc15", label: "Yellow" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
] as const;

export const DEFAULT_ANNOTATION_COLOR = ANNOTATION_COLORS[0].value;
