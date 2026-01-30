# MissionPulse Core Library Integration Guide

## Quick Start

Add this line to any module's `<head>` section:

```html
<script src="missionpulse-core.js"></script>
```

---

## API Reference

### 1. API Client

```javascript
// GET request
const result = await MP.get('/api/agents/capture/status');
if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// POST request (for AI chat)
const response = await MP.post('/api/agents/capture/chat', {
  message: 'What opportunities should we pursue?',
  context: { opportunityId: 'opp-123' }
});

// Streaming response (for real-time AI output)
await MP.stream('/api/agents/writer/chat', 
  { message: 'Write an executive summary' },
  (chunk, fullText) => {
    document.getElementById('output').textContent = fullText;
  }
);
```

### 2. Toast Notifications

```javascript
// Success
MP.success('Changes saved successfully');

// Error
MP.error('Failed to connect to server');

// Warning
MP.warning('Your session will expire in 5 minutes');

// Info
MP.info('New updates available');

// Custom duration (milliseconds)
MP.success('Saved!', 2000);
```

### 3. Loading States

```javascript
// Manual control
MP.Loading.setLoading('fetchData', true);
// ... do work ...
MP.Loading.setLoading('fetchData', false);

// Check state
if (MP.Loading.isLoading('fetchData')) {
  // Show spinner
}

// Auto-wrap async function
const data = await MP.Loading.withLoading('fetchData', async () => {
  return await MP.get('/api/data');
});

// Subscribe to changes (React-friendly)
const unsubscribe = MP.Loading.subscribe('fetchData', (isLoading) => {
  setLoading(isLoading);
});
```

### 4. Connection Monitoring

```javascript
// Check current state
const state = MP.Connection.getState();
console.log(state.isOnline);      // Browser online?
console.log(state.isApiHealthy);  // API responding?
console.log(state.isFullyConnected); // Both true?

// Subscribe to changes
MP.Connection.subscribe((state) => {
  if (!state.isFullyConnected) {
    // Show offline banner
  }
});

// Manual health check
await MP.Connection.checkApiHealth();
```

### 5. RBAC (Role-Based Access Control)

```javascript
// Set current user's role
MP.RBAC.setRole('CAP');

// Check permissions
if (MP.RBAC.hasRole('PM')) {
  // User is PM or higher
}

// Check module access
if (MP.RBAC.canAccessModule('M7-blackhat')) {
  // Show Black Hat module
}

// Get role badge HTML
const badge = MP.RBAC.getRoleBadge('CAP');
// Returns styled <span> element
```

### 6. UI Components

```javascript
// Skeleton loaders (returns HTML string)
const skeletonHTML = MP.Components.skeleton('text');      // Text line
const skeletonHTML = MP.Components.skeleton('title');     // Title
const skeletonHTML = MP.Components.skeleton('avatar');    // Circle
const skeletonHTML = MP.Components.skeleton('card');      // Card shape

// Error fallback (returns HTML string)
const errorHTML = MP.Components.errorFallback(
  new Error('Something broke'), 
  'location.reload()'
);

// Empty state (returns HTML string)
const emptyHTML = MP.Components.emptyState(
  'No opportunities found',
  'Add your first opportunity to get started',
  'Add Opportunity',
  'openAddModal()'
);
```

---

## React Integration Example

```jsx
const MyModule = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to loading state
    const unsubscribe = MP.Loading.subscribe('myData', setLoading);
    
    // Fetch data
    const fetchData = async () => {
      const result = await MP.Loading.withLoading('myData', () => 
        MP.get('/api/my-endpoint')
      );
      
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    };
    
    fetchData();
    return unsubscribe;
  }, []);

  // Show loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mp-skeleton mp-skeleton-title" />
        <div className="mp-skeleton mp-skeleton-text" />
        <div className="mp-skeleton mp-skeleton-text" style={{width: '80%'}} />
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div dangerouslySetInnerHTML={{
        __html: MP.Components.errorFallback(error)
      }} />
    );
  }

  // Show data
  return <div>{/* render data */}</div>;
};
```

---

## Module Update Checklist

When updating a module to use the core library:

- [ ] Add `<script src="missionpulse-core.js"></script>` to `<head>`
- [ ] Replace raw `fetch()` calls with `MP.get()` / `MP.post()`
- [ ] Replace custom toast implementations with `MP.success()` etc.
- [ ] Add RBAC check: `MP.RBAC.setRole(userRole)` at startup
- [ ] Use `MP.Loading.withLoading()` for async operations
- [ ] Add skeleton classes for loading states
- [ ] Test connection banner by going offline

---

## File Locations

After deployment:
- Core library: `missionpulse-core.js` (in frontend root)
- Modules reference: `<script src="missionpulse-core.js"></script>`

---

*AI GENERATED - REQUIRES HUMAN REVIEW*
