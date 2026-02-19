/**
 * MissionPulse RBAC Guard v1.0
 * Invisible RBAC enforcement — restricted modules silently redirect.
 * Load via <script src="rbac-guard.js"></script> before </head> on every module page.
 *
 * Each page sets window.RBAC_ALLOWED before this script runs, e.g.:
 *   <script>window.RBAC_ALLOWED = ['executive','operations','capture_manager'];</script>
 *   <script src="rbac-guard.js"></script>
 *
 * If window.RBAC_ALLOWED is not set, page is PUBLIC (all roles allowed).
 *
 * Role is read from localStorage key 'missionpulse_role'.
 * If no role found, defaults to 'viewer' (most restricted).
 *
 * SECURITY: This is client-side only. Server-side RLS via Supabase
 * is the true enforcement layer. This prevents UI exposure.
 */

(function () {
  'use strict';

  // ── Module → Allowed Roles Map ──
  // Used by inject script to auto-set window.RBAC_ALLOWED per filename
  // Also used at runtime as fallback if page doesn't declare RBAC_ALLOWED
  var MODULE_RBAC = {
    // ── UNRESTRICTED (all roles) ──
    'index': null,
    'login': null,
    'signup': null,
    '404': null,
    'missionpulse-module-index': null,
    'missionpulse-v12-demo': null,

    // ── BLACK HAT / COMPETITIVE INTEL — CEO, COO, Capture Manager only ──
    'missionpulse-m7-blackhat-enhanced': ['executive', 'operations', 'capture_manager'],
    'missionpulse-m11-frenemy-protocol': ['executive', 'operations', 'capture_manager'],
    'missionpulse-competitors-deep': ['executive', 'operations', 'capture_manager'],
    'missionpulse-competitive-landscape': ['executive', 'operations', 'capture_manager'],
    'missionpulse-win-themes-mgr': ['executive', 'operations', 'capture_manager'],
    'missionpulse-winthemes-v2': ['executive', 'operations', 'capture_manager'],
    'missionpulse-winthemes-analytics': ['executive', 'operations', 'capture_manager'],

    // ── PRICING / CUI — CEO, COO, Finance, PM only ──
    'missionpulse-m8-pricing': ['executive', 'operations', 'finance', 'proposal_manager'],
    'missionpulse-price-analysis': ['executive', 'operations', 'finance', 'proposal_manager'],
    'missionpulse-pricing-library': ['executive', 'operations', 'finance', 'proposal_manager'],
    'missionpulse-teaming-calc': ['executive', 'operations', 'finance', 'proposal_manager'],
    'missionpulse-budget-tracker': ['executive', 'operations', 'finance', 'proposal_manager'],

    // ── AUDIT / COMPLIANCE ADMIN — CEO, COO, Admin only ──
    'missionpulse-rbac-audit': ['executive', 'operations'],
    'missionpulse-cui-audit': ['executive', 'operations'],
    'missionpulse-audit-log-v2': ['executive', 'operations'],
    'missionpulse-rls-report': ['executive', 'operations'],
    'missionpulse-system-health': ['executive', 'operations'],
    'missionpulse-compliance-map': ['executive', 'operations', 'compliance_lead'],
    'missionpulse-compliance-mapping': ['executive', 'operations', 'compliance_lead'],
    'missionpulse-compliance-checklist': ['executive', 'operations', 'compliance_lead'],
    'missionpulse-compliance-v2': ['executive', 'operations', 'compliance_lead'],

    // ── ADMIN PAGES — CEO, COO only ──
    'admin-requests': ['executive', 'operations'],
    'missionpulse-demo-accounts': ['executive', 'operations'],
    'missionpulse-sam-import': ['executive', 'operations'],
    'missionpulse-crm-integration': ['executive', 'operations'],

    // ── STRATEGY — CEO, COO, Capture Manager, Volume Leads ──
    'missionpulse-m1-enhanced': ['executive', 'operations', 'capture_manager', 'volume_lead', 'proposal_manager'],
    'missionpulse-m2-warroom-enhanced': ['executive', 'operations', 'capture_manager', 'volume_lead', 'proposal_manager'],
    'missionpulse-m3-swimlane-board': ['executive', 'operations', 'capture_manager', 'volume_lead', 'proposal_manager'],
    'missionpulse-analytics-dash': ['executive', 'operations', 'capture_manager', 'proposal_manager'],
    'missionpulse-health-score': ['executive', 'operations', 'capture_manager', 'proposal_manager'],
    'missionpulse-stakeholder-map': ['executive', 'operations', 'capture_manager', 'proposal_manager'],
    'missionpulse-debrief': ['executive', 'operations', 'capture_manager', 'proposal_manager'],

    // ── ORALS — internal roles only (no partners/subs) ──
    'missionpulse-orals-v2': ['executive', 'operations', 'capture_manager', 'volume_lead', 'proposal_manager', 'author', 'finance', 'compliance_lead', 'reviewer'],
    'missionpulse-m9-hitl-enhanced': ['executive', 'operations', 'capture_manager', 'volume_lead', 'proposal_manager', 'author', 'finance', 'compliance_lead', 'reviewer'],
  };

  // ── Resolve current page key ──
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
  if (!filename || filename === '') filename = 'index';

  // ── Determine allowed roles ──
  // Priority: 1) window.RBAC_ALLOWED set by page, 2) MODULE_RBAC lookup, 3) null = public
  var allowed = window.RBAC_ALLOWED || MODULE_RBAC[filename] || null;

  // null = unrestricted page, skip check
  if (allowed === null) return;

  // ── Get current user role ──
  var role = localStorage.getItem('missionpulse_role') || 'viewer';

  // ── Check access ──
  if (allowed.indexOf(role) === -1) {
    // INVISIBLE RBAC: no error message, no flash — just redirect
    window.location.replace('/index.html');
    // Prevent any page rendering while redirect processes
    document.documentElement.style.display = 'none';
  }

  // ── Expose for other scripts ──
  window.MISSIONPULSE_RBAC = {
    role: role,
    allowed: allowed,
    filename: filename,
    hasAccess: allowed === null || allowed.indexOf(role) !== -1,
    MODULE_RBAC: MODULE_RBAC
  };
})();
