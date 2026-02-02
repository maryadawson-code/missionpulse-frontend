# MissionPulse CRUD Module Integration Guide

## Quick Start

Add these scripts to any module page:

```html
<!-- Supabase SDK -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>

<!-- MissionPulse CRUD Module -->
<script src="missionpulse-crud.js"></script>
```

## Usage Examples

### Fetch All Opportunities
```javascript
const { data, error, isDemo } = await MissionPulse.opportunities.getAll();
if (data) {
    console.log('Opportunities:', data);
    console.log('Using demo data:', isDemo);
}
```

### Fetch with Options
```javascript
const { data } = await MissionPulse.opportunities.getAll({
    orderBy: 'due_date',
    ascending: true,
    filter: { status: 'active' },
    limit: 10
});
```

### Fetch by ID
```javascript
const { data } = await MissionPulse.opportunities.getById('opp-001');
```

### Fetch Related Data
```javascript
const { data } = await MissionPulse.competitors.getByForeignKey('opportunity_id', 'opp-001');
```

### Create Record
```javascript
const { data, error } = await MissionPulse.opportunities.create({
    title: 'New Opportunity',
    agency: 'DHA',
    estimatedValue: 5000000,
    pwin: 50,
    phase: 'gate_1',
    status: 'active',
    dueDate: '2026-06-01'
});
```

### Update Record
```javascript
const { data } = await MissionPulse.opportunities.update('opp-001', {
    pwin: 75,
    phase: 'pink_team'
});
```

### Delete Record
```javascript
const { data } = await MissionPulse.opportunities.delete('opp-001');
```

## Available Tables

| Object | Table | Demo Key |
|--------|-------|----------|
| `MissionPulse.opportunities` | opportunities | ✓ |
| `MissionPulse.competitors` | competitors | ✓ |
| `MissionPulse.teamingPartners` | teaming_partners | ✓ |
| `MissionPulse.teamAssignments` | team_assignments | ✓ |
| `MissionPulse.users` | users | ✓ |
| `MissionPulse.pricingItems` | pricing_items | ✓ |
| `MissionPulse.complianceItems` | compliance_items | ✓ |
| `MissionPulse.rfpRequirements` | rfp_requirements | ✓ |
| `MissionPulse.proposalSections` | proposal_sections | ✓ |
| `MissionPulse.auditLogs` | audit_logs | ✓ |
| `MissionPulse.lcatRates` | lcat_rates | ✓ |
| `MissionPulse.playbookItems` | playbook_items | ✓ |
| `MissionPulse.oralsPresentations` | orals_presentations | ✓ |
| `MissionPulse.launchChecklist` | launch_checklist | ✓ |

## Specialized Queries

### Pipeline Statistics
```javascript
const { data: stats } = await MissionPulse.getPipelineStats();
console.log(stats.totalValue, stats.avgPwin, stats.dueThisMonth);
```

### Opportunities by Phase (Swimlane)
```javascript
const { data: grouped } = await MissionPulse.getOpportunitiesByPhase();
console.log(grouped.pink_team.items); // Array of pink team opps
```

### Full Opportunity Details
```javascript
const { data } = await MissionPulse.getOpportunityWithDetails('opp-001');
console.log(data.opportunity, data.competitors, data.partners);
```

## Connection Status

### Check Connection
```javascript
const status = MissionPulse.getConnectionStatus();
// 'connected' | 'demo' | 'disconnected'
```

### Subscribe to Changes
```javascript
const unsubscribe = MissionPulse.onConnectionChange(status => {
    console.log('Connection:', status);
});
// Later: unsubscribe();
```

## Real-Time Subscriptions

```javascript
const unsubscribe = MissionPulse.subscribeToTable('opportunities', event => {
    console.log(event.eventType); // 'INSERT' | 'UPDATE' | 'DELETE'
    console.log(event.new);       // New record (mapped to camelCase)
    console.log(event.old);       // Old record
});
```

## Utility Functions

```javascript
MissionPulse.formatCurrency(45000000)      // "$45.0M"
MissionPulse.formatPhaseName('pink_team')  // "Pink Team"
MissionPulse.getPhaseColor('pink_team')    // "#f472b6"
```

## React Hook Pattern

```jsx
function OpportunityList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        async function load() {
            const result = await MissionPulse.opportunities.getAll();
            setData(result.data || []);
            setIsDemo(result.isDemo);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div>Loading...</div>;
    
    return (
        <div>
            {isDemo && <span className="badge">Demo Mode</span>}
            {data.map(opp => <div key={opp.id}>{opp.title}</div>)}
        </div>
    );
}
```

## Demo Fallback

The module automatically falls back to demo data when:
- Supabase SDK not loaded
- Network connection fails
- API returns error

Set `USE_DEMO_FALLBACK = false` in the module to disable.

## Field Mapping

All records are automatically mapped:
- **Database → Frontend**: `snake_case` → `camelCase`
- **Frontend → Database**: `camelCase` → `snake_case`

Example:
```javascript
// Database: { estimated_value: 5000000, due_date: '2026-03-15' }
// Frontend: { estimatedValue: 5000000, dueDate: '2026-03-15' }
```

---

© 2025 Mission Meets Tech. All rights reserved.
