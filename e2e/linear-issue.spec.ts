import { expect, test } from "@playwright/test";

/**
 * "Create Linear ticket" in "Prompt this spot": the fixture app's
 * `createLinearIssue` records each draft in the page instead of calling a
 * route, so the spec can read exactly what would be sent to Linear.
 */

test("files the picked spot and request as a Linear ticket", async ({
  page,
}) => {
  await page.goto("/orders");
  await page.getByTestId("inspect-prompt-toggle").click();
  await page.getByTestId("inspect-prompt-pick-toggle").click();
  await page.getByTestId("fixture-export").click();
  await page.getByTestId("inspect-prompt-pick-toggle").click();
  await page
    .getByTestId("inspect-prompt-request")
    .fill("Make the export button full width");

  await page.getByTestId("inspect-prompt-create-linear-issue").click();
  const modal = page.getByTestId("inspect-prompt-linear-modal");
  await expect(modal).toBeVisible();
  await expect(page.getByTestId("inspect-prompt-linear-title")).toHaveValue(
    "Make the export button full width"
  );
  await page.getByTestId("inspect-prompt-linear-submit").click();

  await expect(modal).toBeHidden();
  const link = page.getByTestId("inspect-prompt-linear-issue-link");
  await expect(link).toHaveText(/Created FIX-1/);
  await expect(link).toHaveAttribute("href", "https://linear.example.test/FIX-1");

  const drafts = await page.evaluate(() => window.fixtureLinearIssues);
  expect(drafts).toHaveLength(1);
  const [draft] = drafts;
  expect(draft?.title).toBe("Make the export button full width");
  expect(draft?.description).toContain("Repository: acme/example-app");
  expect(draft?.description).toContain('data-testid="fixture-export"');
  expect(draft?.pageUrl).toMatch(/\/orders$/);
});
