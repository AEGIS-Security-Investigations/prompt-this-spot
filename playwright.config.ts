import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.FIXTURE_PORT ?? 4178);

/**
 * End-to-end specs run the real tools in Chromium against a fixture app
 * (`e2e/fixture`). Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to use a browser that is
 * already installed instead of the one `playwright install` downloads.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
          : {},
      },
    },
  ],
  webServer: {
    command: "bun e2e/fixture/serve.ts",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { FIXTURE_PORT: String(port) },
  },
});
