/**
 * FILE: mp-exports.js
 * SECURITY: NIST 800-53 Rev 5 — AU-3 (Content of Audit Records), AC-3 (Access Enforcement)
 * PURPOSE: Client-side CSV + DOCX exports for all MissionPulse modules
 *
 * USAGE: Include via <script src="mp-exports.js"></script> AFTER mp-rbac.js
 *
 * API:
 *   MP_EXPORT.toCSV(filename, headers, rows)   — downloads CSV with BOM
 *   MP_EXPORT.toDOCX(filename, config)          — downloads formatted Word doc
 *   MP_EXPORT.addExportBar(containerId, options) — renders export button bar
 *
 * AI GENERATED — REQUIRES HUMAN REVIEW
 */

(function() {
  'use strict';

  const MP_EXPORT = {

    // ═══════════════════════════════════════════════════════
    // CSV EXPORT — UTF-8 BOM for Excel compatibility
    // s5-1: Pipeline, Compliance, Competitors, Pricing, RFP
    // ═══════════════════════════════════════════════════════

    /**
     * Export data as CSV file.
     * @param {string} filename — e.g., "compliance-matrix-2026-02-19.csv"
     * @param {string[]} headers — column headers ["Requirement", "Status", ...]
     * @param {string[][]} rows — array of row arrays [["SC-1", "Complete"], ...]
     * @param {string} [moduleId] — optional module ID for CUI check
     */
    toCSV(filename, headers, rows, moduleId) {
      // RBAC: Block CUI export if role doesn't allow it
      if (moduleId && !this._checkExportPermission(moduleId)) return;

      const BOM = '\uFEFF'; // UTF-8 BOM for Excel
      const escape = (val) => {
        if (val == null) return '';
        const str = String(val);
        // Escape quotes and wrap if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const csvContent = BOM +
        headers.map(escape).join(',') + '\n' +
        rows.map(row => row.map(escape).join(',')).join('\n');

      this._download(csvContent, filename, 'text/csv;charset=utf-8;');
      this._logExport(filename, 'csv', rows.length, moduleId);
    },

    // ═══════════════════════════════════════════════════════
    // DOCX EXPORT — Word-compatible HTML (opens in Word/LibreOffice)
    // s5-2: Section Writer | s5-3: Compliance Matrix
    // ═══════════════════════════════════════════════════════

    /**
     * Export data as Word document (.doc).
     * Uses Word-compatible HTML — opens in all Word versions.
     *
     * @param {string} filename — e.g., "proposal-sections-2026-02-19.doc"
     * @param {object} config
     * @param {string} config.title — document title
     * @param {string} [config.subtitle] — optional subtitle
     * @param {string} [config.companyName] — company name for header
     * @param {'sections'|'table'} config.type — layout type
     * @param {object[]} [config.sections] — for type='sections': [{heading, body}, ...]
     * @param {string[]} [config.tableHeaders] — for type='table': column headers
     * @param {string[][]} [config.tableRows] — for type='table': row data
     * @param {string} [config.moduleId] — for CUI check
     */
    toDOCX(filename, config) {
      if (config.moduleId && !this._checkExportPermission(config.moduleId)) return;

      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const company = config.companyName || 'Mission Meets Tech';
      const isCUI = config.moduleId === 'pricing';
      const cuiBanner = isCUI
        ? '<div style="background:#991B1B;color:#FCA5A5;text-align:center;padding:8px;font-size:10px;font-weight:bold;letter-spacing:1px;margin-bottom:20px;">CUI // SP-PROPIN — CONTROLLED UNCLASSIFIED INFORMATION</div>'
        : '';

      let bodyContent = '';

      if (config.type === 'sections' && config.sections) {
        // s5-2: Proposal sections as formatted document
        bodyContent = config.sections.map((s, i) => `
          <div style="margin-bottom:24px;${i > 0 ? 'page-break-before:auto;' : ''}">
            <h2 style="font-size:16px;color:#1a1a1a;border-bottom:2px solid #00E5FA;padding-bottom:6px;margin-bottom:12px;">${this._escapeHtml(s.heading)}</h2>
            <div style="font-size:12px;line-height:1.8;color:#333;">${this._escapeHtml(s.body).replace(/\n/g, '<br>')}</div>
          </div>
        `).join('');
      } else if (config.type === 'table' && config.tableHeaders && config.tableRows) {
        // s5-3: Compliance matrix as table
        bodyContent = `
          <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:16px;">
            <thead>
              <tr style="background:#0A1628;color:#E2E8F0;">
                ${config.tableHeaders.map(h => `<th style="padding:8px 10px;text-align:left;border:1px solid #334155;font-weight:600;">${this._escapeHtml(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${config.tableRows.map((row, i) => `
                <tr style="background:${i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                  ${row.map(cell => `<td style="padding:6px 10px;border:1px solid #E2E8F0;color:#1a1a1a;">${this._escapeHtml(cell)}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 1in; }
            body { font-family: Calibri, Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
            h1 { font-size: 22px; color: #00050F; margin-bottom: 4px; }
            h2 { font-size: 16px; color: #1a1a1a; }
            .header { border-bottom: 3px solid #00E5FA; padding-bottom: 12px; margin-bottom: 20px; }
            .meta { font-size: 11px; color: #64748B; }
            .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 9px; color: #94A3B8; text-align: center; }
          </style>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
            </w:WordDocument>
          </xml>
          <![endif]-->
        </head>
        <body>
          ${cuiBanner}
          <div class="header">
            <h1>${this._escapeHtml(config.title)}</h1>
            ${config.subtitle ? '<p style="font-size:13px;color:#475569;margin-top:2px;">' + this._escapeHtml(config.subtitle) + '</p>' : ''}
            <p class="meta">${this._escapeHtml(company)} &mdash; ${date}</p>
          </div>

          ${bodyContent}

          <div class="footer">
            Generated by MissionPulse &mdash; ${date}<br>
            AI GENERATED &mdash; REQUIRES HUMAN REVIEW
          </div>
        </body>
        </html>
      `;

      this._download(html, filename, 'application/msword');
      this._logExport(filename, 'docx', config.sections?.length || config.tableRows?.length || 0, config.moduleId);
    },

    // ═══════════════════════════════════════════════════════
    // EXPORT BUTTON BAR — inject into module pages
    // ═══════════════════════════════════════════════════════

    /**
     * Renders an export button bar into a container.
     * @param {string} containerId — DOM element ID to inject into
     * @param {object} options
     * @param {function} options.onCSV — callback for CSV export
     * @param {function} [options.onDOCX] — callback for DOCX export (optional)
     * @param {string} [options.moduleId] — module ID for permission check
     */
    addExportBar(containerId, options) {
      const container = document.getElementById(containerId);
      if (!container) return;

      // s5-4: Don't show export if user can't view this module
      if (options.moduleId && window.MP_RBAC && !MP_RBAC.canView(options.moduleId)) return;

      const showDocx = typeof options.onDOCX === 'function';
      const cuiWarning = options.moduleId === 'pricing' && window.MP_RBAC && !MP_RBAC.canExportCUI()
        ? '<span style="color:#EF4444;font-size:10px;margin-left:8px;">CUI export restricted for your role</span>'
        : '';

      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="mp-export-csv-btn" onclick="window._mpExportCSV()"
            style="background:transparent;border:1px solid rgba(0,229,250,0.3);color:#00E5FA;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.15s;"
            onmouseover="this.style.background='rgba(0,229,250,0.08)'"
            onmouseout="this.style.background='transparent'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
          ${showDocx ? `
          <button id="mp-export-docx-btn" onclick="window._mpExportDOCX()"
            style="background:transparent;border:1px solid rgba(139,92,246,0.3);color:#A78BFA;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.15s;"
            onmouseover="this.style.background='rgba(139,92,246,0.08)'"
            onmouseout="this.style.background='transparent'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Export Word
          </button>` : ''}
          ${cuiWarning}
        </div>
      `;

      // Bind callbacks to window for onclick access
      window._mpExportCSV = options.onCSV;
      if (showDocx) window._mpExportDOCX = options.onDOCX;

      // s5-4: Hide export buttons if CUI export blocked for pricing
      if (options.moduleId === 'pricing' && window.MP_RBAC && !MP_RBAC.canExportCUI()) {
        const btns = container.querySelectorAll('button');
        btns.forEach(b => { b.disabled = true; b.style.opacity = '0.3'; b.style.cursor = 'not-allowed'; });
      }
    },

    // ═══════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════

    _checkExportPermission(moduleId) {
      if (!window.MP_RBAC) return true; // No RBAC loaded = allow (demo mode)
      if (!MP_RBAC.canView(moduleId)) {
        console.warn('[MP_EXPORT] Export blocked — no view access to', moduleId);
        return false;
      }
      // CUI modules require canExportCUI
      if (moduleId === 'pricing' && !MP_RBAC.canExportCUI()) {
        alert('Export restricted: Your role does not have CUI export permissions.');
        return false;
      }
      return true;
    },

    _download(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    _escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    _logExport(filename, format, recordCount, moduleId) {
      console.log(`[MP_EXPORT] ${format.toUpperCase()} → ${filename} (${recordCount} records)`);
      // Log to audit_logs if sbClient available
      if (typeof sbClient !== 'undefined' && window.MP_ROLE) {
        try {
          sbClient.from('audit_logs').insert({
            user_id: '', // filled by trigger or session
            user_role: window.MP_ROLE,
            action: 'DATA_EXPORT',
            table_name: moduleId || 'unknown',
            metadata: { filename, format, record_count: recordCount },
            company_id: window.MP_COMPANY_ID,
          }).then(() => {}).catch(() => {});
        } catch (e) { /* non-blocking */ }
      }
    },

    // ═══════════════════════════════════════════════════════
    // CONVENIENCE: Date string for filenames
    // ═══════════════════════════════════════════════════════

    dateStamp() {
      return new Date().toISOString().slice(0, 10);
    },
  };

  window.MP_EXPORT = MP_EXPORT;

})();
