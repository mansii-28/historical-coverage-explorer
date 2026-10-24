#!/usr/bin/env python3
"""E2E Test Backend Runner with Database Safety Guard.

Ensures the backend for Playwright tests only ever runs against a dedicated test
database whose name explicitly contains 'test'.
Fails fast and immediately aborts if pointing to development or production databases.
"""

import os
import subprocess
import sys
from urllib.parse import urlparse

# Default dedicated E2E test database URL
DEFAULT_E2E_DB_URL = (
    "postgresql+psycopg://hce_user:changeme@localhost:5432/historical_coverage_e2e_test"
)

db_url = os.environ.get("DATABASE_URL") or os.environ.get("E2E_DATABASE_URL") or DEFAULT_E2E_DB_URL

# Parse database name
parsed = urlparse(db_url)
db_name = parsed.path.lstrip("/")

# ─── DATABASE SAFETY GUARD ───────────────────────────────────────────────────
if "test" not in db_name.lower():
    sys.stderr.write(
        f"\n[FATAL SAFETY VIOLATION] Target database '{db_name}' does NOT contain 'test'.\n"
        "Playwright E2E suite refused to start because it must never execute against "
        "development ('historical_coverage') or production databases.\n"
        "Aborting immediately.\n\n"
    )
    sys.exit(1)

print(f"[E2E Safety Guard] Target database verified safe: '{db_name}' (contains 'test').")

# Export verified database URL and environment for the backend
os.environ["DATABASE_URL"] = db_url
os.environ["BACKEND_PORT"] = "8001"
os.environ["BACKEND_HOST"] = "127.0.0.1"

# Ensure alembic migrations are current on the E2E test database
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(repo_root, "apps", "backend")

# Add backend_dir to sys.path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

alembic_bin = os.path.join(backend_dir, ".venv", "bin", "alembic")
if os.path.exists(alembic_bin):
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir
    res = subprocess.run([alembic_bin, "upgrade", "head"], cwd=backend_dir, env=env)
    if res.returncode != 0:
        sys.stderr.write(f"[E2E Backend] Alembic migration failed with exit code {res.returncode}.\n")
        sys.exit(res.returncode)

import uvicorn  # noqa: E402

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=False, log_level="warning")
