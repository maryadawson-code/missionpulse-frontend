# Integration Guide: SharePoint & HubSpot

## SharePoint Integration

### Option 1: Microsoft Graph API (Recommended)

#### Step 1: Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Configure:
   - Name: `rockITdata Pipeline Portal`
   - Supported account types: `Single tenant`
   - Redirect URI: `https://yourapp.com/auth/callback` (SPA)

#### Step 2: Configure API Permissions

Add these permissions under **API permissions**:
- `Sites.Read.All` - Read SharePoint sites
- `Files.Read.All` - Read all files
- `Files.ReadWrite.All` - If upload needed
- `User.Read` - Basic user info

Grant admin consent.

#### Step 3: Install MSAL.js

```bash
npm install @azure/msal-browser @azure/msal-react
```

#### Step 4: Configure MSAL

```javascript
// msalConfig.js
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: "https://yourapp.com/auth/callback",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["Sites.Read.All", "Files.Read.All"]
};
```

#### Step 5: Implement SharePoint Service

```javascript
// sharepointService.js
class SharePointService {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.siteId = 'rockitdata.sharepoint.com:/sites/ProposalPortal:';
  }

  async getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get site info
  async getSite() {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }

  // List document libraries
  async getLibraries() {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/drives`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }

  // Get documents in a folder
  async getDocuments(driveId, folderPath = 'root') {
    const response = await fetch(
      `${this.baseUrl}/drives/${driveId}/root:/${folderPath}:/children`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }

  // Get proposal folder documents
  async getProposalDocs(solicitation) {
    const folderPath = `Proposals/${solicitation}`;
    const site = await this.getSite();
    const drives = await this.getLibraries();
    const docsDrive = drives.value.find(d => d.name === 'Documents');
    
    if (docsDrive) {
      return this.getDocuments(docsDrive.id, folderPath);
    }
    return { value: [] };
  }

  // Get download URL for a file
  async getDownloadUrl(driveId, itemId) {
    const response = await fetch(
      `${this.baseUrl}/drives/${driveId}/items/${itemId}`,
      { headers: await this.getHeaders() }
    );
    const item = await response.json();
    return item['@microsoft.graph.downloadUrl'];
  }

  // Search documents
  async searchDocuments(query) {
    const response = await fetch(
      `${this.baseUrl}/sites/${this.siteId}/drive/root/search(q='${query}')`,
      { headers: await this.getHeaders() }
    );
    return response.json();
  }
}

export default SharePointService;
```

#### Step 6: React Hook for SharePoint

```javascript
// useSharePoint.js
import { useMsal } from "@azure/msal-react";
import { useState, useCallback } from "react";
import SharePointService from "./sharepointService";
import { loginRequest } from "./msalConfig";

