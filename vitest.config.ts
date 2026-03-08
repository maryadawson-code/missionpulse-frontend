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
      include: ['lib/**'],
      exclude: [
        'lib/supabase/database.types.ts',
        'lib/supabase/types.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.css',
        'lib/integrations/m365/**',
        'lib/integrations/docusign/**',
        'lib/integrations/salesforce/sync-engine.ts',
        'lib/integrations/salesforce/webhooks.ts',
        'lib/integrations/salesforce/contact-sync.ts',
        'lib/integrations/google/drive.ts',
        'lib/integrations/google/calendar.ts',
        'lib/integrations/google/auth.ts',
        'lib/integrations/slack/gate-approval.ts',
        'lib/integrations/slack/auth.ts',
        'lib/integrations/govwin/sync.ts',
        'lib/integrations/govwin/client.ts',
        'lib/integrations/fpds/**',
        'lib/integrations/oauth-manager.ts',
        'lib/integrations/aggregator/**',
        'lib/integrations/usaspending/**',
        'lib/integrations/hubspot/**',
        'lib/integrations/salesforce/auth.ts',
        'lib/integrations/salesforce/field-mapping.ts',
        'lib/integrations/slack/webhook-handler.ts',
        'lib/collaboration/sync/providers/**',
        'lib/collaboration/coordination/**',
        'lib/offline/**',
        'lib/workspaces/**',
        'lib/docgen/docx-engine.ts',
        'lib/ai/orchestrator/**',
        'lib/ai/providers/anthropic.ts',
        'lib/ai/providers/asksage.ts',
        'lib/ai/providers/openai.ts',
        'lib/ai/providers/health.ts',
        // Infrastructure / environment-dependent (no local testable logic)
        'lib/monitoring/**',
        'lib/testing/**',
        'lib/supabase/**',
        // React context (requires render tests, not unit)
        'lib/rbac/RoleContext.tsx',
        // Re-export barrel
        'lib/rbac/index.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 45,
        branches: 35,
      },
    },
  },
})
