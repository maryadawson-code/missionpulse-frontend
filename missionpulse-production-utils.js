// ============================================================
// MISSIONPULSE v12 - PRODUCTION HARDENING UTILITIES
// Shared components for error handling, loading states, and API
// © 2026 Mission Meets Tech
// ============================================================

// ============================================================
// API CONFIGURATION
// ============================================================
const API_CONFIG = {
  baseUrl: 'https://missionpulse-api.onrender.com/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// ============================================================
// ERROR BOUNDARY COMPONENT (React Class Component)
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log to console in development
    console.error('MissionPulse Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(ErrorFallback, {
        error: this.state.error,
        onRetry: () => this.setState({ hasError: false, error: null, errorInfo: null })
      });
    }
    return this.props.children;
  }
}

// ============================================================
// ERROR FALLBACK UI COMPONENT
// ============================================================
const ErrorFallback = ({ error, onRetry, title = 'Something went wrong' }) => {
  return React.createElement('div', {
    className: 'min-h-[400px] flex items-center justify-center p-8'
  },
    React.createElement('div', {
      className: 'max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-xl p-8 text-center'
    },
      // Error Icon
      React.createElement('div', {
        className: 'w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center'
      },
        React.createElement('svg', {
          className: 'w-8 h-8 text-red-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          })
        )
      ),
      // Title
      React.createElement('h3', {
        className: 'text-lg font-semibold text-white mb-2'
      }, title),
      // Error Message
      React.createElement('p', {
        className: 'text-sm text-slate-400 mb-6'
      }, error?.message || 'An unexpected error occurred. Please try again.'),
      // Retry Button
      onRetry && React.createElement('button', {
        onClick: onRetry,
        className: 'px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors'
      }, 'Try Again'),
      // AI Footer reminder
      React.createElement('p', {
        className: 'text-[10px] text-slate-600 mt-6'
      }, 'AI GENERATED - REQUIRES HUMAN REVIEW')
    )
  );
};

// ============================================================
// LOADING SPINNER COMPONENT
// ============================================================
const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return React.createElement('div', {
    className: 'flex flex-col items-center justify-center p-8'
  },
    React.createElement('div', {
      className: `${sizeClasses[size]} border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin`
    }),
    message && React.createElement('p', {
      className: 'mt-4 text-sm text-slate-400'
    }, message)
  );
};

// ============================================================
// LOADING OVERLAY COMPONENT
// ============================================================
const LoadingOverlay = ({ isVisible, message = 'Processing...' }) => {
  if (!isVisible) return null;
  
  return React.createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm'
  },
    React.createElement('div', {
      className: 'bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-sm'
    },
      React.createElement(LoadingSpinner, { size: 'lg', message }),
      React.createElement('p', {
        className: 'text-[10px] text-slate-500 mt-4'
      }, 'AI GENERATED - REQUIRES HUMAN REVIEW')
    )
  );
};

// ============================================================
// SKELETON LOADER COMPONENT
// ============================================================
const SkeletonLoader = ({ lines = 3, showHeader = true }) => {
  return React.createElement('div', {
    className: 'animate-pulse space-y-4'
  },
    showHeader && React.createElement('div', {
      className: 'h-6 bg-slate-700/50 rounded w-1/3'
    }),
    ...Array(lines).fill(null).map((_, i) => 
      React.createElement('div', {
        key: i,
        className: `h-4 bg-slate-700/50 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`
      })
    )
  );
};

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return React.createElement(ToastContext.Provider, { value: { addToast, removeToast } },
    children,
    React.createElement(ToastContainer, { toasts, removeToast })
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return React.createElement('div', {
    className: 'fixed bottom-20 right-4 z-50 space-y-2'
  },
    toasts.map(toast => React.createElement(Toast, {
      key: toast.id,
      ...toast,
      onClose: () => removeToast(toast.id)
    }))
  );
};

const Toast = ({ message, type, onClose }) => {
  const typeStyles = {
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
  };

  const icons = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  return React.createElement('div', {
    className: `flex items-center gap-3 px-4 py-3 rounded-lg border ${typeStyles[type]} animate-fadeIn min-w-[300px]`
  },
    React.createElement('svg', {
      className: 'w-5 h-5 flex-shrink-0',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    },
      React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        d: icons[type]
      })
    ),
    React.createElement('span', { className: 'flex-1 text-sm' }, message),
    React.createElement('button', {
      onClick: onClose,
      className: 'p-1 hover:bg-white/10 rounded'
    },
      React.createElement('svg', {
        className: 'w-4 h-4',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M6 18L18 6M6 6l12 12'
        })
      )
    )
  );
};

const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ============================================================
// API SERVICE WITH ERROR HANDLING
// ============================================================
const apiService = {
  async fetch(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timed out. Please try again.', 408);
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        error.message || 'Network error. Please check your connection.',
        0
      );
    }
  },

  async get(endpoint) {
    return this.fetch(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
};

// Custom API Error class
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// CUSTOM HOOKS
// ============================================================

// useAPI Hook - For data fetching with loading/error states
const useAPI = (endpoint, options = {}) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.get(endpoint);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  React.useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  }, [fetchData, options.immediate]);

  return { data, loading, error, refetch: fetchData };
};

