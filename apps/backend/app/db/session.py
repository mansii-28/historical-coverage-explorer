"""Database session configuration using SQLAlchemy 2.x async engine."""

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

logger = logging.getLogger(__name__)

# Serverless Connection Strategy:
# When running under Vercel Serverless Functions against Neon PostgreSQL, function
# execution environments scale up and down ephemerally based on traffic.
# Neon provides managed connection pooling externally via pgBouncer.
# If each ephemeral serverless function instance maintained a local connection pool
# (e.g. pool_size=10, max_overflow=20), sudden concurrency spikes would quickly exhaust
# upstream PostgreSQL connection slots.
# Therefore, in serverless environments (Vercel / production), we configure NullPool with
# pool_pre_ping=True to open connections on demand and immediately return them to Neon's
# pooler upon session closure. Local development retains standard application-level pooling.
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if settings.is_serverless:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_connection() -> None:
    """Verify database connectivity on startup."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("✓ Database connection established successfully.")
    except Exception as exc:
        logger.error(
            "✗ Database connection failed: %s. "
            "Ensure PostgreSQL is running and DATABASE_URL is correct.",
            exc,
        )
        # Do not raise — allow the app to start so /health can report degraded state
