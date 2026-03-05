.PHONY: help start stop restart build logs dev check-env

# Default target
help:
	@echo ""
	@echo "  POE Tools — available commands"
	@echo ""
	@echo "  make start      Build images and start all services (requires .env)"
	@echo "  make stop       Stop and remove containers"
	@echo "  make restart    Stop then start"
	@echo "  make build      Rebuild Docker images without starting"
	@echo "  make logs       Follow logs from all containers"
	@echo "  make dev        Print instructions for local (non-Docker) development"
	@echo "  make help       Show this help message"
	@echo ""

# ── Guard: ensure .env exists and POE_SESSID is set ─────────────────────────
check-env:
	@if [ ! -f .env ]; then \
		echo ""; \
		echo "  ✗  .env file not found."; \
		echo ""; \
		echo "     Run:  cp .env.example .env"; \
		echo "     Then open .env and set your POE_SESSID."; \
		echo "     See README.md → Getting your POESESSID for instructions."; \
		echo ""; \
		exit 1; \
	fi
	@if [ -z "$$(grep -E '^POE_SESSID=' .env | cut -d= -f2- | tr -d '[:space:]')" ]; then \
		echo ""; \
		echo "  ✗  POE_SESSID is not set in your .env file."; \
		echo ""; \
		echo "     Open .env and replace 'your_session_id_here' with your actual session ID."; \
		echo "     See README.md → Getting your POESESSID for instructions."; \
		echo ""; \
		exit 1; \
	fi

# ── Main targets ─────────────────────────────────────────────────────────────
start: check-env
	docker compose up -d --build
	@echo ""
	@echo "  ✓  POE Tools is running"
	@echo ""
	@echo "     Frontend  →  http://localhost:8080"
	@echo "     Backend   →  http://localhost:3001"
	@echo ""
	@echo "  Run 'make logs' to follow logs, 'make stop' to shut down."
	@echo ""

stop:
	docker compose down

restart: stop start

build:
	docker compose build

logs:
	docker compose logs -f

# ── Local development (without Docker) ───────────────────────────────────────
dev:
	@echo ""
	@echo "  Local development (without Docker)"
	@echo ""
	@echo "  Prerequisites: Node.js 22+, npm 10+"
	@echo ""
	@echo "  1. Install dependencies:"
	@echo "       npm install"
	@echo ""
	@echo "  2. Create your .env file at the project root:"
	@echo "       cp .env.example .env"
	@echo "     Then set POE_SESSID in .env."
	@echo ""
	@echo "  3. Start the backend (port 3001):"
	@echo "       npm run dev:backend"
	@echo ""
	@echo "  4. In a second terminal, start the frontend (port 5173):"
	@echo "       npm run dev:frontend"
	@echo ""
	@echo "  App:  http://localhost:5173"
	@echo "  API:  http://localhost:3001"
	@echo ""
