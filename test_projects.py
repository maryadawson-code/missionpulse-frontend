# FILE: test_projects.py
# TICKET: PROJ-001

"""
================================================================================
MISSIONPULSE - PROJECT API TEST SUITE
================================================================================
Tests for POST /api/projects endpoint.

Covers:
- Input validation (missing name, empty name, name too long)
- Successful creation with and without description
- Auth stub behavior (documents current state)
- JWT auth (skipped until AUTH-001)

Run with: pytest test_projects.py -v

Author: Mission Meets Tech
Version: 1.0.0
Ticket: PROJ-001
================================================================================
"""

import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
import json
import sys

# Match import pattern from test_agents.py:29
# NOTE: If import fails, verify your PYTHONPATH includes the repo root.
try:
    from app.api.main import app
except ImportError:
    try:
        from main import app
    except ImportError:
        # Flat-file fallback: create a minimal app for testing
        from main import create_app
        app = create_app()


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def test_client():
    """Create async test client (mirrors test_agents.py pattern)."""
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    )


@pytest.fixture
def executive_headers():
    """Headers for executive user (matches test_agents.py)."""
    return {
        "X-User-Role": "executive",
        "X-User-Id": "exec_001",
        "X-User-Org-Type": "internal",
        "Content-Type": "application/json",
    }


@pytest.fixture
def valid_project():
    """Minimal valid project payload."""
    return {"name": "DHA EHR Modernization"}


@pytest.fixture
def valid_project_with_description():
    """Project payload with optional description."""
    return {
        "name": "DHA EHR Modernization",
        "description": "Technical approach for electronic health records modernization",
    }


# =============================================================================
# MOCK: Supabase client
# =============================================================================

def mock_supabase_insert(data):
    """
    Mock Supabase table().insert().execute() chain.
    Returns a response that looks like what Supabase returns.
    """
    mock_response = MagicMock()
    mock_response.data = [{
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": data.get("name", "Test"),
        "description": data.get("description"),
        "created_by": data.get("created_by", "user_001"),
        "created_at": "2026-02-18T14:30:00+00:00",
        "updated_at": "2026-02-18T14:30:00+00:00",
    }]
    return mock_response


def get_mock_supabase():
    """Build a mock Supabase client with chained method support."""
    mock_client = MagicMock()
    mock_table = MagicMock()
    mock_insert = MagicMock()

    mock_client.table.return_value = mock_table
    mock_table.insert.return_value = mock_insert
    mock_insert.execute.side_effect = lambda: mock_supabase_insert(
        mock_table.insert.call_args[0][0]
    )

    return mock_client


# =============================================================================
# TESTS: VALIDATION (422)
# =============================================================================

@pytest.mark.asyncio
async def test_create_project_missing_name(test_client, executive_headers):
    """Missing name field returns 422."""
    async with test_client as client:
        response = await client.post(
            "/api/projects",
            headers=executive_headers,
            json={},
        )
    assert response.status_code == 422
    body = response.json()
    # Pydantic v2 returns 'detail' with field errors
    assert "detail" in body


@pytest.mark.asyncio
async def test_create_project_empty_name(test_client, executive_headers):
    """Empty string name returns 422 (min_length=1)."""
    async with test_client as client:
        response = await client.post(
            "/api/projects",
            headers=executive_headers,
            json={"name": ""},
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_project_name_too_long(test_client, executive_headers):
    """Name exceeding 80 chars returns 422."""
    async with test_client as client:
        response = await client.post(
            "/api/projects",
            headers=executive_headers,
            json={"name": "A" * 81},
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_project_name_exactly_80(test_client, executive_headers):
    """Name at exactly 80 chars is valid (boundary test)."""
    with patch("project_routes.get_supabase_client", return_value=get_mock_supabase()):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers=executive_headers,
                json={"name": "A" * 80},
            )
    assert response.status_code == 201


# =============================================================================
# TESTS: SUCCESSFUL CREATION (201)
# =============================================================================

@pytest.mark.asyncio
async def test_create_project_success(test_client, executive_headers, valid_project):
    """Valid request returns 201 with created object."""
    with patch("project_routes.get_supabase_client", return_value=get_mock_supabase()):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers=executive_headers,
                json=valid_project,
            )

    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert body["name"] == valid_project["name"]
    assert body["description"] is None
    assert "created_by" in body
    assert "created_at" in body


