/**
 * prompt-this-spot — point at a spot in a React app, capture it, and either
 * hand an AI coding agent a ready-made prompt ("Prompt this spot") or file it
 * as user feedback ("Send feedback").
 *
 * Mount `PromptThisSpotProvider` once with the host app's adapters, then the
 * two gates. See the README for the full setup.
 */

// Setup
export * from "./config/PromptThisSpotConfig";
export * from "./core/buildInspectPrompt";
export * from "./core/getAppPushRoot";
export * from "./core/inspectPromptLauncherCorner";
// Capture core (DOM description, prompt assembly, screenshots)
export * from "./core/types";
export * from "./core/useCaptureController";
export * from "./core/usePickMode";
export * from "./feedback/shouldMountUserFeedbackLauncher";
export { UserFeedbackDrawer } from "./feedback/UserFeedbackDrawer";
export { UserFeedbackTool } from "./feedback/UserFeedbackTool";
// "Send feedback"
export { UserFeedbackToolGate } from "./feedback/UserFeedbackToolGate";
export * from "./feedback/userFeedbackCategories";
export * from "./feedback/userFeedbackTheme";
// Floating launcher stack (for host apps with launchers of their own)
export * from "./floating-launchers/FloatingLauncherStackProvider";
export * from "./floating-launchers/floatingLauncherAboveMobileNav";
export * from "./floating-launchers/floatingLauncherExpandLabel";
export * from "./floating-launchers/floatingLauncherStack";
export * from "./floating-launchers/useFloatingLauncherSlot";
export { cn } from "./lib/cn";
export { createScreenshotUploader } from "./lib/createScreenshotUploader";
export * from "./prompt/claudeCodeLinks";
export * from "./prompt/formatInspectPromptShortcutLabel";
export {
  InspectPromptPreferencesProvider,
  useInspectPromptPreferences,
} from "./prompt/InspectPromptPreferencesContext";
export { InspectPromptTool } from "./prompt/InspectPromptTool";
// "Prompt this spot"
export { InspectPromptToolGate } from "./prompt/InspectPromptToolGate";
export * from "./prompt/inspectPromptPreferencesStorageKey";
export * from "./prompt/isInspectPromptShortcutKeyDown";
export * from "./prompt/useInspectPromptAccess";
