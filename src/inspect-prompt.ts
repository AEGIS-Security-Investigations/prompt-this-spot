/**
 * Everything an app needs to mount "Prompt this spot" alone, without the rest
 * of the package: `import … from "prompt-this-spot/inspect-prompt"`.
 *
 * For bundlers that don't tree-shake, such as Metro for Expo web. The main
 * entry re-exports both tools statically, so there it bundles all their code
 * into the first page load. This entry reaches the tool only through
 * `InspectPromptToolGate`'s lazy import, so the tool stays in its own chunk.
 */

export * from "./config/PromptThisSpotConfig";
export * from "./floating-launchers/FloatingLauncherStackProvider";
export { createScreenshotUploader } from "./lib/createScreenshotUploader";
export {
  InspectPromptPreferencesProvider,
  useInspectPromptPreferences,
} from "./prompt/InspectPromptPreferencesContext";
export { InspectPromptToolGate } from "./prompt/InspectPromptToolGate";
