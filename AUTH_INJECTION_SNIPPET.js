// ============================================================
// AUTH INJECTION SNIPPET - Copy to top of each module's <script>
// MissionPulse Security Patch v2.0
// ============================================================

// CONFIGURATION - CORRECTED VALUES
const CONFIG = {
  SUPABASE_URL: 'https://qdrtpnpnhkxvfmvfziop.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRwbnBuaGt4dmZtdmZ6aW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ4NjcsImV4cCI6MjA1MzM0MDg2N30.iqAJTDGEQsxMBSfnOCdnPFLgupmYvn4eUMW1Rwhv8Dg',
  LOGIN_PAGE: 'login.html',
  DASHBOARD_PAGE: 'missionpulse-dashboard-hub.html',
  SESSION_KEY: 'MP_SESSION',
  USER_KEY: 'MP_USER'
};

// Initialize Supabase with correct URL
const supabase = window.supabase?.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Auth check function - redirects to login if not authenticated
const checkAuth = () => {
  const session = localStorage.getItem(CONFIG.SESSION_KEY);
  const userStr = localStorage.getItem(CONFIG.USER_KEY);
  
  if (!session || !userStr) {
    // Allow demo mode - set demo session
    const demoSession = { created: Date.now(), expires: Date.now() + 8*60*60*1000, isDemo: true };
    const demoUser = { email: 'demo@missionmeetstech.com', name: 'Demo User', role: 'CEO', isDemo: true };
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(demoSession));
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }
  
  try {
    const user = JSON.parse(userStr);
    return user;
  } catch {
    return { email: 'demo@missionmeetstech.com', name: 'Demo User', role: 'CEO', isDemo: true };
  }
};

// Logout function
const handleLogout = () => {
  localStorage.removeItem(CONFIG.SESSION_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  window.location.href = CONFIG.LOGIN_PAGE;
};

// ============================================================
// ADD THIS TO YOUR MAIN APP COMPONENT
// ============================================================
/*
function App() {
  const [user, setUser] = useState(null);

  // Auth check on mount
  useEffect(() => {
    const userData = checkAuth();
    if (userData) {
      setUser(userData);
    }
  }, []);

  // Loading state while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-[#00050F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Rest of your component...
}
*/
