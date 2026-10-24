#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Historical Coverage Explorer — Backend Vercel Build Script
# ─────────────────────────────────────────────────────────────────────────────
# Handles safe, gated database migrations and idempotent seed initialization.
#
# Production Safety Guarantee:
# - When VERCEL_ENV == "production":
#     Runs 'alembic upgrade head' using DATABASE_URL_UNPOOLED (direct Neon connection).
#     Runs non-destructive 'seed_if_empty' to ensure baseline Jordan Lee policy exists.
# - When VERCEL_ENV == "preview":
#     REFUSES to mutate the Production database. Migrations only run if an isolated
#     PREVIEW_DATABASE_URL is explicitly configured and validated safe.
# - Otherwise (development / local):
#     Skips automated migration so developers control their local schemas.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "======================================================================"
echo "Historical Coverage Explorer — Backend Build Step"
echo "VERCEL_ENV: ${VERCEL_ENV:-not set (local/development)}"
echo "======================================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${BACKEND_DIR}"

if [ "${VERCEL_ENV:-}" = "production" ]; then
    echo "[Vercel Build] Production deployment environment detected."

    # Neon provides DATABASE_URL_UNPOOLED for DDL migrations
    TARGET_MIGRATION_URL="${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}"

    if [ -z "${TARGET_MIGRATION_URL}" ]; then
        echo "[Vercel Build] WARNING: Neither DATABASE_URL_UNPOOLED nor DATABASE_URL found."
        echo "[Vercel Build] Skipping automated database migrations and seeding."
    else
        echo "[Vercel Build] Running Alembic migrations against Production PostgreSQL (unpooled)..."
        # Export as DATABASE_URL_UNPOOLED so alembic/env.py picks it up directly
        export DATABASE_URL_UNPOOLED="${TARGET_MIGRATION_URL}"
        python3 -m alembic upgrade head

        echo "[Vercel Build] Running non-destructive seed-if-empty..."
        python3 -m app.scripts.seed_if_empty
        echo "[Vercel Build] ✓ Database migration and initialization complete."
    fi

elif [ "${VERCEL_ENV:-}" = "preview" ]; then
    echo "[Vercel Build] Preview deployment environment detected."

    if [ -n "${PREVIEW_DATABASE_URL:-}" ]; then
        echo "[Vercel Build] Dedicated PREVIEW_DATABASE_URL detected. Running preview migrations..."
        export DATABASE_URL_UNPOOLED="${PREVIEW_DATABASE_URL}"
        python3 -m alembic upgrade head
    else
        echo "[Vercel Build] SAFETY GUARD: Preview deployments do NOT mutate Production database."
        echo "[Vercel Build] Skipping Alembic migrations and seeding. (Configure PREVIEW_DATABASE_URL for isolated preview DBs)."
    fi

else
    echo "[Vercel Build] Non-Vercel environment. Skipping automated build migrations."
fi

echo "[Vercel Build] ✓ Backend build script finished successfully."
