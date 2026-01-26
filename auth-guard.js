/**
 * MissionPulse - Auth Guard
 * Add this script to any page that requires authentication
 * 
 * Usage:
 *   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
 *   <script src="supabase-client.js"></script>
 *   <script src="auth-guard.js"></script>
 * 
 * The script will:
 * 1. Check if user is authenticated
 * 2. Redirect to login if not
 * 3. Check role-based access for restricted modules
 * 4. Populate user info in the page
 */

(async function() {
  // Wait for DOM and MP to be ready
  if (typeof MP === 'undefined') {
    console.error('MissionPulse: supabase-client.js must be loaded before auth-guard.js');
    return;
  }
  
  // ===========================================
  // CHECK AUTHENTICATION
  // ===========================================
  const isAuthenticated = await MP.auth.isAuthenticated();
  
  if (!isAuthenticated) {
    // Save the current URL to redirect back after login
    sessionStorage.setItem('mp_redirect_after_login', window.location.href);
    window.location.href = 'login.html';
    return;
  }
  
  // ===========================================
  // LOAD USER DATA
  // ===========================================
  const user = await MP.auth.getUser();
  const company = await MP.auth.getCompany();
  
  if (!user) {
    console.error('MissionPulse: Failed to load user data');
    window.location.href = 'login.html';
    return;
  }
  
  // ===========================================
  // CHECK MODULE ACCESS (RBAC)
  // ===========================================
  // Determine which module this page is
  const pageName = window.location.pathname.split('/').pop().replace('.html', '');
  
  // Map page names to modules
  const pageToModule = {
    'index': 'dashboard',
    'missionpulse-m1-enhanced': 'pipeline',
    'missionpulse-m2-warroom-enhanced': 'warroom',
    'missionpulse-m3-swimlane-board': 'swimlane',
    'missionpulse-m5-contracts': 'contracts',
    'missionpulse-m5-contracts-enhanced': 'contracts',
    'missionpulse-m6-iron-dome': 'irondome',
    'missionpulse-m7-blackhat-enhanced': 'blackhat',
    'missionpulse-m8-pricing': 'pricing',
    'missionpulse-m9-hitl-enhanced': 'hitl',
    'missionpulse-m11-frenemy-protocol': 'frenemy',
    'missionpulse-m13-launch-roi': 'roi',
    'missionpulse-m14-post-award': 'postaward',
    'missionpulse-m15-lessons-playbook': 'lessons',
    'missionpulse-task16-rbac': 'rbac'
  };
  
  const moduleName = pageToModule[pageName];
  
  // Restricted modules (check access)
  const restrictedModules = ['blackhat', 'pricing', 'frenemy', 'rbac'];
  
  if (moduleName && restrictedModules.includes(moduleName)) {
    const canAccess = await MP.auth.canAccessModule(moduleName);
    
    if (!canAccess) {
      // Redirect to dashboard with access denied message
      sessionStorage.setItem('mp_access_denied', moduleName);
      window.location.href = 'index.html';
      return;
    }
  }
  
  // ===========================================
  // POPULATE USER INFO IN PAGE
  // ===========================================
  // Look for common elements to populate
  const userNameEl = document.getElementById('mp-user-name');
  const userEmailEl = document.getElementById('mp-user-email');
  const userRoleEl = document.getElementById('mp-user-role');
  const userAvatarEl = document.getElementById('mp-user-avatar');
  const companyNameEl = document.getElementById('mp-company-name');
  const logoutBtn = document.getElementById('mp-logout-btn');
  
  if (userNameEl) {
    userNameEl.textContent = user.full_name || user.email.split('@')[0];
  }
  
  if (userEmailEl) {
    userEmailEl.textContent = user.email;
  }
  
  if (userRoleEl) {
    userRoleEl.textContent = user.role;
  }
  
  if (userAvatarEl) {
    if (user.avatar_url) {
      userAvatarEl.src = user.avatar_url;
    } else {
      // Generate initials avatar
      const initials = (user.full_name || user.email)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      userAvatarEl.alt = initials;
      // You could also set a placeholder image or use CSS to show initials
    }
  }
  
  if (companyNameEl && company) {
    companyNameEl.textContent = company.name;
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await MP.auth.signOut();
    });
  }
  
  // ===========================================
  // EXPOSE USER DATA GLOBALLY
  // ===========================================
  window.mpUser = user;
  window.mpCompany = company;
  
  // ===========================================
  // CHECK FOR ACCESS DENIED MESSAGE
  // ===========================================
  const accessDenied = sessionStorage.getItem('mp_access_denied');
  if (accessDenied) {
    sessionStorage.removeItem('mp_access_denied');
    // Show toast notification (if toast system exists)
    if (typeof showToast === 'function') {
      showToast(`Access denied to ${accessDenied} module. Your role: ${user.role}`, 'error');
    } else {
      console.warn(`Access denied to ${accessDenied} module. User role: ${user.role}`);
    }
  }
  
  // ===========================================
  // DISPATCH EVENT WHEN AUTH IS COMPLETE
  // ===========================================
  document.dispatchEvent(new CustomEvent('mp:auth:ready', {
    detail: { user, company }
  }));
  
  console.log('MissionPulse: Auth guard loaded', { user: user.email, role: user.role, company: company?.name });
  
})();
