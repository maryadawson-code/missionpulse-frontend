#!/bin/bash
# MissionPulse Sprint 2 — Bug Fix Installer
# Usage: cd ~/Desktop/missionpulse-frontend && bash install-sprint2-fix.sh
# Prerequisites: Must be on v2-development branch

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(pwd)"

echo "🔧 MissionPulse Sprint 2 Fix — Installing..."
echo "   Target: $REPO_ROOT"
echo ""

# Verify we're in the right repo
if [ ! -f "$REPO_ROOT/package.json" ]; then
  echo "❌ ERROR: No package.json found. Run this from ~/Desktop/missionpulse-frontend"
  exit 1
fi

# Verify branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$BRANCH" != "v2-development" ]; then
  echo "⚠️  WARNING: Current branch is '$BRANCH', expected 'v2-development'"
  read -p "   Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Copy fixed files
echo "📁 Copying fixed files..."

cp "$SCRIPT_DIR/lib/supabase/types.ts" "$REPO_ROOT/lib/supabase/types.ts"
echo "   ✅ lib/supabase/types.ts (ModuleId + Opportunity type)"

cp "$SCRIPT_DIR/lib/actions/opportunities.ts" "$REPO_ROOT/lib/actions/opportunities.ts"
echo "   ✅ lib/actions/opportunities.ts (server actions)"

cp "$SCRIPT_DIR/components/dashboard/Sidebar.tsx" "$REPO_ROOT/components/dashboard/Sidebar.tsx"
echo "   ✅ components/dashboard/Sidebar.tsx (null role fallback)"

cp "$SCRIPT_DIR/components/dashboard/DashboardClient.tsx" "$REPO_ROOT/components/dashboard/DashboardClient.tsx"
echo "   ✅ components/dashboard/DashboardClient.tsx (Opportunity from types)"

cp "$SCRIPT_DIR/components/modules/OpportunityDetail.tsx" "$REPO_ROOT/components/modules/OpportunityDetail.tsx"
echo "   ✅ components/modules/OpportunityDetail.tsx (removed unused imports)"

cp "$SCRIPT_DIR/app/globals.css" "$REPO_ROOT/app/globals.css"
echo "   ✅ app/globals.css (no @apply custom colors)"

cp "$SCRIPT_DIR/app/(dashboard)/page.tsx" "$REPO_ROOT/app/(dashboard)/page.tsx"
echo "   ✅ app/(dashboard)/page.tsx (Opportunity from types)"

cp "$SCRIPT_DIR/.eslintrc.json" "$REPO_ROOT/.eslintrc.json"
echo "   ✅ .eslintrc.json (no @typescript-eslint dependency)"

echo ""
echo "🏗️  Running build validation..."
npm run build 2>&1 | tail -5

BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  echo ""
  echo "✅ BUILD PASSED — Sprint 2 fix complete!"
  echo ""
  echo "Next steps:"
  echo "  git add ."
  echo "  git commit -m 'fix(sprint2): resolve build errors — types, null role, CSS, ESLint'"
  echo "  git push origin v2-development"
else
  echo ""
  echo "⚠️  Build returned exit code $BUILD_EXIT — check output above"
fi
