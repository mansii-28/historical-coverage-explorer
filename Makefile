.PHONY: help setup dev backend frontend lint format down reset-db

# ─── Defaults ──────────────────────────────────────────────────────────────────
PROJECT_ROOT := $(shell pwd)
BACKEND_DIR  := $(PROJECT_ROOT)/apps/backend
FRONTEND_DIR := $(PROJECT_ROOT)/apps/frontend

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ─── Setup ─────────────────────────────────────────────────────────────────────
setup: ## Install all dependencies (backend + frontend)
	@echo "→ Setting up backend..."
	@cd $(BACKEND_DIR) && python -m venv .venv && \
	  .venv/bin/pip install --upgrade pip && \
	  .venv/bin/pip install -r requirements.txt
	@echo "→ Setting up frontend..."
	@cd $(FRONTEND_DIR) && npm install
	@echo "→ Copying .env.example → .env (if not present)..."
	@test -f .env || cp .env.example .env
	@echo "✓ Setup complete."

# ─── Development ───────────────────────────────────────────────────────────────
dev: ## Start backend + frontend concurrently (requires concurrently or tmux)
	@echo "→ Starting backend on :8000 and frontend on :5173..."
	@$(MAKE) -j2 backend frontend

backend: ## Start FastAPI dev server
	@cd $(BACKEND_DIR) && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend: ## Start Vite dev server
	@cd $(FRONTEND_DIR) && npm run dev

# ─── Docker ────────────────────────────────────────────────────────────────────
up: ## Start all services via Docker Compose
	docker compose up --build

down: ## Stop all Docker Compose services
	docker compose down

down-v: ## Stop all services and remove volumes (destroys DB data)
	docker compose down -v

# ─── Database & Seed ───────────────────────────────────────────────────────────
db-upgrade: ## Run Alembic migrations
	@cd $(BACKEND_DIR) && PYTHONPATH=. .venv/bin/alembic upgrade head

migrate: db-upgrade ## Alias for db-upgrade

db-revision: ## Create a new Alembic migration (usage: make db-revision MSG="describe change")
	@cd $(BACKEND_DIR) && PYTHONPATH=. .venv/bin/alembic revision --autogenerate -m "$(MSG)"

reset-demo: ## Reset demo database to canonical baseline via API
	@echo "→ Resetting demo database to canonical baseline..."
	@curl -s -X POST http://localhost:8000/api/demo/reset | jq . || curl -s -X POST http://localhost:8000/api/demo/reset

seed: reset-demo ## Alias for reset-demo

# ─── Linting / Formatting ──────────────────────────────────────────────────────
lint: ## Lint backend (ruff) and frontend (eslint)
	@echo "→ Linting backend..."
	@cd $(BACKEND_DIR) && .venv/bin/ruff check app/
	@echo "→ Linting frontend..."
	@cd $(FRONTEND_DIR) && npm run lint

format: ## Format backend (ruff) and frontend (prettier)
	@echo "→ Formatting backend..."
	@cd $(BACKEND_DIR) && .venv/bin/ruff format app/
	@echo "→ Formatting frontend..."
	@cd $(FRONTEND_DIR) && npm run format

# ─── Testing (Phase 4) ─────────────────────────────────────────────────────────
test: test-backend test-frontend ## Run backend and frontend test suites

test-backend: ## Run backend tests with pytest
	@cd $(BACKEND_DIR) && .venv/bin/pytest -v

test-frontend: ## Run frontend unit tests with vitest
	@cd $(FRONTEND_DIR) && npm run test

test-e2e: ## Run Playwright end-to-end tests
	@cd $(FRONTEND_DIR) && npm run test:e2e

coverage: ## Run backend tests with code coverage report
	@cd $(BACKEND_DIR) && .venv/bin/pytest --cov=app --cov-report=term-missing
