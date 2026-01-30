// ============================================================
// CUI BANNER COMPONENT - PRICING MODULE SECURITY PATCH
// NIST 800-171 Compliant Marking
// ============================================================

// Add this to missionpulse-m8-pricing.html

// CUI Configuration
const CUI_CONFIG = {
  MARKING: 'CUI//SP-PROP',
  FULL_TEXT: 'CONTROLLED UNCLASSIFIED INFORMATION - PROPRIETARY',
  WARNING: 'This page contains contractor proprietary pricing data protected under FAR 52.215-1(e)',
  ALLOWED_ROLES: ['CEO', 'COO', 'FIN', 'Admin'],
  EXPORT_WARNING: 'CUI data export requires authorization. All exports are logged.'
};

// CUI Banner Component
const CUIBanner = () => (
  <div className="fixed top-0 left-0 right-0 z-50">
    {/* Primary CUI Banner */}
    <div className="bg-red-900/80 border-b-2 border-red-500 px-4 py-2">
      <div className="flex items-center justify-center gap-4">
        <span className="text-red-400 font-bold">⛔</span>
        <span className="text-red-200 font-mono font-bold tracking-wider">
          {CUI_CONFIG.MARKING}
        </span>
        <span className="text-red-300 text-sm">|</span>
        <span className="text-red-300 text-sm font-medium">
          {CUI_CONFIG.FULL_TEXT}
        </span>
        <span className="text-red-400 font-bold">⛔</span>
      </div>
    </div>
    {/* Secondary Warning */}
    <div className="bg-red-950/50 border-b border-red-800/50 px-4 py-1">
      <p className="text-center text-red-400/80 text-xs">
        {CUI_CONFIG.WARNING}
      </p>
    </div>
  </div>
);

// CUI Footer Component
const CUIFooter = () => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-900/50 border-t border-red-500/30 px-4 py-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-red-400 font-mono">{CUI_CONFIG.MARKING}</span>
      <span className="text-red-400/70">
        {CUI_CONFIG.EXPORT_WARNING}
      </span>
      <span className="text-red-400 font-mono">{CUI_CONFIG.MARKING}</span>
    </div>
  </div>
);

// RBAC Check for Pricing
const checkPricingAccess = (userRole) => {
  if (!CUI_CONFIG.ALLOWED_ROLES.includes(userRole)) {
    console.warn('[RBAC] Access denied to Pricing for role:', userRole);
    window.location.href = 'missionpulse-dashboard-hub.html';
    return false;
  }
  // Audit log
  const auditEntry = {
    timestamp: new Date().toISOString(),
    module: 'pricing',
    action: 'cui_access',
    role: userRole,
    classification: CUI_CONFIG.MARKING
  };
  const auditLog = JSON.parse(localStorage.getItem('MP_AUDIT_LOG') || '[]');
  auditLog.push(auditEntry);
  localStorage.setItem('MP_AUDIT_LOG', JSON.stringify(auditLog.slice(-100)));
  return true;
};

// CUI Wrapper Component
const CUIWrapper = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userData = checkAuth();
    if (!userData) return;
    
    if (!checkPricingAccess(userData.role)) return;
    
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
      <CUIBanner />
      <div className="pt-20 pb-16">
        {children}
      </div>
      <CUIFooter />
    </>
  );
};

// ============================================================
// USAGE IN PRICING MODULE:
// ============================================================
/*
// Wrap your main App render:
function App() {
  return (
    <CUIWrapper>
      <PricingDashboard />
    </CUIWrapper>
  );
}
*/

// ============================================================
// EXPORT INTERCEPTION - Add to any export/download buttons:
// ============================================================
const handleCUIExport = (exportType, data) => {
  // Log export attempt
  const auditEntry = {
    timestamp: new Date().toISOString(),
    module: 'pricing',
    action: 'cui_export',
    exportType: exportType,
    classification: CUI_CONFIG.MARKING
  };
  const auditLog = JSON.parse(localStorage.getItem('MP_AUDIT_LOG') || '[]');
  auditLog.push(auditEntry);
  localStorage.setItem('MP_AUDIT_LOG', JSON.stringify(auditLog));

  // Show confirmation dialog
  const confirmed = window.confirm(
    `⚠️ CUI EXPORT WARNING\n\n` +
    `You are about to export ${CUI_CONFIG.MARKING} data.\n\n` +
    `This action will be logged for compliance.\n\n` +
    `Continue?`
  );

  return confirmed;
};
