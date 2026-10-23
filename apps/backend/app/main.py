"""
Historical Coverage Explorer — Backend
=======================================
Concept prototype built as a product and engineering thought exercise.
Uses synthetic data only and does not represent any company's production architecture.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import claims, coverage, demo, health, policies, vehicles
from app.core.config import settings
from app.db.session import check_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle handler."""
    # Startup
    await check_db_connection()
    yield
    # Shutdown


app = FastAPI(
    title="Historical Coverage Explorer",
    description=(
        "Effective-Dated Insurance Coverage Prototype. "
        "Concept prototype built as a product and engineering thought exercise. "
        "Uses synthetic data only and does not represent any company's production architecture."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(demo.router)
app.include_router(policies.router)
app.include_router(vehicles.router)
app.include_router(coverage.router)
app.include_router(claims.router)
