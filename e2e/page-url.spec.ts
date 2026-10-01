import { expect, type Page, test } from "@playwright/test";

/**
 * The page URL and repository in "Prompt this spot" and "Send feedback":
 * shown live in the drawer, snapshotted per capture, and written into every
 * prompt with secrets removed. Runs against the fixture app in e2e/fixture.
 */

const REPO_LINE = "Repository: acme/example-app";
const SECRET = "s3cr3t-value";

/** A 1×1 PNG, served for the fixture's fake screenshot URLs. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("https://cdn.example.test/**", (route) =>
    route.fulfill({ contentType: "image/png", body: PNG })
  );
});

const origin = (page: Page) => new URL(page.url()).origin;

const currentUrl = (page: Page) =>
  page.getByTestId("inspect-prompt-page-url-value");

const readClipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

/** Open "Prompt this spot" and turn on pick mode. */
const openInspector = async (page: Page) => {
  await page.getByTestId("inspect-prompt-toggle").click();
  await expect(page.getByTestId("inspect-prompt-drawer")).toHaveAttribute(
    "aria-hidden",
    "false"
  );
};

const pick = async (page: Page, testId: string) => {
  const pickToggle = page.getByTestId("inspect-prompt-pick-toggle");
  if ((await pickToggle.getAttribute("aria-pressed")) !== "true") {
    await pickToggle.click();
  }
  await page.getByTestId(testId).click();
  await pickToggle.click(); // Stop picking so nav clicks navigate.
};

const waitForShotsReady = async (page: Page, count: number) => {
  const shots = page.getByTestId("inspect-prompt-screenshot-item");
  await expect(shots).toHaveCount(count);
  for (let index = 0; index < count; index++) {
    await expect(shots.nth(index)).toHaveAttribute("data-status", "ready", {
      timeout: 30_000,
    });
  }
};

test("shows the current URL, follows client-side navigation and Back/Forward, and keeps each capture's URL", async ({
  page,
}) => {
  await page.goto(`/orders?status=open&access_token=${SECRET}#totals`);
  const base = origin(page);
  const firstPage = `${base}/orders?status=open&access_token=REDACTED#totals`;

  await openInspector(page);
  // Full URL with the token withheld, before anything is captured.
  await expect(currentUrl(page)).toHaveText(firstPage);

  await pick(page, "fixture-export");
  await page.getByTestId("inspect-prompt-capture-page").click();
  await waitForShotsReady(page, 2);

  // pushState navigation: the display follows, earlier captures keep theirs.
  await page.getByTestId("nav-order").click();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=items`);
  await expect(
    page.getByTestId("inspect-prompt-list-item-page-url")
  ).toHaveText(`captured on ${firstPage}`);
  await expect(
    page.getByTestId("inspect-prompt-screenshot-page-url")
  ).toHaveCount(2);

  // Query-only change.
  await page.getByTestId("nav-order-notes").click();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=notes`);

  // Hash navigation.
  await page.getByTestId("nav-hash").click();
  await expect(currentUrl(page)).toHaveText(
    `${base}/orders/42?tab=notes#history`
  );

  // Back and Forward, without a reload.
  await page.goBack();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=notes`);
  await page.goBack();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=items`);
  await page.goForward();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=notes`);

  // Back on the first page, the "captured on" labels disappear again.
  await page.goBack();
  await page.goBack();
  await expect(currentUrl(page)).toHaveText(firstPage);
  await expect(
    page.getByTestId("inspect-prompt-list-item-page-url")
  ).toHaveCount(0);

  // A second spot on a different page, then copy.
  await page.getByTestId("nav-order").click();
  await expect(currentUrl(page)).toHaveText(`${base}/orders/42?tab=items`);
  await pick(page, "nav-orders");
  await waitForShotsReady(page, 3);
  await page.getByTestId("inspect-prompt-request").fill("Line these up");
  await page.getByTestId("inspect-prompt-copy").click();

  const prompt = await readClipboard(page);
  expect(prompt.startsWith(`${REPO_LINE}\n\n`)).toBe(true);
  expect(prompt).toContain("these 2 spots");
  expect(prompt).toContain(
    `[1] On the page "/orders":\n- Page URL: ${firstPage}\n`
  );
  expect(prompt).toContain(
    `[2] On the page "/orders/42":\n- Page URL: ${base}/orders/42?tab=items\n`
  );
  // The full-page shot keeps the page it was taken on.
  expect(prompt).toContain(`  Page URL: ${firstPage}`);
  expect(prompt).not.toContain(SECRET);

  // Claude Code on the web receives the same text.
  await page.evaluate(() => {
    const opened: string[] = [];
    (window as unknown as { opened: string[] }).opened = opened;
    window.open = (url?: string | URL) => {
      opened.push(String(url));
      return null;
    };
  });
  await page.getByTestId("inspect-prompt-send-claude").click();
  const opened = await page.evaluate(
    () => (window as unknown as { opened: string[] }).opened
  );
  const handoff = new URL(opened[0] ?? "");
  expect(handoff.searchParams.get("prompt")).toBe(prompt);
  expect(handoff.searchParams.get("repositories")).toBe("acme/example-app");
});

test("a screenshot-only prompt names the repository and the page URL", async ({
  page,
}) => {
  await page.goto("/orders?status=open#totals");
  const base = origin(page);

  await openInspector(page);
  await page.getByTestId("inspect-prompt-capture-page").click();
  await waitForShotsReady(page, 1);
  await page.getByTestId("inspect-prompt-request").fill("Why is this cut off?");
  await page.getByTestId("inspect-prompt-copy").click();

  const prompt = await readClipboard(page);
  expect(prompt.startsWith(`${REPO_LINE}\n\nIn our app, here is what I'm looking at:`)).toBe(true);
  expect(prompt).toContain("Full-page screenshot:");
  expect(prompt).toContain(`  Page URL: ${base}/orders?status=open#totals`);
});

