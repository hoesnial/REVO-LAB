import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Intentionally reuse an already-running server. This suite does not create a
// database, touch Studio's test fixtures, or connect to an existing browser.
export default defineConfig({
  testDir: "./tests",
  testMatch: ["revo.e2e.spec.ts", "revo-menu.e2e.spec.ts", "revo-journey.e2e.spec.ts", "revo-assembly.e2e.spec.ts", "revo-filling.e2e.spec.ts", "revo-progress.e2e.spec.ts", "revo-polish.e2e.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  outputDir: "test-results/revo/artifacts",
  reporter: "list",
  use: {
    actionTimeout: 15_000,
    baseURL: process.env.REVO_BASE_URL ?? "http://127.0.0.1:3001",
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
    launchOptions: {
      ...(existsSync(localChrome) ? { executablePath: localChrome } : {}),
      args: ["--use-angle=swiftshader", "--enable-webgl", "--enable-unsafe-swiftshader"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
