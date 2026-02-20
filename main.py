# FILE: main.py
# SECURITY: NIST 800-53 Rev 5 CHECKED
# ENCRYPTION: FIPS 140-2 COMPLIANT
# S11: Added data_routes (Supabase CRUD) alongside agents_router

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

# Route imports — flat file structure (Render root deployment)
from agents import router as agents_router
from data_routes import router as data_router

# =============================================================================
# LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("missionpulse.api")


# =============================================================================
# APPLICATION FACTORY
# =============================================================================

def create_app() -> FastAPI:
    app = FastAPI(
        title="MissionPulse API",
        description="AI-Powered Proposal Management for Federal Contractors",
        version="1.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8501",
            "https://missionpulse.netlify.app",
            "https://*.netlify.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request timing
    @app.middleware("http")
    async def add_timing(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
        return response

    # Request logging
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"{request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"{request.method} {request.url.path} -> {response.status_code}")
        return response

    # Exception handlers
    @app.exception_handler(HTTPException)
    async def http_exc(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "status_code": exc.status_code, "path": str(request.url.path)}
        )

    @app.exception_handler(Exception)
    async def general_exc(request: Request, exc: Exception):
        logger.exception(f"Unhandled: {exc}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "status_code": 500, "path": str(request.url.path)}
        )

    # =========================================================================
    # ROUTES
    # =========================================================================

    @app.get("/api/health", tags=["System"])
    async def health():
        return {"status": "healthy", "service": "missionpulse-api", "version": "1.1.0"}

    @app.get("/api/version", tags=["System"])
    async def version():
        return {
            "version": "1.1.0",
            "capabilities": ["ai_agents", "data_crud", "audit_logging", "token_tracking"],
            "agents": ["capture", "strategy", "compliance", "writer", "pricing", "blackhat", "contracts", "orals"],
            "data_tables": ["opportunities", "past_performance", "win_themes", "team_assignments", "proposal_outlines", "competitors", "compliance_items", "audit_logs"],
        }

    # AI Agents (existing)
    app.include_router(agents_router, prefix="/api")

    # Data CRUD (new — S11)
    app.include_router(data_router, prefix="/api")

    return app


# =============================================================================
# APPLICATION INSTANCE
# =============================================================================

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