test("feedback promptText carries the URL; the structured payload keeps its shape", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("fixture:e2e-user-feedback", "1");
  });
  await page.goto(`/orders?status=open&code=${SECRET}`);
  const base = origin(page);

  await page.getByTestId("user-feedback-toggle").click();
  await expect(page.getByTestId("user-feedback-drawer")).toBeVisible();
  await page.getByTestId("user-feedback-pick").click();
  await page.getByTestId("fixture-export").click();
  await page.getByTestId("user-feedback-pick").click();
  await expect(page.getByTestId("user-feedback-screenshot-item")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 30_000 }
  );
  await page.getByTestId("user-feedback-message").fill("Export does nothing");
  await page.getByTestId("user-feedback-submit").click();

  await expect
    .poll(() => page.evaluate(() => window.fixtureFeedback.length))
    .toBe(1);
  const submission = await page.evaluate(() => window.fixtureFeedback[0]);
  if (!submission) {
    throw new Error("no feedback submission recorded");
  }

  expect(submission.promptText).toContain(REPO_LINE);
  expect(submission.promptText).toContain(
    `Page URL: ${base}/orders?status=open&code=REDACTED`
  );
  expect(JSON.stringify(submission)).not.toContain(SECRET);
  expect(submission.pathname).toBe("/orders");
  expect(Object.keys(submission).sort()).toEqual(
    [
      "category",
      "message",
      "pathname",
      "promptText",
      "screenshots",
      "selections",
      "viewportHeight",
      "viewportWidth",
    ].sort()
  );
  expect(Object.keys(submission.selections[0] ?? {}).sort()).toEqual(
    ["block", "label", "pathname", "selector"].sort()
  );
  expect(Object.keys(submission.screenshots[0] ?? {}).sort()).toEqual(
    ["expiresAt", "kind", "label", "note", "pathname", "url"].sort()
  );
});
