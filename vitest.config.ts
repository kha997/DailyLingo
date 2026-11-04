import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'src/components/**',
        'src/App.tsx',
        'src/main.tsx',
        'src/types/**',
        // Focus-trap/DOM behaviour is verified in the Playwright dialog journey.
        'src/utils/useDialogA11y.ts',
      ],
      // Core logic has per-file floors so a regression cannot hide behind
      // component/E2E coverage. UI components and the app shell are rendered by
      // the Playwright journeys; they are excluded from the unit-coverage gate
      // (their logic lives in src/utils and src/data, which are thresholded).
      // Browser-API modules (audioEffects, speech) are also exercised in the
      // browser and are intentionally not unit-thresholded.
      thresholds: {
        statements: 62,
        branches: 69,
        functions: 70,
        lines: 62,
        'src/data/curriculumData.ts': {
          statements: 95,
          branches: 90,
          functions: 90,
          lines: 95,
        },
        'src/utils/diagnostics.ts': {
          statements: 90,
          branches: 70,
          functions: 100,
          lines: 95,
        },
        'src/utils/dynamicGenerator.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        'src/utils/notifications.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        'src/utils/progress.ts': {
          statements: 95,
          branches: 85,
          functions: 100,
          lines: 95,
        },
        'src/utils/storage.ts': {
          statements: 78,
          branches: 80,
          functions: 90,
          lines: 82,
        },
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e-tests/**'],
  },
});
