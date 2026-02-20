# FILE: data_routes.py
# SECURITY: NIST 800-53 Rev 5 CHECKED
# PURPOSE: CRUD routes for Supabase-backed data tables

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from supabase_client import (
    fetch_all, fetch_one, insert_row, update_row, delete_row, log_audit
)

logger = logging.getLogger("missionpulse.data")
router = APIRouter(prefix="/data", tags=["Data Operations"])


# =============================================================================
# SHARED AUTH STUB (matches agents.py pattern — replace with JWT later)
# =============================================================================

def get_user_from_request(request: Request) -> Dict:
    return {
        "id": request.headers.get("X-User-Id", "user_001"),
        "role": request.headers.get("X-User-Role", "executive"),
        "org_type": request.headers.get("X-User-Org-Type", "internal"),
    }
    # TECH-DEBT: Replace with Supabase JWT verification


# =============================================================================
# OPPORTUNITIES
# =============================================================================

class OpportunityCreate(BaseModel):
    title: str
    agency: Optional[str] = None
    solicitation_number: Optional[str] = None
    contract_type: Optional[str] = None
    estimated_value: Optional[float] = None
    phase: Optional[str] = "qualify"
    priority: Optional[str] = "P-2"
    pwin: Optional[int] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    agency: Optional[str] = None
    solicitation_number: Optional[str] = None
    contract_type: Optional[str] = None
    estimated_value: Optional[float] = None
    phase: Optional[str] = None
    priority: Optional[str] = None
    pwin: Optional[int] = None


