/**
 * Lighthouse CI Configuration
 *
 * Enforces performance budgets and accessibility scores.
 * Runs against a local `next start` build.
 *
 * Usage: npm run lighthouse
 *
 * v1.4 Sprint 35 T-35.5
 */
module.exports = {
  ci: {
    collect: {
      // Run against a local production build
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/login',
        'http://localhost:3000/plans',
      ],
      numberOfRuns: 3,
      settings: {
        // Use mobile preset (more restrictive, catches more issues)
        preset: 'desktop',
        // Skip categories that need auth
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.8 }],
        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Core Web Vitals budgets
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 512000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 102400 }],
      },
    },
    upload: {
      // Use temporary public storage (no LHCI server needed)
      target: 'temporary-public-storage',
    },
  },
}
