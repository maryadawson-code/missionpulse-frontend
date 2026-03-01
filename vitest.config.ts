import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.test.json'] })],
  test: {
    environment: 'jsdom',
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['lib/**', 'components/**', 'app/**'],
      exclude: [
        'lib/supabase/database.types.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 25,
      },
    },
  },
})