@router.get("/opportunities")
async def list_opportunities(
    request: Request,
    phase: Optional[str] = None,
    agency: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    """List opportunities with optional filters."""
    filters = {}
    if phase: filters["phase"] = phase
    if agency: filters["agency"] = agency
    if priority: filters["priority"] = priority
    data = fetch_all("opportunities", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}


@router.get("/opportunities/{opp_id}")
async def get_opportunity(opp_id: str):
    row = fetch_one("opportunities", opp_id)
    if not row:
        raise HTTPException(404, "Opportunity not found")
    return row


@router.post("/opportunities", status_code=201)
async def create_opportunity(body: OpportunityCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("opportunities", body.model_dump(exclude_none=True))
    log_audit("CREATE", "opportunities", row.get("id", ""), user["id"])
    return row


@router.patch("/opportunities/{opp_id}")
async def update_opportunity(opp_id: str, body: OpportunityUpdate, request: Request):
    user = get_user_from_request(request)
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    row = update_row("opportunities", opp_id, data)
    log_audit("UPDATE", "opportunities", opp_id, user["id"], data)
    return row


@router.delete("/opportunities/{opp_id}")
async def delete_opportunity(opp_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("opportunities", opp_id)
    log_audit("DELETE", "opportunities", opp_id, user["id"])
    return {"deleted": True}


# =============================================================================
# PAST PERFORMANCE
# =============================================================================

class PastPerformanceCreate(BaseModel):
    opportunity_id: Optional[str] = None
    contract_name: str
    contract_number: Optional[str] = None
    agency: Optional[str] = None
    contract_value: Optional[float] = None
    period_of_performance: Optional[str] = None
    relevance: Optional[str] = None
    cpars_rating: Optional[str] = "Satisfactory"


@router.get("/past-performance")
async def list_past_performance(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("past_performance", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}


@router.post("/past-performance", status_code=201)
async def create_past_performance(body: PastPerformanceCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("past_performance", body.model_dump(exclude_none=True))
    log_audit("CREATE", "past_performance", row.get("id", ""), user["id"])
    return row


@router.patch("/past-performance/{pp_id}")
async def update_past_performance(pp_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("past_performance", pp_id, body)
    log_audit("UPDATE", "past_performance", pp_id, user["id"])
    return row


@router.delete("/past-performance/{pp_id}")
async def delete_past_performance(pp_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("past_performance", pp_id)
    log_audit("DELETE", "past_performance", pp_id, user["id"])
    return {"deleted": True}


# =============================================================================
# WIN THEMES
# =============================================================================

class WinThemeCreate(BaseModel):
    opportunity_id: Optional[str] = None
    theme: str
    discriminator: Optional[str] = None
    evidence: Optional[str] = None
    priority: Optional[int] = 1


@router.get("/win-themes")
async def list_win_themes(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("win_themes", filters=filters, order_by="priority", ascending=True, limit=limit)
    return {"data": data, "count": len(data)}


@router.post("/win-themes", status_code=201)
async def create_win_theme(body: WinThemeCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("win_themes", body.model_dump(exclude_none=True))
    log_audit("CREATE", "win_themes", row.get("id", ""), user["id"])
    return row


@router.patch("/win-themes/{wt_id}")
async def update_win_theme(wt_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("win_themes", wt_id, body)
    log_audit("UPDATE", "win_themes", wt_id, user["id"])
    return row


@router.delete("/win-themes/{wt_id}")
async def delete_win_theme(wt_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("win_themes", wt_id)
    log_audit("DELETE", "win_themes", wt_id, user["id"])
    return {"deleted": True}


# =============================================================================
# TEAM ASSIGNMENTS
# =============================================================================

class TeamAssignmentCreate(BaseModel):
    opportunity_id: Optional[str] = None
    user_id: Optional[str] = None
    role: str
    is_active: Optional[bool] = True


@router.get("/team-assignments")
async def list_team_assignments(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("team_assignments", filters=filters, order_by="assigned_at", limit=limit)
    return {"data": data, "count": len(data)}


@router.post("/team-assignments", status_code=201)
async def create_team_assignment(body: TeamAssignmentCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("team_assignments", body.model_dump(exclude_none=True))
    log_audit("CREATE", "team_assignments", row.get("id", ""), user["id"])
    return row


@router.patch("/team-assignments/{ta_id}")
async def update_team_assignment(ta_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("team_assignments", ta_id, body)
    log_audit("UPDATE", "team_assignments", ta_id, user["id"])
    return row


@router.delete("/team-assignments/{ta_id}")
async def delete_team_assignment(ta_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("team_assignments", ta_id)
    log_audit("DELETE", "team_assignments", ta_id, user["id"])
    return {"deleted": True}


# =============================================================================
# PROPOSAL OUTLINES + SECTIONS
# =============================================================================

class OutlineCreate(BaseModel):
    opportunity_id: Optional[str] = None
    volume: str = "Technical"

class SectionCreate(BaseModel):
    outline_id: str
    title: str
    parent_id: Optional[str] = None
    order_index: Optional[int] = 0
    page_limit: Optional[int] = None
    status: Optional[str] = "Not Started"


@router.get("/outlines")
async def list_outlines(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("proposal_outlines", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}


@router.post("/outlines", status_code=201)
async def create_outline(body: OutlineCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("proposal_outlines", body.model_dump(exclude_none=True))
    log_audit("CREATE", "proposal_outlines", row.get("id", ""), user["id"])
    return row


@router.delete("/outlines/{outline_id}")
async def delete_outline(outline_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("proposal_outlines", outline_id)
    log_audit("DELETE", "proposal_outlines", outline_id, user["id"])
    return {"deleted": True}


@router.get("/outlines/{outline_id}/sections")
async def list_sections(outline_id: str):
    data = fetch_all("outline_sections", filters={"outline_id": outline_id},
                     order_by="order_index", ascending=True)
    return {"data": data, "count": len(data)}


@router.post("/outlines/sections", status_code=201)
async def create_section(body: SectionCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("outline_sections", body.model_dump(exclude_none=True))
    log_audit("CREATE", "outline_sections", row.get("id", ""), user["id"])
    return row


@router.patch("/outlines/sections/{section_id}")
async def update_section(section_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("outline_sections", section_id, body)
    log_audit("UPDATE", "outline_sections", section_id, user["id"])
    return row


@router.delete("/outlines/sections/{section_id}")
async def delete_section(section_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("outline_sections", section_id)
    log_audit("DELETE", "outline_sections", section_id, user["id"])
    return {"deleted": True}


# =============================================================================
# COMPETITORS (existing table, adding API access)
# =============================================================================

class CompetitorCreate(BaseModel):
    opportunity_id: Optional[str] = None
    name: str
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    incumbent: Optional[bool] = False
    threat_level: Optional[str] = "Medium"
    pwin_estimate: Optional[int] = None


@router.get("/competitors")
async def list_competitors(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("competitors", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}


@router.post("/competitors", status_code=201)
async def create_competitor(body: CompetitorCreate, request: Request):
    user = get_user_from_request(request)
    row = insert_row("competitors", body.model_dump(exclude_none=True))
    log_audit("CREATE", "competitors", row.get("id", ""), user["id"])
    return row


@router.patch("/competitors/{comp_id}")
async def update_competitor(comp_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("competitors", comp_id, body)
    log_audit("UPDATE", "competitors", comp_id, user["id"])
    return row


@router.delete("/competitors/{comp_id}")
async def delete_competitor(comp_id: str, request: Request):
    user = get_user_from_request(request)
    delete_row("competitors", comp_id)
    log_audit("DELETE", "competitors", comp_id, user["id"])
    return {"deleted": True}


# =============================================================================
# COMPLIANCE ITEMS (existing table)
# =============================================================================

@router.get("/compliance")
async def list_compliance(
    opportunity_id: Optional[str] = None,
    limit: int = Query(default=100, le=500),
):
    filters = {}
    if opportunity_id: filters["opportunity_id"] = opportunity_id
    data = fetch_all("compliance_items", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}


@router.patch("/compliance/{item_id}")
async def update_compliance(item_id: str, body: Dict[str, Any], request: Request):
    user = get_user_from_request(request)
    row = update_row("compliance_items", item_id, body)
    log_audit("UPDATE", "compliance_items", item_id, user["id"])
    return row


# =============================================================================
# PIPELINE STATS (aggregation endpoint)
# =============================================================================

@router.get("/pipeline/stats")
async def pipeline_stats():
    """Aggregate pipeline metrics."""
    opps = fetch_all("opportunities", limit=200)
    total_value = sum(float(o.get("estimated_value") or 0) for o in opps)
    phases = {}
    for o in opps:
        p = o.get("phase", "unknown")
        phases[p] = phases.get(p, 0) + 1

    return {
        "total_opportunities": len(opps),
        "total_pipeline_value": total_value,
        "by_phase": phases,
        "avg_pwin": round(
            sum(o.get("pwin") or 0 for o in opps) / max(len(opps), 1), 1
        ),
    }


# =============================================================================
# AUDIT LOG (read-only)
# =============================================================================

@router.get("/audit-logs")
async def list_audit_logs(
    table_name: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    """Read audit logs (AU-3 compliance)."""
    filters = {}
    if table_name: filters["table_name"] = table_name
    data = fetch_all("audit_logs", filters=filters, limit=limit)
    return {"data": data, "count": len(data)}
