import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({resolve:{alias:{"@":path.resolve("src")}},test:{include:["tests/**/*.test.ts"],env:{DATABASE_URL:`file:${path.resolve(".data/unit-test.db")}`,AI_API_KEY:"test-provider-never-a-real-key",AI_SETTINGS_ENCRYPTION_KEY:"ab".repeat(32)},fileParallelism:false}});
