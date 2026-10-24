#!/usr/bin/env bash
set -euo pipefail

echo "[deployment] backend build initialization started"

# Navigate to backend root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${BACKEND_DIR}"

if [[ "${VERCEL_ENV:-}" != "production" ]]; then
    echo "[deployment] non-production environment; skipping production DB migration"
    exit 0
fi

if [[ -z "${DATABASE_URL_UNPOOLED:-}" ]]; then
    echo "[deployment] DATABASE_URL_UNPOOLED is required"
    exit 1
fi

# Detect python binary
if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
else
    echo "[deployment] ERROR: Neither python3 nor python found in PATH"
    exit 1
fi

echo "[deployment] applying Alembic migrations"

if command -v alembic >/dev/null 2>&1; then
    PYTHONPATH=. alembic upgrade head
else
    PYTHONPATH=. "${PYTHON_BIN}" -m alembic upgrade head
fi

echo "[deployment] Alembic migration complete"

echo "[deployment] running seed_if_empty"

PYTHONPATH=. "${PYTHON_BIN}" -m app.scripts.seed_if_empty

echo "[deployment] backend database initialization complete"
