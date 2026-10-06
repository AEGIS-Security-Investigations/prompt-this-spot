import { expect, type Page, test } from "@playwright/test";

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

const selectSpot = async (page: Page) => {
  await page.getByTestId("inspect-prompt-toggle").click();
  await page.getByTestId("inspect-prompt-pick-toggle").click();
  await page.getByTestId("fixture-export").click();
  await page.getByTestId("inspect-prompt-pick-toggle").click();
  await page.getByTestId("inspect-prompt-request").fill("Keep this request");
};

const checkHandoff = async (page: Page) => {
  await expect(page.getByTestId("inspect-prompt-copy")).toBeEnabled();
  await page.getByTestId("inspect-prompt-copy").click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("Export orders");
  expect(prompt).toContain("Keep this request");
  // Observe the handoff URL without opening an external service or sending.
  await page.evaluate(() => {
    window.open = (url?: string | URL) => {
      document.body.dataset.handoff = String(url);
      return null;
    };
  });
  await page.getByTestId("inspect-prompt-send-claude").click();
  const href = await page.evaluate(() => document.body.dataset.handoff);
  expect(new URL(href ?? "").searchParams.get("prompt")).toBe(prompt);
};

test("a stalled video render times out, preserves the prompt and permits retry", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/orders");
  await selectSpot(page);
  await expect(
    page.getByTestId("inspect-prompt-screenshot-item")
  ).toHaveAttribute("data-status", "ready");

  // modern-screenshot 4.7.0 waits for seeked on an empty video forever.
  // A real DOM/media stall, rather than a mocked capture function.
  await page.evaluate(() => {
    const video = document.createElement("video");
    video.id = "stalled-video";
    video.width = 160;
    video.height = 90;
    document.querySelector("main")?.appendChild(video);
  });
  await page.getByTestId("inspect-prompt-capture-page").click();
  const shot = page.getByTestId("inspect-prompt-screenshot-item").nth(1);
  await expect(shot).toHaveAttribute("data-status", "capturing");
  await expect(page.getByTestId("inspect-prompt-copy")).toBeDisabled();
  await expect(shot).toHaveAttribute("data-status", "failed", {
    timeout: 30_000,
  });
  await expect(shot).toContainText("capture timed out");
  await checkHandoff(page);

  await page.evaluate(() => document.getElementById("stalled-video")?.remove());
  await shot.getByTestId("inspect-prompt-screenshot-retry").click();
  await expect(shot).toHaveAttribute("data-status", "ready", {
    timeout: 10_000,
  });
  await expect(page.getByTestId("inspect-prompt-request")).toHaveValue(
    "Keep this request"
  );
  await expect(page.getByTestId("inspect-prompt-list-item")).toHaveCount(1);
});

test("a stalled HTTP upload fails and retry retains the chosen spot", async ({
  page,
}) => {
  test.setTimeout(60_000);
  let attempts = 0;
  await page.route("**/fixture-upload", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      return; // Deliberately never answer this request.
    }
    await route.fulfill({
      json: { url: "https://cdn.example.test/recovered.png" },
    });
  });
  await page.goto("/orders?httpUpload");
  await selectSpot(page);
  const shot = page.getByTestId("inspect-prompt-screenshot-item");
  await expect(shot).toHaveAttribute("data-status", "uploading");
  await expect(page.getByTestId("inspect-prompt-send-claude")).toBeDisabled();
  await expect(shot).toHaveAttribute("data-status", "failed", {
    timeout: 30_000,
  });
  await expect(shot).toContainText("upload timed out");
  await checkHandoff(page);
  await shot.getByTestId("inspect-prompt-screenshot-retry").click();
  await expect(shot).toHaveAttribute("data-status", "ready", {
    timeout: 10_000,
  });
  await expect(page.getByTestId("inspect-prompt-list-item")).toHaveCount(1);
  await expect(page.getByTestId("inspect-prompt-request")).toHaveValue(
    "Keep this request"
  );
});

test("removing a pending screenshot immediately restores Copy and Send", async ({
  page,
}) => {
  await page.route("**/fixture-upload", () => {});
  await page.goto("/orders?httpUpload");
  await selectSpot(page);
  const shot = page.getByTestId("inspect-prompt-screenshot-item");
  await expect(shot).toHaveAttribute("data-status", "uploading");
  await expect(page.getByTestId("inspect-prompt-copy")).toBeDisabled();
  await shot.getByTestId("inspect-prompt-screenshot-remove").click();
  await expect(shot).toHaveCount(0);
  await checkHandoff(page);
});
