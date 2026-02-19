/**
 * FILE: mp-rbac.js
 * SECURITY: NIST 800-53 Rev 5 — AC-3 (Access Enforcement), AC-6 (Least Privilege)
 * PATTERN: "Invisible RBAC" — restricted features never render, no "Access Denied" errors
 * 
 * USAGE: Include via <script src="mp-rbac.js"></script> AFTER supabase-client.js
 *        Then call: await MP_RBAC.init()
 * 
 * EXPOSES:
 *   window.MP_ROLE          — raw DB role string (e.g., "CEO")
 *   window.MP_CONFIG_ROLE   — mapped config role ID (e.g., "executive")
 *   window.MP_PERMS         — full permissions object from config
 *   MP_RBAC.canAccess(mod)  — boolean: should this module render?
 *   MP_RBAC.canEdit(mod)    — boolean: can user edit in this module?
 *   MP_RBAC.canView(mod)    — boolean: can user view this module?
 *   MP_RBAC.getNavItems()   — filtered nav array for sidebar
 *   MP_RBAC.guardPage(mod)  — redirect to dashboard if no access
 *   MP_RBAC.hideEditControls() — hides .mp-edit elements if read-only for current page
 *
 * AI GENERATED — REQUIRES HUMAN REVIEW
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // DB ROLE → CONFIG ROLE MAPPING
  // ═══════════════════════════════════════════════════════
  const ROLE_MAP = {
    'CEO':      'executive',
    'COO':      'operations',
    'CAP':      'capture_manager',
    'PM':       'proposal_manager',
    'VL':       'volume_lead',
    'FIN':      'pricing_manager',
    'CON':      'contracts',
    'DEL':      'hr_staffing',
    'SA':       'author',
    'SME':      'author',
    'AUTHOR':   'author',
    'PARTNER':  'partner',
    'SUB':      'subcontractor',
    'CONSULT':  'consultant',
    // Fallback aliases
    'Admin':    'executive',
    'admin':    'executive',
  };

  // ═══════════════════════════════════════════════════════
  // FULL PERMISSIONS CONFIG (embedded from roles_permissions_config.json)
  // Only module access + nav — keeps this file lean
  // ═══════════════════════════════════════════════════════
  const ROLE_MODULES = {
    executive: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: true, canView: true, canEdit: true },
      integrations: { shouldRender: true, canView: true, canEdit: true },
      audit_log: { shouldRender: true, canView: true, canEdit: false },
    },
    operations: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: true },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: true, canView: true, canEdit: false },
      audit_log: { shouldRender: true, canView: true, canEdit: false },
    },
    capture_manager: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: true },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: true },
      blackhat: { shouldRender: true, canView: true, canEdit: true },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    proposal_manager: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: true, canView: true, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: true, canView: true, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: true },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: true, canView: true, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    volume_lead: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    pricing_manager: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: true, canView: true, canEdit: true },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    contracts: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: true },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    hr_staffing: {
      dashboard: { shouldRender: true, canView: true, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    author: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: true },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    partner: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    subcontractor: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: true },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: false, canView: false, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: false, canView: false, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: true },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
    consultant: {
      dashboard: { shouldRender: false, canView: false, canEdit: false },
      pipeline: { shouldRender: false, canView: false, canEdit: false },
      proposals: { shouldRender: true, canView: true, canEdit: false },
      pricing: { shouldRender: false, canView: false, canEdit: false },
      strategy: { shouldRender: true, canView: true, canEdit: false },
      blackhat: { shouldRender: false, canView: false, canEdit: false },
      compliance: { shouldRender: true, canView: true, canEdit: false },
      workflow_board: { shouldRender: true, canView: true, canEdit: false },
      ai_chat: { shouldRender: true, canView: true, canEdit: true },
      documents: { shouldRender: true, canView: true, canEdit: false },
      analytics: { shouldRender: false, canView: false, canEdit: false },
      admin: { shouldRender: false, canView: false, canEdit: false },
      integrations: { shouldRender: false, canView: false, canEdit: false },
      audit_log: { shouldRender: false, canView: false, canEdit: false },
    },
  };

  // ═══════════════════════════════════════════════════════
  // NAVIGATION CONFIG
  // Maps module IDs to sidebar items with routes + icons
  // ═══════════════════════════════════════════════════════
  const NAV_CONFIG = {
    primary: [
      { id: 'dashboard',      label: 'Dashboard',     icon: 'grid',       route: 'dashboard.html' },
      { id: 'pipeline',       label: 'Pipeline',      icon: 'trending-up', route: 'pipeline-kanban.html' },
      { id: 'proposals',      label: 'Proposals',     icon: 'file-text',  route: 'section-writer.html' },
      { id: 'workflow_board', label: 'Workflow',      icon: 'columns',    route: 'swimlane-board.html' },
      { id: 'compliance',     label: 'Compliance',    icon: 'shield',     route: 'compliance-checker.html' },
      { id: 'documents',      label: 'Documents',     icon: 'folder',     route: 'rfp-shredder.html' },
    ],
    secondary: [
      { id: 'strategy',    label: 'Strategy',       icon: 'target',      route: 'war-room.html' },
      { id: 'blackhat',    label: 'Black Hat',      icon: 'alert-triangle', route: 'blackhat-review.html', badge: 'Private' },
      { id: 'pricing',     label: 'Pricing / BOE',  icon: 'dollar-sign', route: 'boe-builder.html', badge: 'CUI' },
      { id: 'analytics',   label: 'Analytics',      icon: 'bar-chart',   route: 'analytics.html' },
      { id: 'ai_chat',     label: 'AI Assistant',   icon: 'cpu',         route: 'agent-hub.html' },
    ],
    admin: [
      { id: 'admin',        label: 'Admin',        icon: 'settings',  route: 'admin.html' },
      { id: 'integrations', label: 'Integrations', icon: 'link',      route: 'integrations.html' },
      { id: 'audit_log',    label: 'Audit Log',    icon: 'clock',     route: 'audit-log.html' },
    ],
  };

  // ═══════════════════════════════════════════════════════
  // CUI / SECURITY CONFIG PER ROLE
  // ═══════════════════════════════════════════════════════
  const SECURITY_CONFIG = {
    executive:        { forceCUI: false, canExportCUI: true,  timeout: 28800 },
    operations:       { forceCUI: false, canExportCUI: true,  timeout: 28800 },
    capture_manager:  { forceCUI: false, canExportCUI: true,  timeout: 14400 },
    proposal_manager: { forceCUI: false, canExportCUI: true,  timeout: 14400 },
    volume_lead:      { forceCUI: false, canExportCUI: true,  timeout: 14400 },
    pricing_manager:  { forceCUI: true,  canExportCUI: true,  timeout: 14400 },
    contracts:        { forceCUI: false, canExportCUI: true,  timeout: 14400 },
    hr_staffing:      { forceCUI: true,  canExportCUI: false, timeout: 7200  },
    author:           { forceCUI: false, canExportCUI: true,  timeout: 14400 },
    partner:          { forceCUI: true,  canExportCUI: false, timeout: 3600  },
    subcontractor:    { forceCUI: true,  canExportCUI: false, timeout: 3600  },
    consultant:       { forceCUI: true,  canExportCUI: false, timeout: 3600  },
  };

  // ═══════════════════════════════════════════════════════
  // CORE RBAC ENGINE
  // ═══════════════════════════════════════════════════════
  const MP_RBAC = {

    _initialized: false,
    _dbRole: null,
    _configRole: null,
    _modules: null,

    /**
     * Initialize RBAC — call once on page load after Supabase auth check.
     * Requires `sbClient` (global Supabase client) to exist.
     * Returns { role, configRole, modules } or null if not authenticated.
     */
    async init() {
      if (this._initialized) return this._getState();

      // Require Supabase client
      if (typeof sbClient === 'undefined') {
        console.error('[MP_RBAC] sbClient not found. Include supabase-client.js first.');
        return null;
      }

      // Get current session
      const { data: { session }, error: sErr } = await sbClient.auth.getSession();
      if (sErr || !session) {
        console.warn('[MP_RBAC] No active session — redirecting to login.');
        window.location.href = 'login.html';
        return null;
      }

      // Fetch role from profiles
      const { data: profile, error: pErr } = await sbClient
        .from('profiles')
        .select('role, full_name, company_id')
        .eq('id', session.user.id)
        .single();

      if (pErr || !profile) {
        console.error('[MP_RBAC] Could not load profile:', pErr?.message);
        // Default to most restrictive
        this._dbRole = 'AUTHOR';
        this._configRole = 'author';
      } else {
        this._dbRole = (profile.role || 'AUTHOR').toUpperCase();
        this._configRole = ROLE_MAP[this._dbRole] || ROLE_MAP[profile.role] || 'author';
      }

      this._modules = ROLE_MODULES[this._configRole] || ROLE_MODULES.author;
      this._initialized = true;

      // Set globals for legacy pages
      window.MP_ROLE = this._dbRole;
      window.MP_CONFIG_ROLE = this._configRole;
      window.MP_PERMS = this._modules;
      window.MP_USER_NAME = profile?.full_name || session.user.email;
      window.MP_COMPANY_ID = profile?.company_id || null;
      window.MP_SECURITY = SECURITY_CONFIG[this._configRole] || SECURITY_CONFIG.author;

      console.log(`[MP_RBAC] Role: ${this._dbRole} → ${this._configRole} | Modules: ${Object.keys(this._modules).filter(m => this._modules[m].shouldRender).length} accessible`);

      return this._getState();
    },

    _getState() {
      return {
        role: this._dbRole,
        configRole: this._configRole,
        modules: this._modules,
        security: SECURITY_CONFIG[this._configRole],
      };
    },

    // ── Access Checks ────────────────────────────────────

    /** Should this module render at all for the current user? */
    canAccess(moduleId) {
      if (!this._modules) return false;
      return this._modules[moduleId]?.shouldRender === true;
    },

    /** Can the user view content in this module? */
    canView(moduleId) {
      if (!this._modules) return false;
      return this._modules[moduleId]?.canView === true;
    },

    /** Can the user create/edit/delete in this module? */
    canEdit(moduleId) {
      if (!this._modules) return false;
      return this._modules[moduleId]?.canEdit === true;
    },

    /** Is the user read-only for this module? (can view but not edit) */
    isReadOnly(moduleId) {
      return this.canView(moduleId) && !this.canEdit(moduleId);
    },

    // ── Navigation ───────────────────────────────────────

    /** Returns filtered nav items grouped by section */
    getNavItems() {
      const filter = (items) => items.filter(item => this.canAccess(item.id));
      return {
        primary:   filter(NAV_CONFIG.primary),
        secondary: filter(NAV_CONFIG.secondary),
        admin:     filter(NAV_CONFIG.admin),
      };
    },

    /** Get flat array of all accessible nav items */
    getNavItemsFlat() {
      const nav = this.getNavItems();
      return [...nav.primary, ...nav.secondary, ...nav.admin];
    },

    // ── Page Guards ──────────────────────────────────────

    /**
     * Call at top of module page. If user can't access, redirect to dashboard.
     * Usage: await MP_RBAC.guardPage('blackhat');
     */
    async guardPage(moduleId) {
      if (!this._initialized) await this.init();
      if (!this.canAccess(moduleId)) {
        console.warn(`[MP_RBAC] Access denied: ${moduleId} — redirecting.`);
        window.location.href = 'dashboard.html';
        return false;
      }
      return true;
    },

    // ── UI Helpers ───────────────────────────────────────

    /**
     * Hides all elements with class "mp-edit" if user is read-only for given module.
     * Call after DOM renders.
     * Usage: MP_RBAC.hideEditControls('compliance');
     */
    hideEditControls(moduleId) {
      if (!this.canEdit(moduleId)) {
        document.querySelectorAll('.mp-edit').forEach(el => {
          el.style.display = 'none';
        });
        // Also disable any remaining inputs/buttons just in case
        document.querySelectorAll('.mp-edit-inline').forEach(el => {
          el.disabled = true;
          el.style.opacity = '0.5';
          el.style.cursor = 'not-allowed';
        });
      }
    },

    /**
     * Returns true if CUI watermark should be forced for current user.
     */
    shouldForceCUI() {
      return SECURITY_CONFIG[this._configRole]?.forceCUI === true;
    },

    /**
     * Returns true if user can export CUI-marked content.
     */
    canExportCUI() {
      return SECURITY_CONFIG[this._configRole]?.canExportCUI === true;
    },

    /**
     * Render a CUI banner at top of page if required.
     * Call after DOM ready.
     */
    renderCUIBanner() {
      if (!this.shouldForceCUI()) return;
      const banner = document.createElement('div');
      banner.id = 'cui-banner';
      banner.style.cssText = 'background:#991B1B;color:#FCA5A5;text-align:center;padding:6px 12px;font-size:11px;font-weight:600;letter-spacing:1px;position:fixed;top:0;left:0;right:0;z-index:9999;';
      banner.textContent = 'CUI // SP-PROPIN — CONTROLLED UNCLASSIFIED INFORMATION';
      document.body.prepend(banner);
      document.body.style.paddingTop = '30px';
    },

    // ── SVG Icons (simple inline) ────────────────────────

    getIcon(name) {
      const icons = {
        'grid':            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        'trending-up':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
        'file-text':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        'columns':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/></svg>',
        'shield':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        'folder':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        'target':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        'alert-triangle':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'dollar-sign':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        'bar-chart':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
        'cpu':             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
        'settings':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        'link':            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        'clock':           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'log-out':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        'user':            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        'competitor':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      };
      return icons[name] || icons['grid'];
    },
  };

  // Expose globally
  window.MP_RBAC = MP_RBAC;

})();
