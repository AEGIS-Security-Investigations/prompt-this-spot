/** Best-effort unique id; falls back when crypto.randomUUID is unavailable. */
export const makeInspectPromptId = (prefix = "sel"): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
};
