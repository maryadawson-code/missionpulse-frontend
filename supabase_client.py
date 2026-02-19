# FILE: supabase_client.py
# SECURITY: NIST 800-53 Rev 5 CHECKED — SC-28 (Protection of Information at Rest)
# NOTE: Anon key fallback is acceptable for development; production must use env vars only.
# TECH-DEBT: DB-001 — Expand this into full backend DB module with connection pooling

"""
================================================================================
MISSIONPULSE - SUPABASE CLIENT (Python Backend)
================================================================================
Minimal Supabase client for backend API operations.

Canonical DB: djuviwarqdvlbgcfuupa.supabase.co
Decision: D2/D3 locked 2026-02-18 — supabase-py SDK, single canonical project.

Author: Mission Meets Tech
Version: 1.0.0
================================================================================
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger("missionpulse.supabase")

# =============================================================================
# CONFIGURATION
# =============================================================================

# TECH-DEBT: DB-001 — Move these to a centralized config module
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://djuviwarqdvlbgcfuupa.supabase.co"
)
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXZpd2FycWR2bGJnY2Z1dXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MzUyMjQsImV4cCI6MjA1MzQxMTIyNH0.pBPL9l2zL7LLd_A5I--hPBzw5YwG3ajPMtbYsqsxIgQ"
)


# =============================================================================
# SINGLETON CLIENT
# =============================================================================

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create a Supabase client instance (singleton).

    Returns:
        Initialized Supabase client connected to djuviwarqdvlbgcfuupa

    Raises:
        RuntimeError: If SUPABASE_URL or SUPABASE_KEY are missing/empty
    """
    global _client

    if _client is not None:
        return _client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set. "
            "Set via environment variables or .env file."
        )

    _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"Supabase client initialized for {SUPABASE_URL[:40]}...")
    return _client


def reset_client() -> None:
    """Reset the singleton (for testing)."""
    global _client
    _client = None
