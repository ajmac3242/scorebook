import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Baked in at build time via CI env vars; falls back gracefully for local dev
    "import.meta.env.VITE_BUILD_NUMBER": JSON.stringify(
      process.env.VITE_BUILD_NUMBER ?? "local"
    ),
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(
      process.env.VITE_BUILD_DATE ??
        new Date().toISOString().slice(0, 10)
    ),
  },
});
