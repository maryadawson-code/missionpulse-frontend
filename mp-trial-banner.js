/**
 * FILE: mp-trial-banner.js
 * PURPOSE: s6-5 — Trial expiration check on dashboard
 * Include via <script src="mp-trial-banner.js"></script> AFTER mp-rbac.js
 *
 * If plan='trial' AND trial_ends_at is past or within 3 days:
 *   Show urgent upgrade banner
 * If plan='trial' AND trial_ends_at > 3 days away:
 *   Show gentle reminder
 * Otherwise: do nothing
 *
 * AI GENERATED -- REQUIRES HUMAN REVIEW
 */

(function() {
  'use strict';

  async function checkTrial() {
    if (typeof sbClient === 'undefined') return;

    try {
      var sess = await sbClient.auth.getSession();
      if (!sess.data.session) return;

      var uid = sess.data.session.user.id;
      var prof = await sbClient.from('profiles').select('company_id').eq('id', uid).single();
      if (!prof.data) return;

      var co = await sbClient.from('companies').select('subscription_tier, trial_ends_at').eq('id', prof.data.company_id).single();
      if (!co.data || co.data.subscription_tier !== 'trial') return;
      if (!co.data.trial_ends_at) return;

      var trialEnd = new Date(co.data.trial_ends_at);
      var now = new Date();
      var daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      var banner = document.createElement('div');
      banner.id = 'mp-trial-banner';
      banner.style.cssText = 'margin-bottom:16px;border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;';

      if (daysLeft <= 0) {
        banner.style.background = 'rgba(239,68,68,0.1)';
        banner.style.border = '1px solid rgba(239,68,68,0.3)';
        banner.innerHTML = '<div><span style="color:#EF4444;font-weight:600;font-size:13px;">Trial Expired</span><span style="color:#94A3B8;font-size:12px;margin-left:8px;">Upgrade now to keep your data and access.</span></div><a href="billing.html" style="background:#EF4444;color:white;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">Upgrade Now</a>';
      } else if (daysLeft <= 3) {
        banner.style.background = 'rgba(245,158,11,0.1)';
        banner.style.border = '1px solid rgba(245,158,11,0.3)';
        banner.innerHTML = '<div><span style="color:#F59E0B;font-weight:600;font-size:13px;">' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left in trial</span><span style="color:#94A3B8;font-size:12px;margin-left:8px;">Upgrade to keep all your proposal data.</span></div><a href="billing.html" style="background:#F59E0B;color:#00050F;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">View Plans</a>';
      } else if (daysLeft <= 14) {
        banner.style.background = 'rgba(0,229,250,0.05)';
        banner.style.border = '1px solid rgba(0,229,250,0.15)';
        banner.innerHTML = '<div><span style="color:#00E5FA;font-weight:600;font-size:13px;">Free Trial</span><span style="color:#64748B;font-size:12px;margin-left:8px;">' + daysLeft + ' days remaining</span></div><a href="billing.html" style="color:#00E5FA;font-size:12px;text-decoration:none;">View plans &rarr;</a>';
      } else {
        return;
      }

      var target = document.querySelector('.max-w-7xl') || document.querySelector('main') || document.body.firstElementChild;
      if (target && target.firstChild) {
        target.insertBefore(banner, target.children[1] || target.firstChild);
      }
    } catch (e) {
      console.warn('[Trial Banner]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(checkTrial, 1200); });
  } else {
    setTimeout(checkTrial, 1200);
  }

})();
