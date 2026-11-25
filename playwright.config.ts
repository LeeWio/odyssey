import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? "http://127.0.0.1:3100";
const fixtureOrigin = "http://127.0.0.1:3181";
const realBackend = process.env.PLAYWRIGHT_REAL_BACKEND === "1";
const backendOrigin = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:18080";
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci
    ? [
        ["list"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/e2e-timing.json" }],
      ]
    : "list",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL,
    actionTimeout: ci ? 15_000 : 0,
    navigationTimeout: ci ? 30_000 : 0,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /article-mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /article-mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : [
        ...(realBackend
          ? []
          : [
              {
                command: "bun tests/e2e/fixtures/api.ts",
                env: { E2E_FIXTURE_ORIGIN: fixtureOrigin },
                url: `${fixtureOrigin}/health`,
                timeout: 10_000,
              },
            ]),
        {
          command: "bun run dev --hostname 127.0.0.1 --port 3100",
          env: {
            API_URL: realBackend ? backendOrigin : fixtureOrigin,
            NEXT_PUBLIC_API_BASE_URL: "",
            NEXT_DIST_DIR: ".next-e2e",
            ENABLE_AUTH_TEST_ROUTE: "1",
            ENABLE_RICH_TEXT_TEST_ROUTE: "1",
            WEB_VITALS_ENDPOINT: `${baseURL}/__test/web-vitals`,
          },
          timeout: 120_000,
          url: `${baseURL}/test/rich-text`,
        },
      ],
});