// useLocalStorage Hook - For persisting state
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = React.useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ============================================================
// RBAC UTILITIES
// ============================================================
const RBACUtils = {
  // Check if user has access to a module
  hasAccess: (role, moduleId) => {
    if (!role || !role.access) return false;
    return role.access.includes(moduleId);
  },

  // Get accessible modules for a role
  getAccessibleModules: (role, allModules) => {
    if (!role || !role.access) return [];
    return allModules.filter(mod => role.access.includes(mod.id));
  },

  // Check for restrictions
  hasRestriction: (role, restrictionType) => {
    if (!role || !role.restrictions) return false;
    return role.restrictions.some(r => r.toLowerCase().includes(restrictionType.toLowerCase()));
  },

  // Format role for display
  formatRole: (role) => ({
    ...role,
    displayName: `${role.name} (${role.shipleyFunction})`
  })
};

// ============================================================
// GLOBAL FOOTER COMPONENT
// ============================================================
const GlobalFooter = ({ version = 'v12.0' }) => {
  return React.createElement('div', {
    className: 'fixed bottom-0 left-0 right-0 h-6 bg-slate-900/95 border-t border-slate-800 flex items-center justify-center z-50'
  },
    React.createElement('span', {
      className: 'text-[10px] text-slate-500 tracking-wider'
    }, `AI GENERATED - REQUIRES HUMAN REVIEW • MissionPulse ${version} Ultimate • © 2026 Mission Meets Tech`)
  );
};

// ============================================================
// CONNECTION STATUS INDICATOR
// ============================================================
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [apiStatus, setApiStatus] = React.useState('checking');

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    const checkAPI = async () => {
      try {
        await apiService.get('/training-data/summary');
        setApiStatus('connected');
      } catch (err) {
        setApiStatus('disconnected');
      }
    };

    if (isOnline) {
      checkAPI();
      const interval = setInterval(checkAPI, 60000); // Check every minute
      return () => clearInterval(interval);
    } else {
      setApiStatus('offline');
    }
  }, [isOnline]);

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'API Connected', pulse: false },
    disconnected: { color: 'bg-red-500', text: 'API Disconnected', pulse: true },
    offline: { color: 'bg-amber-500', text: 'Offline', pulse: true },
    checking: { color: 'bg-blue-500', text: 'Connecting...', pulse: true }
  };

  const config = statusConfig[apiStatus];

  return React.createElement('div', {
    className: 'flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50'
  },
    React.createElement('div', {
      className: `w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`
    }),
    React.createElement('span', {
      className: 'text-xs text-slate-400'
    }, config.text)
  );
};

// ============================================================
// EMPTY STATE COMPONENT
// ============================================================
const EmptyState = ({ 
  icon = 'inbox', 
  title = 'No data available', 
  description = 'There is nothing to display yet.',
  action = null 
}) => {
  const icons = {
    inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  };

  return React.createElement('div', {
    className: 'flex flex-col items-center justify-center py-16 px-8 text-center'
  },
    React.createElement('div', {
      className: 'w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center'
    },
      React.createElement('svg', {
        className: 'w-8 h-8 text-slate-500',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 1.5,
          d: icons[icon] || icons.inbox
        })
      )
    ),
    React.createElement('h3', {
      className: 'text-lg font-medium text-slate-300 mb-2'
    }, title),
    React.createElement('p', {
      className: 'text-sm text-slate-500 max-w-sm'
    }, description),
    action && React.createElement('div', { className: 'mt-6' }, action)
  );
};

// ============================================================
// CONFIRMATION DIALOG COMPONENT
// ============================================================
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-400',
    warning: 'bg-amber-500 hover:bg-amber-400',
    primary: 'bg-cyan-500 hover:bg-cyan-400'
  };

  return React.createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm'
  },
    React.createElement('div', {
      className: 'bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 animate-fadeIn'
    },
      React.createElement('h3', {
        className: 'text-lg font-semibold text-white mb-2'
      }, title),
      React.createElement('p', {
        className: 'text-sm text-slate-400 mb-6'
      }, message),
      React.createElement('div', {
        className: 'flex justify-end gap-3'
      },
        React.createElement('button', {
          onClick: onClose,
          className: 'px-4 py-2 text-slate-400 hover:text-white transition-colors'
        }, cancelText),
        React.createElement('button', {
          onClick: () => { onConfirm(); onClose(); },
          className: `px-4 py-2 ${variantStyles[variant]} text-white font-medium rounded-lg transition-colors`
        }, confirmText)
      )
    )
  );
};

// ============================================================
// EXPORT FOR USE IN MODULES
// ============================================================
window.MissionPulseUtils = {
  // Components
  ErrorBoundary,
  ErrorFallback,
  LoadingSpinner,
  LoadingOverlay,
  SkeletonLoader,
  ToastProvider,
  Toast,
  GlobalFooter,
  ConnectionStatus,
  EmptyState,
  ConfirmDialog,
  
  // Hooks
  useAPI,
  useLocalStorage,
  useToast,
  
  // Services
  apiService,
  APIError,
  API_CONFIG,
  
  // Utilities
  RBACUtils
};

console.log('MissionPulse Production Utils loaded successfully');
