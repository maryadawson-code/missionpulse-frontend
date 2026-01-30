// ============================================================
// BLACK HAT MODULE - RBAC SECURITY PATCH
// Restricted to: CEO, COO, CAP, Admin
// ============================================================

// Add this IMMEDIATELY after CONFIG object in missionpulse-m7-blackhat-enhanced.html

// RBAC Configuration for Black Hat
const BLACKHAT_RBAC = {
  ALLOWED_ROLES: ['CEO', 'COO', 'CAP', 'Admin'],
  MODULE_NAME: 'Black Hat Intel',
  CLASSIFICATION: 'PROPRIETARY - COMPETITIVE INTELLIGENCE'
};

// Check RBAC access
const checkBlackHatAccess = (userRole) => {
  if (!BLACKHAT_RBAC.ALLOWED_ROLES.includes(userRole)) {
    // Invisible RBAC - redirect without error message
    console.warn('[RBAC] Access denied to Black Hat for role:', userRole);
    window.location.href = 'missionpulse-dashboard-hub.html';
    return false;
  }
  // Log access for audit
  const auditEntry = {
    timestamp: new Date().toISOString(),
    module: 'blackhat',
    action: 'access',
    role: userRole
  };
  const auditLog = JSON.parse(localStorage.getItem('MP_AUDIT_LOG') || '[]');
  auditLog.push(auditEntry);
  localStorage.setItem('MP_AUDIT_LOG', JSON.stringify(auditLog.slice(-100)));
  return true;
};

// ============================================================
// REPLACE YOUR App() function's useEffect with:
// ============================================================
/*
useEffect(() => {
  const userData = checkAuth();
  if (!userData) return;
  
  // RBAC Check for Black Hat
  if (!checkBlackHatAccess(userData.role)) return;
  
  setUser(userData);
  setCurrentRole(userData.role);
}, []);
*/

// ============================================================
// ADD THIS BANNER AT TOP OF MAIN CONTENT AREA:
// ============================================================
/*
{/* RBAC Warning Banner */}
<div className="bg-amber-900/30 border-b border-amber-500/30 px-4 py-2">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-amber-400">🔒</span>
      <span className="text-amber-300 text-sm font-medium">
        {BLACKHAT_RBAC.CLASSIFICATION}
      </span>
    </div>
    <div className="text-xs text-amber-400/70">
      Access: {BLACKHAT_RBAC.ALLOWED_ROLES.join(', ')}
    </div>
  </div>
</div>
*/

// ============================================================
// FULL PATCHED useEffect FOR BLACK HAT:
// ============================================================

const BlackHatRBACWrapper = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = checkAuth();
    if (!userData) return;
    
    if (!BLACKHAT_RBAC.ALLOWED_ROLES.includes(userData.role)) {
      window.location.href = 'missionpulse-dashboard-hub.html';
      return;
    }
    
    setUser(userData);
    setAuthorized(true);
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#00050F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* RBAC Classification Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/50 border-b border-amber-500/30 px-4 py-2">
        <div className="flex items-center justify-center gap-3">
          <span className="text-amber-400">🔒</span>
          <span className="text-amber-300 text-sm font-mono font-bold">
            PROPRIETARY - COMPETITIVE INTELLIGENCE - RESTRICTED ACCESS
          </span>
          <span className="text-amber-400">🔒</span>
        </div>
      </div>
      <div className="pt-10">
        {children}
      </div>
    </>
  );
};
