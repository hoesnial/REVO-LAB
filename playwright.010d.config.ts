import { defineConfig } from "@playwright/test";
import base from "./playwright.revo.config";

export default defineConfig({
  ...base,
  testMatch: ["**/revo-010d-screenshots.spec.ts"],
});
