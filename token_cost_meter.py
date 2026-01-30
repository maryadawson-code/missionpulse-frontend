"""
================================================================================
TOKEN COST METER - ADMIN DASHBOARD WIDGET
================================================================================
Add this code to app_v2.py to implement the Token Cost Meter per Phase 7 spec.

INTEGRATION INSTRUCTIONS:
1. Add the compute_token_costs function after the get_playbook_manager function
2. Add the Token Cost Meter section to render_playbook_manager() after the stats row
3. Update the CSS in configure_page() to include the cost meter styles

Author: Mission Meets Tech (MMT)
Version: 2.0.0
================================================================================
"""

# =============================================================================
# ADD THIS FUNCTION AFTER get_playbook_manager() around line 1050
# =============================================================================

def compute_token_costs(playbook_manager) -> dict:
    """
    Calculate estimated token costs for the Playbook Learning Engine.
    
    Pricing based on Anthropic Claude Sonnet (approximate):
    - Input: $0.003 per 1K tokens
    - Output: $0.015 per 1K tokens
    
    Args:
        playbook_manager: PlaybookManager instance
        
    Returns:
        Dictionary with cost metrics
    """
    # Anthropic Claude pricing (approximate, as of Jan 2025)
    INPUT_COST_PER_1K = 0.003   # $0.003 per 1K input tokens
    OUTPUT_COST_PER_1K = 0.015  # $0.015 per 1K output tokens
    CHARS_PER_TOKEN = 4         # Rough approximation
    
    entries = playbook_manager.get_all_entries()
    stats = playbook_manager.get_stats()
    
    if not entries:
        return {
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "avg_injection_tokens": 0,
            "estimated_cost_per_injection": 0.0,
            "total_injection_cost": 0.0,
            "playbook_storage_tokens": 0,
            "tier": "Free Tier",
            "tier_color": "#10B981",
            "budget_used_percent": 0,
            "monthly_projection": 0.0,
            "entry_count": 0
        }
    
    # Calculate storage tokens (full playbook size)
    import json
    playbook_json = json.dumps([{
        "category": e.get("category", ""),
        "title": e.get("title", ""),
        "content": e.get("content", ""),
        "tags": e.get("tags", [])
    } for e in entries])
    playbook_storage_tokens = len(playbook_json) // CHARS_PER_TOKEN
    
    # Calculate per-injection cost (top 3 entries injected)
    top_entries = sorted(entries, key=lambda x: x.get("useCount", 0), reverse=True)[:3]
    injection_content = "\n".join([
        f"[{e.get('category', '')}] {e.get('title', '')}: {e.get('content', '')}"
        for e in top_entries
    ])
    avg_injection_tokens = len(injection_content) // CHARS_PER_TOKEN
    
    # Estimate typical conversation
    avg_user_input_tokens = 500      # User query
    avg_system_prompt_tokens = 2000  # Base system prompt
    avg_output_tokens = 1500         # Claude response
    
    # Per-request cost
    input_tokens = avg_user_input_tokens + avg_system_prompt_tokens + avg_injection_tokens
    output_tokens = avg_output_tokens
    
    cost_per_injection = (
        (input_tokens / 1000) * INPUT_COST_PER_1K +
        (output_tokens / 1000) * OUTPUT_COST_PER_1K
    )
    
    # Monthly projection (assume 100 queries/day for active user)
    daily_queries = 100
    monthly_projection = cost_per_injection * daily_queries * 30
    
    # Determine tier
    if monthly_projection < 10:
        tier = "Free Tier"
        tier_color = "#10B981"  # Green
    elif monthly_projection < 50:
        tier = "Starter"
        tier_color = "#3B82F6"  # Blue
    elif monthly_projection < 200:
        tier = "Professional"
        tier_color = "#F59E0B"  # Amber
    else:
        tier = "Enterprise"
        tier_color = "#8B5CF6"  # Purple
    
    # Budget tracking (assume $50/month budget)
    monthly_budget = 50.0
    budget_used_percent = min((monthly_projection / monthly_budget) * 100, 100)
    
    return {
        "total_input_tokens": input_tokens,
        "total_output_tokens": output_tokens,
        "avg_injection_tokens": avg_injection_tokens,
        "estimated_cost_per_injection": cost_per_injection,
        "total_injection_cost": cost_per_injection,
        "playbook_storage_tokens": playbook_storage_tokens,
        "tier": tier,
        "tier_color": tier_color,
        "budget_used_percent": budget_used_percent,
        "monthly_projection": monthly_projection,
        "entry_count": len(entries)
    }


