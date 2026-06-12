import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 2,
      },
    },
    testTimeout: 15000,
    hookTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html", "json-summary", "json"],
      reportsDirectory: "./coverage",
      // Ratchet strategy: thresholds start low (50%) to establish a baseline
      // and will be increased by 5% per quarter as coverage improves.
      // Goal: 70% line coverage by end of Year 1.
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,
      },
      exclude: [
        "src/setupTests.ts",
        "src/dbMock.ts",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.stories.*",
        "node_modules/fake-indexeddb/**",
      ],
    },
  },
});
