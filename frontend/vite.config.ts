import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Injected at build time: YYYYMMDD.BUILD_NUMBER
    // BUILD_NUMBER is set by CI (GitHub Actions). Falls back to 0 for local dev.
    __APP_VERSION__: JSON.stringify(
      `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.${process.env.BUILD_NUMBER ?? "0"}`
    ),
  },
});
