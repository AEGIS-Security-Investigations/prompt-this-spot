/**
 * A small single-page app that mounts both tools the way a host app does, for
 * the Playwright specs. Everything here is fictional: the repository slug, the
 * CDN host and the pages. Screenshot uploads and feedback submissions are
 * recorded in the page instead of leaving the browser.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createScreenshotUploader,
  FloatingLauncherStackProvider,
  InspectPromptPreferencesProvider,
  InspectPromptToolGate,
  type PromptThisSpotConfig,
  PromptThisSpotProvider,
  type UserFeedbackSubmission,
  UserFeedbackToolGate,
} from "../../src/index";

declare global {
  interface Window {
    fixtureFeedback: UserFeedbackSubmission[];
  }
}

window.fixtureFeedback = [];

let shotCount = 0;
const httpUpload = createScreenshotUploader("/fixture-upload");
const fakeUpload = async (dataUrl: string) => {
  if (new URLSearchParams(window.location.search).has("httpUpload")) {
    return httpUpload(dataUrl);
  }
  shotCount += 1;
  return { url: `https://cdn.example.test/shot-${shotCount}.png` };
};

const config: PromptThisSpotConfig = {
  repoSlug: "acme/example-app",
  uploadPromptScreenshot: fakeUpload,
  uploadFeedbackScreenshot: fakeUpload,
  submitFeedback: async (submission) => {
    window.fixtureFeedback.push(submission);
  },
  feedbackE2eOptInStorageKey: "fixture:e2e-user-feedback",
};

/** Client-side navigation, the way a router does it: no reload. */
const navigate = (to: string) => {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("fixture:navigate"));
};

const useLocationKey = (): string => {
  const read = () =>
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const [key, setKey] = useState(read);
  useEffect(() => {
    const update = () => setKey(read());
    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);
    window.addEventListener("fixture:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("fixture:navigate", update);
    };
  }, []);
  return key;
};

const App = () => {
  const location = useLocationKey();
  return (
    <main style={{ padding: "24px 24px 24px 400px", fontFamily: "sans-serif" }}>
      <p data-testid="fixture-location">{location}</p>
      <nav style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          data-testid="nav-orders"
          onClick={() => navigate("/orders?status=open")}
        >
          Orders
        </button>
        <button
          type="button"
          data-testid="nav-order"
          onClick={() => navigate("/orders/42?tab=items")}
        >
          Order 42
        </button>
        <button
          type="button"
          data-testid="nav-order-notes"
          onClick={() => navigate("/orders/42?tab=notes")}
        >
          Order 42 notes
        </button>
        <a href="#history" data-testid="nav-hash">
          History
        </a>
      </nav>
      <section style={{ marginTop: 24 }}>
        <button type="button" data-testid="fixture-export">
          Export orders
        </button>
        <h2 id="history">History</h2>
      </section>
    </main>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <PromptThisSpotProvider config={config}>
      <FloatingLauncherStackProvider>
        <InspectPromptPreferencesProvider>
          <App />
          <InspectPromptToolGate eligible />
          <UserFeedbackToolGate eligible />
        </InspectPromptPreferencesProvider>
      </FloatingLauncherStackProvider>
    </PromptThisSpotProvider>
  );
}