# =============================================================================
# ADD THIS HTML TEMPLATE TO render_playbook_manager() around line 1200
# Place after the stats row and before the entries grid
# =============================================================================

TOKEN_COST_METER_HTML = """
<div class="cost-meter-container">
    <div class="cost-meter-header">
        <span class="cost-meter-title">💰 Token Cost Meter</span>
        <span class="cost-tier" style="background: {tier_color}20; color: {tier_color};">{tier}</span>
    </div>
    
    <div class="cost-stats-grid">
        <div class="cost-stat">
            <div class="cost-stat-value">{avg_injection_tokens:,}</div>
            <div class="cost-stat-label">Avg Injection Tokens</div>
        </div>
        <div class="cost-stat">
            <div class="cost-stat-value">${estimated_cost_per_injection:.4f}</div>
            <div class="cost-stat-label">Cost Per Query</div>
        </div>
        <div class="cost-stat">
            <div class="cost-stat-value">${monthly_projection:.2f}</div>
            <div class="cost-stat-label">Monthly Projection</div>
        </div>
        <div class="cost-stat">
            <div class="cost-stat-value">{playbook_storage_tokens:,}</div>
            <div class="cost-stat-label">Storage Tokens</div>
        </div>
    </div>
    
    <div class="budget-bar-container">
        <div class="budget-bar-label">
            <span>Budget Usage</span>
            <span>{budget_used_percent:.1f}%</span>
        </div>
        <div class="budget-bar-track">
            <div class="budget-bar-fill" style="width: {budget_used_percent}%; background: {tier_color};"></div>
        </div>
    </div>
</div>
"""


# =============================================================================
# ADD THESE CSS STYLES TO configure_page() in the st.markdown section
# =============================================================================

TOKEN_COST_METER_CSS = """
/* Token Cost Meter Styles */
.cost-meter-container {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid #00E5FA30;
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0;
}

.cost-meter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.cost-meter-title {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
}

.cost-tier {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.cost-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.cost-stat {
    text-align: center;
    padding: 12px;
    background: rgba(0, 229, 250, 0.05);
    border-radius: 12px;
}

.cost-stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #00E5FA;
    margin-bottom: 4px;
}

.cost-stat-label {
    font-size: 11px;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.budget-bar-container {
    margin-top: 16px;
}

.budget-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #94A3B8;
    margin-bottom: 8px;
}

.budget-bar-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.budget-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

@media (max-width: 768px) {
    .cost-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
"""


# =============================================================================
# USAGE EXAMPLE - Add to render_playbook_manager()
# =============================================================================

def render_token_cost_meter(playbook_manager):
    """
    Render the token cost meter widget.
    
    Example usage in render_playbook_manager():
    
        # After stats row
        cost_metrics = compute_token_costs(playbook_manager)
        st.markdown(
            TOKEN_COST_METER_HTML.format(**cost_metrics),
            unsafe_allow_html=True
        )
    """
    import streamlit as st
    
    cost_metrics = compute_token_costs(playbook_manager)
    st.markdown(
        TOKEN_COST_METER_HTML.format(**cost_metrics),
        unsafe_allow_html=True
    )


# =============================================================================
# STANDALONE TEST
# =============================================================================

if __name__ == "__main__":
    # Test with mock data
    class MockPlaybookManager:
        def get_all_entries(self):
            return [
                {"category": "Technical", "title": "AWS Architecture", "content": "Sample content " * 50, "tags": ["aws"], "useCount": 10},
                {"category": "Past Performance", "title": "VA Contract", "content": "Sample content " * 30, "tags": ["va"], "useCount": 8},
                {"category": "Discriminator", "title": "FedRAMP High", "content": "Sample content " * 40, "tags": ["security"], "useCount": 15},
            ]
        
        def get_stats(self):
            return {"total_entries": 3, "total_uses": 33}
    
    mock_pm = MockPlaybookManager()
    metrics = compute_token_costs(mock_pm)
    
    print("Token Cost Metrics:")
    print("-" * 40)
    for key, value in metrics.items():
        print(f"  {key}: {value}")
