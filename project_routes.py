# FILE: project_routes.py
# SECURITY: NIST 800-53 Rev 5 CHECKED — AC-3 (Access Enforcement), AU-3 (Audit Records)
# ENCRYPTION: N/A (no CUI in projects table)

"""
================================================================================
MISSIONPULSE - PROJECT ROUTES
================================================================================
API endpoint for project creation.

Endpoint:
- POST /projects — Create a new project

Patterns:
- Mirrors agents.py structure (APIRouter, inline Pydantic, stub auth)
- Writes to Supabase djuviwarqdvlbgcfuupa (canonical DB per D2/D3)
- Invisible RBAC ready (404 not 403) — but no role restriction on this endpoint yet

Author: Mission Meets Tech
Version: 1.0.0
Ticket: PROJ-001
================================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from supabase_client import get_supabase_client

logger = logging.getLogger("missionpulse.projects")

router = APIRouter(prefix="/projects", tags=["Projects"])


# =============================================================================
# MODELS (inline — matches agents.py pattern)
# =============================================================================

class ProjectCreate(BaseModel):
    """Request body for creating a project."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=80,
        description="Project name (required, max 80 characters)"
    )
    description: Optional[str] = Field(
        None,
        description="Optional project description"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "DHA EHR Modernization Proposal",
                "description": "Technical approach for electronic health records modernization"
            }
        }


class ProjectResponse(BaseModel):
    """Response body for created project."""
    id: str
    name: str
    description: Optional[str]
    created_by: str
    created_at: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "name": "DHA EHR Modernization Proposal",
                "description": "Technical approach for electronic health records modernization",
                "created_by": "user_001",
                "created_at": "2026-02-18T14:30:00+00:00"
            }
        }


# =============================================================================
# AUTH DEPENDENCY (STUB)
# =============================================================================

# TECH-DEBT: AUTH-001 — Replace this entire function with Supabase JWT verification.
# When AUTH-001 ships:
#   1. Delete this function
#   2. Import get_current_user from auth.py
#   3. Replace all Depends(get_current_user_stub) with Depends(get_current_user)
#   4. Unskip JWT tests in test_projects.py

async def get_current_user_stub(request: Request) -> Dict[str, Any]:
    """
    Stub for user authentication dependency.
    Mirrors agents.py:310-332 exactly.
    In production, this validates JWT and returns user object.
    """
    user_role = request.headers.get("X-User-Role", "executive")
    user_id = request.headers.get("X-User-Id", "user_001")
    user_org_type = request.headers.get("X-User-Org-Type", "internal")

    return {
        "id": user_id,
        "email": f"{user_id}@example.com",
        "role": user_role,
        "org_type": user_org_type,
        "name": "Demo User",
    }


# =============================================================================
# ROUTES
# =============================================================================

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
    description="Create a new project. Auth required (currently stub — see AUTH-001).",
    responses={
        201: {"description": "Project created successfully"},
        422: {"description": "Validation error (missing name, name too long)"},
    }
)
async def create_project(
    payload: ProjectCreate,
    # TECH-DEBT: AUTH-001 — Replace get_current_user_stub with Supabase JWT verification
    user: Dict = Depends(get_current_user_stub),
) -> ProjectResponse:
    """
    Create a new project.

    - **name**: Required, 1-80 characters
    - **description**: Optional text

    Returns the created project with server-generated `id` and `created_at`.
    """
    supabase = get_supabase_client()

    # Build insert payload
    insert_data = {
        "name": payload.name,
        "created_by": user["id"],
    }
    if payload.description is not None:
        insert_data["description"] = payload.description

    # Insert into Supabase
    try:
        result = supabase.table("projects").insert(insert_data).execute()
    except Exception as e:
        logger.error(f"Supabase insert failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project. Please try again.",
        )

    if not result.data or len(result.data) == 0:
        logger.error("Supabase insert returned empty data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project. No data returned.",
        )

    row = result.data[0]

    # TECH-DEBT: AUDIT-001 — Add audit_service.log_event() call here
    # audit_service.log_event(
    #     user_id=user["id"],
    #     action="CREATE",
    #     table_name="projects",
    #     record_id=row["id"],
    #     new_values=insert_data,
    #     ip_address=request.client.host if request.client else None,
    # )

    logger.info(f"Project created: {row['id']} by {user['id']}")

    return ProjectResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row.get("description"),
        created_by=row["created_by"],
        created_at=str(row["created_at"]),
    )