export function useSharePoint() {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getService = useCallback(async () => {
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return new SharePointService(response.accessToken);
    } catch (e) {
      // Fallback to popup if silent fails
      const response = await instance.acquireTokenPopup(loginRequest);
      return new SharePointService(response.accessToken);
    }
  }, [instance, accounts]);

  const fetchDocuments = useCallback(async (folderPath) => {
    setLoading(true);
    setError(null);
    try {
      const service = await getService();
      const result = await service.getDocuments(folderPath);
      return result.value;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const fetchProposalDocs = useCallback(async (solicitation) => {
    setLoading(true);
    setError(null);
    try {
      const service = await getService();
      const result = await service.getProposalDocs(solicitation);
      return result.value;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getService]);

  return {
    fetchDocuments,
    fetchProposalDocs,
    loading,
    error,
  };
}
```

---

## HubSpot Integration

### Step 1: Create Private App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Navigate to **Settings** → **Integrations** → **Private Apps**
3. Create new app with scopes:
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.schemas.deals.read`

### Step 2: Create Custom Properties

In HubSpot, create these custom deal properties:

| Property | Type | Group |
|----------|------|-------|
| `solicitation_number` | Single-line text | Deal Information |
| `agency` | Dropdown (DHA, VA, CMS, IHS, Army) | Deal Information |
| `priority_tier` | Dropdown (P-0, P-1, P-2) | Deal Information |
| `pwin` | Number (percent) | Deal Information |
| `margin` | Number (percent) | Deal Information |
| `teaming_partners` | Multi-line text | Deal Information |
| `proposal_due_date` | Date | Deal Information |
| `expected_award_date` | Date | Deal Information |
| `gate_status` | Dropdown (GO, CONDITIONAL GO, PAUSE) | Deal Information |
| `shipley_stage` | Dropdown (Gate 1 through Active) | Deal Information |

### Step 3: Backend API Proxy

Create a Next.js API route (or Express endpoint):

```javascript
// pages/api/hubspot/deals.js (Next.js)
import axios from 'axios';

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const BASE_URL = 'https://api.hubapi.com/crm/v3';

export default async function handler(req, res) {
  const headers = {
    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'GET') {
      // Get all deals with custom properties
      const response = await axios.get(`${BASE_URL}/objects/deals`, {
        headers,
        params: {
          properties: [
            'dealname', 'amount', 'closedate', 'dealstage',
            'solicitation_number', 'agency', 'priority_tier',
            'pwin', 'margin', 'teaming_partners', 'proposal_due_date',
            'expected_award_date', 'gate_status', 'shipley_stage'
          ].join(','),
          limit: 100,
        },
      });
      res.json(response.data);
    }

    if (req.method === 'POST') {
      // Create new deal
      const response = await axios.post(`${BASE_URL}/objects/deals`, 
        { properties: req.body },
        { headers }
      );
      res.json(response.data);
    }

    if (req.method === 'PATCH') {
      // Update deal
      const { dealId, ...properties } = req.body;
      const response = await axios.patch(
        `${BASE_URL}/objects/deals/${dealId}`,
        { properties },
        { headers }
      );
      res.json(response.data);
    }
  } catch (error) {
    console.error('HubSpot API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'HubSpot API Error'
    });
  }
}
```

### Step 4: HubSpot Service

```javascript
// hubspotService.js
class HubSpotService {
  constructor(apiEndpoint = '/api/hubspot') {
    this.endpoint = apiEndpoint;
  }

  // Stage mapping: Shipley → HubSpot
  stageMap = {
    1: 'qualificationid',      // Gate 1 → Qualification
    2: 'appointmentscheduled', // Capture → Discovery
    3: 'appointmentscheduled', // Blue Team
    4: 'decisionmakerboughtin',// Kickoff
    5: 'contractsent',         // Pink Team
    6: 'contractsent',         // Red Team
    7: 'contractsent',         // Gold Team
    8: 'contractsent',         // White Glove
    9: 'closedwon',            // Submitted
    10: 'closedwon',           // Active
  };

  // Convert portal deal to HubSpot properties
  toHubSpotDeal(deal) {
    return {
      dealname: deal.name,
      amount: deal.projectedValue,
      closedate: deal.expectedAward,
      dealstage: this.stageMap[deal.stage] || 'qualificationid',
      solicitation_number: deal.solicitation,
      agency: deal.agency,
      priority_tier: deal.priorityTier,
      pwin: deal.pWin * 100, // Convert to percentage
      margin: deal.margin * 100,
      teaming_partners: deal.partnerAccess?.map(p => p.odername).join(', '),
      proposal_due_date: deal.proposalDue,
      expected_award_date: deal.expectedAward,
      gate_status: deal.gateStatus,
      shipley_stage: stages.find(s => s.id === deal.stage)?.name,
    };
  }

  // Convert HubSpot deal to portal format
  fromHubSpotDeal(hsDeal) {
    const props = hsDeal.properties;
    return {
      hubspotDealId: hsDeal.id,
      name: props.dealname,
      projectedValue: parseFloat(props.amount) || 0,
      expectedAward: props.closedate,
      solicitation: props.solicitation_number,
      agency: props.agency,
      priorityTier: props.priority_tier,
      pWin: (parseFloat(props.pwin) || 0) / 100,
      margin: (parseFloat(props.margin) || 0) / 100,
      gateStatus: props.gate_status,
    };
  }

  async getDeals() {
    const response = await fetch(`${this.endpoint}/deals`);
    const data = await response.json();
    return data.results?.map(d => this.fromHubSpotDeal(d)) || [];
  }

  async createDeal(deal) {
    const response = await fetch(`${this.endpoint}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.toHubSpotDeal(deal)),
    });
    return response.json();
  }

  async updateDeal(dealId, deal) {
    const response = await fetch(`${this.endpoint}/deals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, ...this.toHubSpotDeal(deal) }),
    });
    return response.json();
  }

  async syncDeal(deal) {
    if (deal.hubspotDealId) {
      return this.updateDeal(deal.hubspotDealId, deal);
    } else {
      return this.createDeal(deal);
    }
  }

  async syncAllDeals(deals) {
    const results = await Promise.all(
      deals.map(deal => this.syncDeal(deal))
    );
    return results;
  }
}

export default HubSpotService;
```

### Step 5: React Hook for HubSpot

```javascript
// useHubSpot.js
import { useState, useCallback } from 'react';
import HubSpotService from './hubspotService';

export function useHubSpot() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  
  const service = new HubSpotService();

  const syncDeals = useCallback(async (deals) => {
    setSyncing(true);
    setError(null);
    try {
      await service.syncAllDeals(deals);
      setLastSync(new Date().toISOString());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  const fetchHubSpotDeals = useCallback(async () => {
    try {
      return await service.getDeals();
    } catch (e) {
      setError(e.message);
      return [];
    }
  }, []);

  return {
    syncDeals,
    fetchHubSpotDeals,
    syncing,
    lastSync,
    error,
  };
}
```

### Step 6: Optional - Webhook for Real-time Sync

Set up webhook in HubSpot to receive deal updates:

```javascript
// pages/api/hubspot/webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Verify HubSpot signature (recommended for production)
  // const signature = req.headers['x-hubspot-signature'];
  
  const events = req.body;
  
  for (const event of events) {
    if (event.subscriptionType === 'deal.propertyChange') {
      // Handle deal update
      console.log('Deal updated:', event.objectId, event.propertyName, event.propertyValue);
      
      // Trigger your app to refresh data
      // await notifyPortal(event.objectId);
    }
  }

  res.status(200).json({ received: true });
}
```

---

## Environment Variables

Create `.env.local`:

```bash
# SharePoint / Azure AD
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
NEXT_PUBLIC_SHAREPOINT_SITE=rockitdata.sharepoint.com:/sites/ProposalPortal

# HubSpot
HUBSPOT_API_KEY=your-private-app-token

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

---

## Testing Checklist

### SharePoint
- [ ] Azure AD app registered
- [ ] Permissions granted and admin consent given
- [ ] MSAL.js configured with correct client ID
- [ ] Can authenticate and get token
- [ ] Can list document libraries
- [ ] Can fetch documents from specific folders
- [ ] Can generate download URLs

### HubSpot
- [ ] Private app created with correct scopes
- [ ] Custom properties created in HubSpot
- [ ] API proxy endpoint working
- [ ] Can fetch deals from HubSpot
- [ ] Can create new deals
- [ ] Can update existing deals
- [ ] Field mapping correct
- [ ] Stage mapping correct

---

## Troubleshooting

### SharePoint CORS Issues
If you get CORS errors, ensure your Azure AD app has the correct redirect URIs and that you're using the MSAL popup or redirect flow correctly.

### HubSpot Rate Limits
HubSpot has rate limits (100 requests per 10 seconds for private apps). Implement batching for bulk operations.

### Token Refresh
MSAL.js handles token refresh automatically, but ensure you're using `acquireTokenSilent` with fallback to `acquireTokenPopup`.
