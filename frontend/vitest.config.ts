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
      // Ratchet strategy: thresholds start low (50%) to establish a baseline
      // and will be increased by 5% per quarter as coverage improves.
      // Goal: 70% line coverage by end of Year 1.
      thresholds: {
        // Global thresholds
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,

        // Directory-aware thresholds to enforce higher standards for core logic
        // Utils: High threshold for pure logic
        'src/utils/**': {
          lines: 85,
          statements: 85,
          branches: 70,
          functions: 85,
        },
        // Hooks: Medium-high baseline for reactive logic
        'src/hooks/**': {
          lines: 60,
          statements: 60,
          branches: 50,
          functions: 60,
        },
        // Stats: Highest threshold for critical scoring and math logic
        'src/utils/stats/**': {
          lines: 90,
          statements: 90,
          branches: 80,
          functions: 90,
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
