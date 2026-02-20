#!/bin/bash
# ═══════════════════════════════════════════════════════
# MissionPulse Sprint 2 Cleanup — Zero Warnings Fix
# © 2026 Mission Meets Tech
# ═══════════════════════════════════════════════════════
set -e

REPO="${HOME}/Desktop/missionpulse-frontend"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 MissionPulse Sprint 2 Cleanup"
echo "   Target: ${REPO}"
echo ""

cd "$REPO"

# ── FIX 0: BUILD BLOCKER — OpportunityForm.tsx ──────────
echo "📁 [0/8] Replacing OpportunityForm.tsx (build blocker)..."
cp -f "${SCRIPT_DIR}/components/modules/OpportunityForm.tsx" \
      "${REPO}/components/modules/OpportunityForm.tsx"

# ── FIX 1: layout.tsx — unused 'Profile' import ─────────
echo "🧹 [1/8] layout.tsx — removing unused Profile import..."
sed -i '' "/^import type { Profile } from/d" "app/(dashboard)/layout.tsx"

# ── FIX 2: callback/route.ts — unused 'options' param ───
echo "🧹 [2/8] route.ts — prefixing unused options → _options..."
sed -i '' 's/ options:/ _options:/; s/ options)/ _options)/' "app/api/auth/callback/route.ts"

# ── FIX 3: DashboardClient.tsx — unused 'useState' ──────
echo "🧹 [3/8] DashboardClient.tsx — removing unused useState..."
sed -i '' 's/useState, //; s/, useState//' "components/dashboard/DashboardClient.tsx"

# ── FIX 4: Sidebar.tsx — unused 'ShieldAlert' ───────────
echo "🧹 [4/8] Sidebar.tsx — removing unused ShieldAlert..."
# Remove from import line (handles "ShieldAlert," or ", ShieldAlert" or standalone)
sed -i '' '/ShieldAlert/{ s/ShieldAlert,[ ]*//' "components/dashboard/Sidebar.tsx"
sed -i '' 's/,[ ]*ShieldAlert//' "components/dashboard/Sidebar.tsx"
# Close any unclosed pattern from first sed
sed -i '' '/^$/d' "components/dashboard/Sidebar.tsx" 2>/dev/null || true

# ── FIX 5: OpportunityCard.tsx — unused 'pwinBg' ────────
echo "🧹 [5/8] OpportunityCard.tsx — prefixing pwinBg → _pwinBg..."
sed -i '' 's/const pwinBg/const _pwinBg/' "components/modules/OpportunityCard.tsx"

# ── FIX 6: OpportunityDetail.tsx — unused 'opp', 'id' ───
echo "🧹 [6/8] OpportunityDetail.tsx — prefixing unused opp/id..."
# Line ~29-30: these are typically destructured params like { opp, id }
# or function params (opp: X, id: Y). Prefix with underscore.
perl -i -pe 's/\b(opp)\b(?=\s*[:,}])/_$1/g if $. >= 27 && $. <= 32' \
  "components/modules/OpportunityDetail.tsx"
perl -i -pe 's/\b(id)\b(?=\s*[:,}])/_$1/g if $. >= 27 && $. <= 32' \
  "components/modules/OpportunityDetail.tsx"

# ── FIX 7: opportunities.ts — unused 'ShipleyPhase' ─────
echo "🧹 [7/8] opportunities.ts — removing unused ShipleyPhase..."
sed -i '' 's/ShipleyPhase, //; s/, ShipleyPhase//' "lib/actions/opportunities.ts"

# ── FIX 8: globals.css — add form-input class ────────────
echo "🧹 [8/8] globals.css — ensuring form-input class exists..."
if ! grep -q '\.form-input' "app/globals.css"; then
  cat >> "app/globals.css" << 'CSSEOF'

@layer components {
  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #FFFFFF;
    background-color: #00050F;
    border: 1px solid #1E293B;
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out;
  }
  .form-input:focus {
    outline: none;
    border-color: #00E5FA;
    box-shadow: 0 0 0 1px #00E5FA;
  }
  .form-input::placeholder { color: #475569; }
  select.form-input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2rem;
  }
}
CSSEOF
  echo "   ✅ form-input class added"
else
  echo "   ⏭️  form-input already exists"
fi

# ── BUILD VERIFICATION ───────────────────────────────────
echo ""
echo "🏗️  Running npm run build..."
echo ""
npm run build 2>&1 | tee /tmp/mp-build.txt

WARNINGS=$(grep -c "Warning:" /tmp/mp-build.txt 2>/dev/null || echo 0)
ERRORS=$(grep -c "Failed to compile" /tmp/mp-build.txt 2>/dev/null || echo 0)

echo ""
echo "═══════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ BUILD FAILED — check /tmp/mp-build.txt"
elif [ "$WARNINGS" -gt 0 ]; then
  echo "⚠️  ${WARNINGS} warning(s) remain — check /tmp/mp-build.txt"
else
  echo "✅ ZERO ERRORS • ZERO WARNINGS"
fi
echo "═══════════════════════════════════════════════════"
