import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'lcov', 'html', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      // Final coverage targets. These are permanent and must not be reduced.
      thresholds: {
        // Global baseline
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,

        // src/utils/** (utility functions, all deterministic pure logic)
        'src/utils/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80,
        },

        // src/hooks/** (custom React hooks, reactive data layer)
        'src/hooks/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80,
        },

        // src/utils/stats/** (scoring and analytics math, highest risk of silent regression)
        'src/utils/stats/**': {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 90,
        },
      },
      exclude: [
        'src/setupTests.ts',
        'src/dbMock.ts',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.stories.*',
        'node_modules/fake-indexeddb/**',
      ],
    },
  },
});
