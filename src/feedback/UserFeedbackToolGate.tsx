"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { shouldMountUserFeedbackLauncher } from "./shouldMountUserFeedbackLauncher";
import { UserFeedbackLauncher } from "./UserFeedbackLauncher";
import { useUserFeedbackLauncherCorner } from "./useUserFeedbackLauncherCorner";

// Client-only. The chunk behind this import carries the screenshot renderer and
// the whole capture core, the heaviest thing the feedback tool pulls in.
//
// The Suspense fallback keeps the launcher on screen while the chunk is in
// flight. Without it the button the user just clicked would vanish until the
// download landed — on a slow connection that reads as "nothing happened", and
// they click again.
const UserFeedbackTool = lazy(() =>
  import("./UserFeedbackTool").then((mod) => ({
    default: mod.UserFeedbackTool,
  }))
);

/**
 * The launcher as it appears between the click and the drawer mounting. Inert
 * on purpose: a second click cannot start a second load, and the corner is read
 * fresh so it does not jump.
 */
function UserFeedbackLauncherPlaceholder() {
  const [corner] = useUserFeedbackLauncherCorner();
  return (
    <UserFeedbackLauncher
      corner={corner}
      onCornerChange={() => {}}
      onOpen={() => {}}
    />
  );
}

/**
 * Two-stage gate for the feedback widget.
 *
 * Stage one is eligibility, which the host app decides and passes in: while it
 * is false, nothing renders and nothing is fetched.
 *
 * Stage two is the part that matters once every signed-in user is eligible. A
 * lazily imported component fetches its chunk as soon as the element MOUNTS —
 * so mounting the tool for every eligible user would put the capture core on every
 * page view just to render a button. The "Prompt this spot" gate can stop at
 * stage one because its audience is a handful of engineers; this one cannot.
 *
 * So the launcher is rendered directly — it is a plain button with no heavy
 * imports — and the tool's chunk is not requested until someone actually
 * clicks it. From that point the mounted tool owns both the launcher and the
 * drawer, and `activated` never goes back to false.
 */
export function UserFeedbackToolGate({ eligible }: { eligible: boolean }) {
  const { feedbackE2eOptInStorageKey } = usePromptThisSpotConfig();
  const [activated, setActivated] = useState(false);
  const [corner, setCorner] = useUserFeedbackLauncherCorner();
  const [browserChecked, setBrowserChecked] = useState(false);
  const [allowInBrowser, setAllowInBrowser] = useState(false);

  useEffect(() => {
    let e2eOptIn = false;
    try {
      e2eOptIn =
        window.sessionStorage.getItem(feedbackE2eOptInStorageKey) === "1";
    } catch {
      // Private browsing / disabled storage — treat as no opt-in.
    }
    setAllowInBrowser(
      shouldMountUserFeedbackLauncher({
        eligible: true,
        isAutomatedBrowser: Boolean(navigator.webdriver),
        e2eOptIn,
      })
    );
    setBrowserChecked(true);
  }, [feedbackE2eOptInStorageKey]);

  if (!eligible || !browserChecked || !allowInBrowser) {
    return null;
  }

  if (activated) {
    return (
      <Suspense fallback={<UserFeedbackLauncherPlaceholder />}>
        <UserFeedbackTool />
      </Suspense>
    );
  }

  return (
    <UserFeedbackLauncher
      corner={corner}
      onCornerChange={setCorner}
      onOpen={() => setActivated(true)}
    />
  );
}
