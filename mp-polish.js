/**
 * FILE: mp-polish.js
 * PURPOSE: s7-3 (Loading skeletons) + s7-4 (Error boundaries + empty states)
 * Include via <script src="mp-polish.js"></script> in <head> of every page
 *
 * API:
 *   MP_POLISH.showLoading(containerId, rows)  — show skeleton placeholders
 *   MP_POLISH.hideLoading(containerId)         — remove skeletons
 *   MP_POLISH.showError(containerId, msg)      — friendly error message
 *   MP_POLISH.showEmpty(containerId, config)   — empty state with CTA
 *   MP_POLISH.wrapFetch(fn, containerId)       — auto loading + error handling
 *
 * AI GENERATED -- REQUIRES HUMAN REVIEW
 */

(function() {
  'use strict';

  // Inject skeleton animation CSS once
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes mp-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}',
    '.mp-skeleton{background:linear-gradient(90deg,rgba(30,41,59,0.5) 25%,rgba(51,65,85,0.4) 50%,rgba(30,41,59,0.5) 75%);background-size:800px 100%;animation:mp-shimmer 1.5s infinite;border-radius:6px}',
    '.mp-skeleton-row{display:flex;gap:12px;margin-bottom:12px}',
    '.mp-skeleton-block{height:16px;flex:1}',
    '.mp-skeleton-circle{width:36px;height:36px;border-radius:50%;flex-shrink:0}',
    '.mp-skeleton-wide{flex:3}',
    '.mp-skeleton-narrow{flex:1}',
    '.mp-error-box{text-align:center;padding:40px 20px}',
    '.mp-empty-box{text-align:center;padding:48px 20px}',
    '.mp-loading-wrap{padding:24px}'
  ].join('\n');
  document.head.appendChild(style);

  var MP_POLISH = {

    /**
     * Show loading skeleton placeholders
     * @param {string} containerId - target element ID
     * @param {number} [rows=5] - number of skeleton rows
     */
    showLoading: function(containerId, rows) {
      var el = document.getElementById(containerId);
      if (!el) return;
      rows = rows || 5;
      var html = '<div class="mp-loading-wrap" id="mp-loading-' + containerId + '">';
      for (var i = 0; i < rows; i++) {
        var wide = i % 3 === 0;
        html += '<div class="mp-skeleton-row">';
        if (i === 0) html += '<div class="mp-skeleton mp-skeleton-circle"></div>';
        html += '<div class="mp-skeleton mp-skeleton-block' + (wide ? ' mp-skeleton-wide' : '') + '" style="height:' + (i === 0 ? '20' : '14') + 'px"></div>';
        html += '<div class="mp-skeleton mp-skeleton-block mp-skeleton-narrow" style="height:14px"></div>';
        html += '</div>';
      }
      html += '</div>';
      el.innerHTML = html;
    },

    /**
     * Remove loading skeletons
     * @param {string} containerId
     */
    hideLoading: function(containerId) {
      var loader = document.getElementById('mp-loading-' + containerId);
      if (loader) loader.remove();
    },

    /**
     * Show friendly error message
     * @param {string} containerId
     * @param {string} [message]
     */
    showError: function(containerId, message) {
      var el = document.getElementById(containerId);
      if (!el) return;
      this.hideLoading(containerId);
      var msg = message || 'Something went wrong loading this data.';
      el.innerHTML = '<div class="mp-error-box">' +
        '<div style="font-size:32px;margin-bottom:12px">&#9888;</div>' +
        '<p style="color:#F87171;font-weight:600;font-size:14px">Connection Error</p>' +
        '<p style="color:#64748B;font-size:13px;margin-top:6px">' + msg + '</p>' +
        '<button onclick="location.reload()" style="margin-top:16px;background:rgba(0,229,250,0.1);border:1px solid rgba(0,229,250,0.3);color:#00E5FA;padding:8px 20px;border-radius:6px;font-size:12px;cursor:pointer">Retry</button>' +
        '</div>';
    },

    /**
     * Show empty state with CTA
     * @param {string} containerId
     * @param {object} config
     * @param {string} config.icon - emoji or character
     * @param {string} config.title - heading text
     * @param {string} config.message - description
     * @param {string} [config.ctaText] - button label
     * @param {string} [config.ctaHref] - button link
     * @param {function} [config.ctaAction] - button onclick
     */
    showEmpty: function(containerId, config) {
      var el = document.getElementById(containerId);
      if (!el) return;
      this.hideLoading(containerId);
      var c = config || {};
      var html = '<div class="mp-empty-box">';
      html += '<div style="font-size:40px;margin-bottom:12px;opacity:0.5">' + (c.icon || '&#128203;') + '</div>';
      html += '<p style="color:#E2E8F0;font-weight:600;font-size:15px">' + (c.title || 'No data yet') + '</p>';
      html += '<p style="color:#64748B;font-size:13px;margin-top:6px;max-width:320px;margin-left:auto;margin-right:auto">' + (c.message || 'Get started by adding your first item.') + '</p>';
      if (c.ctaText) {
        if (c.ctaHref) {
          html += '<a href="' + c.ctaHref + '" style="display:inline-block;margin-top:16px;background:#00E5FA;color:#00050F;padding:8px 20px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">' + c.ctaText + '</a>';
        } else {
          html += '<button id="mp-empty-cta-' + containerId + '" style="margin-top:16px;background:#00E5FA;color:#00050F;padding:8px 20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none">' + c.ctaText + '</button>';
        }
      }
      html += '</div>';
      el.innerHTML = html;
      if (c.ctaAction && !c.ctaHref) {
        var btn = document.getElementById('mp-empty-cta-' + containerId);
        if (btn) btn.addEventListener('click', c.ctaAction);
      }
    },

    /**
     * Wrap an async data-fetch function with automatic loading + error handling
     * @param {function} fetchFn - async function that fetches and renders data
     * @param {string} containerId - element to show loading/error in
     * @param {object} [emptyConfig] - config for showEmpty if data is empty
     * @returns {Promise}
     */
    wrapFetch: function(fetchFn, containerId, emptyConfig) {
      var self = this;
      self.showLoading(containerId);
      return fetchFn()
        .then(function(data) {
          self.hideLoading(containerId);
          if (data !== undefined && data !== null && (!Array.isArray(data) || data.length > 0)) {
            return data;
          }
          if (emptyConfig) self.showEmpty(containerId, emptyConfig);
          return data;
        })
        .catch(function(err) {
          console.error('[MP_POLISH] Fetch error:', err);
          self.showError(containerId, 'Could not load data. Check your connection and try again.');
          return null;
        });
    },

    /**
     * Common empty state configs for MissionPulse modules
     */
    EMPTY_STATES: {
      pipeline: {
        icon: '&#127919;',
        title: 'No opportunities yet',
        message: 'Start building your pipeline by adding your first capture.',
        ctaText: 'Add Opportunity',
        ctaHref: 'capture-command.html'
      },
      compliance: {
        icon: '&#9989;',
        title: 'No compliance items',
        message: 'Add your first RFP requirement to start tracking compliance.',
        ctaText: '+ Add Requirement'
      },
      documents: {
        icon: '&#128196;',
        title: 'No RFP sections loaded',
        message: 'Upload or create your first RFP shred to begin analysis.',
        ctaText: '+ Add Section'
      },
      strategy: {
        icon: '&#128373;',
        title: 'No competitors tracked',
        message: 'Add competitor profiles to build your Black Hat analysis.',
        ctaText: '+ Add Competitor'
      },
      pricing: {
        icon: '&#128176;',
        title: 'No pricing items',
        message: 'Build your basis of estimate by adding labor categories.',
        ctaText: '+ Add Line Item'
      },
      proposals: {
        icon: '&#9997;',
        title: 'No proposal sections',
        message: 'Create your first section to start writing your technical volume.',
        ctaText: '+ Add Section'
      }
    }
  };

  window.MP_POLISH = MP_POLISH;

})();
