import { defineConfig, devices } from "@playwright/test";

// End-to-end QA run against a live app. Start Postgres, run migrations and the
// seed first; Playwright starts the app itself unless E2E_BASE_URL points at one.
const PORT = Number(process.env.E2E_PORT || 3000);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
