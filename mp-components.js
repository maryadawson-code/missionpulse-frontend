/**
 * MissionPulse Component Library
 * Reusable React components following Shield & Pulse UX v8.0
 * 
 * Usage:
 *   <script src="mp-components.js"></script>
 *   
 *   Then in your React code:
 *   const { Button, Card, Badge, Modal } = window.MPComponents;
 */

(function(React) {
  'use strict';

  const { useState, useEffect, useRef, createContext, useContext } = React;

  // ============================================================
  // DESIGN TOKENS
  // ============================================================
  const COLORS = {
    primaryCyan: '#00E5FA',
    deepNavy: '#00050F',
    successTeal: '#00BDAE',
    warningAmber: '#F59E0B',
    errorRed: '#EF4444',
    glass: 'rgba(15, 23, 42, 0.7)',
    glassBorder: 'rgba(0, 229, 250, 0.12)'
  };

  const SHIPLEY_PHASES = {
    capture: { color: '#8b5cf6', label: 'Capture' },
    qualify: { color: '#3b82f6', label: 'Qualify' },
    proposal: { color: '#00E5FA', label: 'Proposal' },
    review: { color: '#f59e0b', label: 'Review' },
    submit: { color: '#10b981', label: 'Submit' },
    award: { color: '#ec4899', label: 'Award' }
  };

  const PRIORITIES = {
    low: { color: '#10b981', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high: { color: '#ef4444', label: 'High' },
    critical: { color: '#dc2626', label: 'Critical' }
  };

  // ============================================================
  // ICONS
  // ============================================================
  const Icons = {
    check: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })),
    x: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })),
    loader: (props) => React.createElement('svg', { fill: 'none', viewBox: '0 0 24 24', className: `animate-spin ${props.className || ''}`, ...props },
      React.createElement('circle', { className: 'opacity-25', cx: 12, cy: 12, r: 10, stroke: 'currentColor', strokeWidth: 4 }),
      React.createElement('path', { className: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' })),
    chevronDown: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M19 9l-7 7-7-7' })),
    search: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })),
    bell: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })),
    shield: (props) => React.createElement('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props },
      React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })),
  };

  // ============================================================
  // BUTTON COMPONENT
  // ============================================================
  function Button({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    iconRight,
    disabled = false, 
    loading = false, 
    fullWidth = false,
    className = '',
    type = 'button',
    ...props 
  }) {
    const variants = {
      primary: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20',
      secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600',
      ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
      danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30',
      success: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const iconSizes = { xs: 'w-3 h-3', sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };

    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all
      ${variants[variant]} ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `;

    const renderIcon = (iconName, position) => {
      if (loading && position === 'left') {
        return React.createElement(Icons.loader, { className: iconSizes[size] });
      }
      if (iconName && Icons[iconName]) {
        return React.createElement(Icons[iconName], { className: iconSizes[size] });
      }
      return null;
    };

    return React.createElement('button', {
      type,
      onClick,
      disabled: disabled || loading,
      className: baseClasses.trim().replace(/\s+/g, ' '),
      ...props
    },
      renderIcon(icon, 'left'),
      children,
      renderIcon(iconRight, 'right')
    );
  }

  // ============================================================
  // CARD COMPONENT
  // ============================================================
  function Card({ 
    children, 
    title, 
    subtitle,
    icon,
    actions,
    padding = 'md',
    hover = false,
    onClick,
    className = '',
    ...props 
  }) {
    const paddings = { none: 'p-0', sm: 'p-3', md: 'p-5', lg: 'p-6' };
    
    const baseClasses = `
      bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl
      ${paddings[padding]}
      ${hover ? 'hover:border-cyan-500/30 hover:bg-slate-800/70 transition-all cursor-pointer' : ''}
      ${className}
    `;

    const header = (title || actions) ? React.createElement('div', { className: 'flex items-center justify-between mb-4' },
      title && React.createElement('div', { className: 'flex items-center gap-2' },
        icon && React.createElement('span', { className: 'text-cyan-400' }, 
          Icons[icon] ? React.createElement(Icons[icon], { className: 'w-5 h-5' }) : null
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: 'font-semibold text-white' }, title),
          subtitle && React.createElement('p', { className: 'text-xs text-slate-400' }, subtitle)
        )
      ),
      actions && React.createElement('div', { className: 'flex items-center gap-2' }, actions)
    ) : null;

    return React.createElement('div', {
      className: baseClasses.trim().replace(/\s+/g, ' '),
      onClick,
      ...props
    }, header, children);
  }

  // ============================================================
  // BADGE COMPONENT
  // ============================================================
  function Badge({ 
    children, 
    variant = 'default',
    color,
    size = 'md',
    dot = false,
    className = '' 
  }) {
    const variants = {
      default: { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600' },
      primary: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      success: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      danger: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
    };

    const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };

    // Custom color support
    const style = color ? {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}40`
    } : {};

    const v = variants[variant] || variants.default;
    
    const baseClasses = color 
      ? `inline-flex items-center gap-1.5 rounded-full font-medium border ${sizes[size]} ${className}`
      : `inline-flex items-center gap-1.5 rounded-full font-medium border ${v.bg} ${v.text} ${v.border} ${sizes[size]} ${className}`;

    return React.createElement('span', { className: baseClasses, style },
      dot && React.createElement('span', { 
        className: 'w-1.5 h-1.5 rounded-full',
        style: color ? { backgroundColor: color } : { backgroundColor: 'currentColor' }
      }),
      children
    );
  }

  // ============================================================
  // PHASE BADGE (Shipley specific)
  // ============================================================
  function PhaseBadge({ phase, size = 'md' }) {
    const config = SHIPLEY_PHASES[phase] || { color: '#64748b', label: phase };
    return React.createElement(Badge, { color: config.color, size }, config.label);
  }

  // ============================================================
  // PRIORITY BADGE
  // ============================================================
  function PriorityBadge({ priority, size = 'md' }) {
    const config = PRIORITIES[priority] || { color: '#64748b', label: priority };
    return React.createElement(Badge, { color: config.color, size, dot: true }, config.label);
  }

  // ============================================================
  // AVATAR COMPONENT
  // ============================================================
  function Avatar({ name, src, size = 'md', className = '' }) {
    const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    
    if (src) {
      return React.createElement('img', {
        src,
        alt: name,
        className: `${sizes[size]} rounded-full object-cover ${className}`
      });
    }

    return React.createElement('div', {
      className: `${sizes[size]} rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold ${className}`
    }, initials);
  }

  // ============================================================
  // PROGRESS BAR COMPONENT
  // ============================================================
  function ProgressBar({ value = 0, max = 100, size = 'md', showLabel = false, color, className = '' }) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
    
    const getColor = () => {
      if (color) return color;
      if (percent >= 80) return '#10b981';
      if (percent >= 50) return '#00E5FA';
      if (percent >= 25) return '#f59e0b';
      return '#ef4444';
    };

    return React.createElement('div', { className: `${className}` },
      showLabel && React.createElement('div', { className: 'flex justify-between text-xs text-slate-400 mb-1' },
        React.createElement('span', null, `${Math.round(percent)}%`),
        React.createElement('span', null, `${value}/${max}`)
      ),
      React.createElement('div', { className: `${sizes[size]} bg-slate-700 rounded-full overflow-hidden` },
        React.createElement('div', {
          className: 'h-full rounded-full transition-all duration-500',
          style: { width: `${percent}%`, backgroundColor: getColor() }
        })
      )
    );
  }

  // ============================================================
  // MODAL COMPONENT
  // ============================================================
  function Modal({ isOpen, onClose, title, children, footer, size = 'md', className = '' }) {
    const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-4xl' };

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return React.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4',
      onClick: (e) => { if (e.target === e.currentTarget) onClose?.(); }
    },
      // Backdrop
      React.createElement('div', { className: 'absolute inset-0 bg-black/60 backdrop-blur-sm' }),
      // Modal
      React.createElement('div', {
        className: `relative w-full ${sizes[size]} bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-fadeIn ${className}`
      },
        // Header
        title && React.createElement('div', { className: 'flex items-center justify-between p-5 border-b border-slate-700' },
          React.createElement('h2', { className: 'text-lg font-bold text-white' }, title),
          React.createElement('button', {
            onClick: onClose,
            className: 'text-slate-400 hover:text-white transition-colors'
          }, React.createElement(Icons.x, { className: 'w-5 h-5' }))
        ),
        // Content
        React.createElement('div', { className: 'p-5' }, children),
        // Footer
        footer && React.createElement('div', { className: 'flex justify-end gap-3 p-5 border-t border-slate-700' }, footer)
      )
    );
  }

  // ============================================================
  // INPUT COMPONENT
  // ============================================================
  function Input({ 
    type = 'text',
    label,
    hint,
    error,
    icon,
    value,
    onChange,
    placeholder,
    disabled = false,
    className = '',
    ...props 
  }) {
    const inputClasses = `
      w-full px-4 py-2.5 bg-slate-800/50 border rounded-lg text-white placeholder:text-slate-500
      focus:outline-none focus:ring-2 focus:ring-cyan-500/30
      transition-all
      ${error ? 'border-red-500' : 'border-slate-700 focus:border-cyan-500'}
      ${icon ? 'pl-10' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `;

    return React.createElement('div', null,
      label && React.createElement('label', { className: 'block text-sm font-medium text-slate-300 mb-1.5' }, label),
      React.createElement('div', { className: 'relative' },
        icon && React.createElement('div', { className: 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' },
          Icons[icon] ? React.createElement(Icons[icon], { className: 'w-4 h-4' }) : null
        ),
        React.createElement('input', {
          type,
          value,
          onChange,
          placeholder,
          disabled,
          className: inputClasses.trim().replace(/\s+/g, ' '),
          ...props
        })
      ),
      hint && !error && React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, hint),
      error && React.createElement('p', { className: 'text-xs text-red-400 mt-1' }, error)
    );
  }

  // ============================================================
  // TOAST COMPONENT
  // ============================================================
  const ToastContext = createContext(null);

  function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 4000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    };

    const toast = {
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      warning: (msg) => addToast(msg, 'warning'),
      info: (msg) => addToast(msg, 'info')
    };

    return React.createElement(ToastContext.Provider, { value: toast },
      children,
      React.createElement('div', { className: 'fixed top-4 right-4 z-50 space-y-2' },
        toasts.map(t => React.createElement(Toast, { key: t.id, ...t }))
      )
    );
  }

  function Toast({ message, type }) {
    const types = {
      success: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'check' },
      error: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: 'x' },
      warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'bell' },
      info: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'bell' }
    };

    const t = types[type] || types.info;

    return React.createElement('div', {
      className: `px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slideIn ${t.bg} ${t.border} ${t.text}`
    },
      React.createElement('div', { className: 'flex items-center gap-2' },
        Icons[t.icon] && React.createElement(Icons[t.icon], { className: 'w-5 h-5' }),
        message
      )
    );
  }

  function useToast() {
    return useContext(ToastContext);
  }

  // ============================================================
  // SKELETON LOADER
  // ============================================================
  function Skeleton({ width, height, rounded = 'md', className = '' }) {
    const roundedClasses = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' };
    return React.createElement('div', {
      className: `bg-slate-700/50 animate-pulse ${roundedClasses[rounded]} ${className}`,
      style: { width, height }
    });
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================
  function EmptyState({ icon = 'shield', title, description, action, className = '' }) {
    return React.createElement('div', { className: `text-center py-12 ${className}` },
      React.createElement('div', { className: 'w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4' },
        Icons[icon] && React.createElement(Icons[icon], { className: 'w-8 h-8 text-slate-500' })
      ),
      React.createElement('h3', { className: 'text-lg font-semibold text-white mb-2' }, title),
      description && React.createElement('p', { className: 'text-slate-400 text-sm mb-6 max-w-sm mx-auto' }, description),
      action
    );
  }

  // ============================================================
  // EXPORT ALL COMPONENTS
  // ============================================================
  window.MPComponents = {
    // Core
    Button,
    Card,
    Badge,
    Avatar,
    Input,
    Modal,
    ProgressBar,
    Skeleton,
    EmptyState,
    
    // GovCon Specific
    PhaseBadge,
    PriorityBadge,
    
    // Toast System
    ToastProvider,
    Toast,
    useToast,
    
    // Icons
    Icons,
    
    // Design Tokens
    COLORS,
    SHIPLEY_PHASES,
    PRIORITIES
  };

  console.log('✅ MissionPulse Components loaded');

})(React);