@pytest.mark.asyncio
async def test_create_project_with_description(
    test_client, executive_headers, valid_project_with_description
):
    """Valid request with description returns both fields."""
    with patch("project_routes.get_supabase_client", return_value=get_mock_supabase()):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers=executive_headers,
                json=valid_project_with_description,
            )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == valid_project_with_description["name"]
    assert body["description"] == valid_project_with_description["description"]


@pytest.mark.asyncio
async def test_create_project_created_by_matches_user(test_client, valid_project):
    """created_by field matches the authenticated user's ID."""
    headers = {
        "X-User-Role": "capture_manager",
        "X-User-Id": "cap_042",
        "X-User-Org-Type": "internal",
        "Content-Type": "application/json",
    }
    with patch("project_routes.get_supabase_client", return_value=get_mock_supabase()):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers=headers,
                json=valid_project,
            )

    assert response.status_code == 201
    body = response.json()
    assert body["created_by"] == "cap_042"


# =============================================================================
# TESTS: AUTH STUB BEHAVIOR (documents current reality)
# =============================================================================

@pytest.mark.asyncio
async def test_create_project_no_auth_headers_defaults_to_executive(
    test_client, valid_project
):
    """
    No auth headers → stub defaults to executive role, user_001.
    This documents current stub behavior, NOT desired behavior.
    """
    with patch("project_routes.get_supabase_client", return_value=get_mock_supabase()):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers={"Content-Type": "application/json"},
                json=valid_project,
            )

    # Stub allows this — executive is default
    assert response.status_code == 201
    body = response.json()
    assert body["created_by"] == "user_001"


# =============================================================================
# TESTS: REAL JWT AUTH (blocked on AUTH-001)
# =============================================================================

@pytest.mark.skip(reason="Blocked on AUTH-001 — requires real JWT verification")
@pytest.mark.asyncio
async def test_create_project_no_bearer_token_returns_401(test_client, valid_project):
    """Missing Authorization header returns 401."""
    async with test_client as client:
        response = await client.post(
            "/api/projects",
            headers={"Content-Type": "application/json"},
            json=valid_project,
        )
    assert response.status_code == 401


@pytest.mark.skip(reason="Blocked on AUTH-001 — requires real JWT verification")
@pytest.mark.asyncio
async def test_create_project_expired_token_returns_401(test_client, valid_project):
    """Expired JWT returns 401."""
    async with test_client as client:
        response = await client.post(
            "/api/projects",
            headers={
                "Authorization": "Bearer expired.jwt.token",
                "Content-Type": "application/json",
            },
            json=valid_project,
        )
    assert response.status_code == 401


# =============================================================================
# TESTS: ERROR HANDLING
# =============================================================================

@pytest.mark.asyncio
async def test_create_project_supabase_failure_returns_500(
    test_client, executive_headers, valid_project
):
    """Supabase error returns 500 without exposing internals."""
    mock_client = MagicMock()
    mock_table = MagicMock()
    mock_client.table.return_value = mock_table
    mock_table.insert.return_value.execute.side_effect = Exception("Connection refused")

    with patch("project_routes.get_supabase_client", return_value=mock_client):
        async with test_client as client:
            response = await client.post(
                "/api/projects",
                headers=executive_headers,
                json=valid_project,
            )

    assert response.status_code == 500
    body = response.json()
    # Must not expose "Connection refused" or Supabase details
    assert "Connection refused" not in json.dumps(body)
    assert "error" in body or "detail" in body


# =============================================================================
# DRIFT GUARD: Verify scope boundaries
# =============================================================================

@pytest.mark.asyncio
async def test_get_projects_does_not_exist(test_client, executive_headers):
    """GET /api/projects must return 405 — only POST is in scope."""
    async with test_client as client:
        response = await client.get(
            "/api/projects",
            headers=executive_headers,
        )
    assert response.status_code == 405


@pytest.mark.asyncio
async def test_delete_projects_does_not_exist(test_client, executive_headers):
    """DELETE /api/projects must return 405 — only POST is in scope."""
    async with test_client as client:
        response = await client.delete(
            "/api/projects",
            headers=executive_headers,
        )
    assert response.status_code == 405
