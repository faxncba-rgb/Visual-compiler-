import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "npm run dev:demo",
      url: "http://127.0.0.1:4173/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "npm run dev:studio",
      url: "http://127.0.0.1:3000/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
