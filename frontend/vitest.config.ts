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
  },
});
