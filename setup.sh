#!/usr/bin/env bash
# setup.sh — One-command local setup for Juiko (macOS)
#
# Usage:
#   chmod +x setup.sh && ./setup.sh
#
# What it does:
#   1. Installs missing dependencies via Homebrew (PostgreSQL, Python 3, Node, Ollama)
#   2. Initializes and starts a local PostgreSQL cluster on port 5430
#   3. Creates the juiko_db database and runs the schema
#   4. Creates a Python virtualenv and installs backend dependencies
#   5. Installs frontend Node dependencies
#   6. Pulls the Ollama LLM model (llama3.2:1b)
#   7. Starts all services (PostgreSQL, Ollama, Flask, React)
#
# Press Ctrl+C to stop all services cleanly.

set -euo pipefail

# ── Helpers ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { echo -e "${BLUE}▶${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1" >&2; exit 1; }
step() { echo -e "\n${BOLD}── $1 ──${NC}"; }

# ── 1. Homebrew ───────────────────────────────────────────────────────────────
step "1/8  Homebrew"
if ! command -v brew &>/dev/null; then
    log "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Add to PATH for Apple Silicon Macs
    if [[ -f /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi
ok "Homebrew $(brew --version | head -1)"

# ── 2. PostgreSQL ─────────────────────────────────────────────────────────────
step "2/8  PostgreSQL"
if ! command -v pg_ctl &>/dev/null; then
    log "Installing PostgreSQL 16..."
    brew install postgresql@16
    brew link --force --overwrite postgresql@16
fi
# Extend PATH in case pg binaries aren't linked yet
for pg_bin in /opt/homebrew/opt/postgresql@16/bin /usr/local/opt/postgresql@16/bin; do
    [[ -x "$pg_bin/pg_ctl" ]] && export PATH="$pg_bin:$PATH" && break
done
command -v pg_ctl &>/dev/null || err "pg_ctl not found after install. Try: brew link --force postgresql@16"
ok "$(pg_ctl --version)"

# ── 3. Python 3 ───────────────────────────────────────────────────────────────
step "3/8  Python 3"
if ! command -v python3 &>/dev/null; then
    log "Installing Python 3..."
    brew install python3
fi
ok "$(python3 --version)"

# ── 4. Node.js ────────────────────────────────────────────────────────────────
step "4/8  Node.js"
if ! command -v node &>/dev/null; then
    log "Installing Node.js..."
    brew install node
fi
ok "Node $(node --version) / npm $(npm --version)"

# ── 5. Ollama ─────────────────────────────────────────────────────────────────
step "5/8  Ollama"
if ! command -v ollama &>/dev/null; then
    log "Installing Ollama..."
    brew install ollama
fi
ok "$(ollama --version)"

# ── 6. Database ───────────────────────────────────────────────────────────────
step "6/8  Database"
mkdir -p "$ROOT_DIR/data" "$ROOT_DIR/logs"

if [ ! -f "$ROOT_DIR/data/PG_VERSION" ]; then
    log "Initializing PostgreSQL cluster in ./data/ ..."
    initdb -U postgres -D "$ROOT_DIR/data"
    ok "Cluster initialized"
else
    ok "Cluster already initialized"
fi

if ! pg_ctl -D "$ROOT_DIR/data" status &>/dev/null; then
    log "Starting PostgreSQL on port 5430..."
    pg_ctl -D "$ROOT_DIR/data" -l "$ROOT_DIR/logs/pg_logfile" \
        -o "-p 5430 -h localhost" start
fi

log "Waiting for PostgreSQL to accept connections..."
for i in $(seq 1 15); do
    pg_isready -h localhost -p 5430 -U postgres -q && break
    sleep 1
done
pg_isready -h localhost -p 5430 -U postgres -q \
    || err "PostgreSQL did not start. Check logs/pg_logfile for details."
ok "PostgreSQL is ready on port 5430"

if ! psql -h localhost -p 5430 -U postgres -lqt 2>/dev/null \
        | cut -d'|' -f1 | grep -qw "juiko_db"; then
    log "Creating database juiko_db..."
    createdb -h localhost -p 5430 -U postgres -O postgres juiko_db
    log "Running SQL schema..."
    psql -h localhost -p 5430 -U postgres -d juiko_db \
        -f "$ROOT_DIR/sql/create_tables.sql"
    ok "Database and tables created"
else
    ok "Database juiko_db already exists"
fi

# ── 7. Python dependencies ────────────────────────────────────────────────────
step "7/8  Python dependencies"
if [ ! -d "$ROOT_DIR/backend/venv" ]; then
    log "Creating virtual environment..."
    python3 -m venv "$ROOT_DIR/backend/venv"
fi
log "Installing packages..."
"$ROOT_DIR/backend/venv/bin/pip" install --quiet -r "$ROOT_DIR/backend/requirements.txt"
ok "Python dependencies installed"

# ── 8. Node dependencies ──────────────────────────────────────────────────────
step "8/8  Node dependencies"
log "Running npm install..."
(cd "$ROOT_DIR/frontend" && npm install --silent)
ok "Node dependencies installed"

# ── Ollama model ──────────────────────────────────────────────────────────────
echo ""
log "Pulling Ollama model llama3.2:3b (~2.2 GB, skipped if already downloaded)..."
ollama pull llama3.2:3b
ok "Model llama3.2:1b ready"

# ── Launch all services ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setup complete. Launching all services...${NC}"
echo ""

export DATABASE_URL="postgresql://postgres@localhost:5430/juiko_db"

# Ollama server
OLLAMA_PID=""
if curl -s http://localhost:11434 &>/dev/null; then
    ok "Ollama server already running"
else
    ollama serve &>/dev/null &
    OLLAMA_PID=$!
    ok "Ollama server started (pid $OLLAMA_PID)"
fi

# Flask backend
(
    cd "$ROOT_DIR/backend"
    export FLASK_APP=app.py
    "$ROOT_DIR/backend/venv/bin/flask" run
) &
FLASK_PID=$!
ok "Flask backend started (pid $FLASK_PID)"

# Give Flask a moment to bind its port before the frontend loads
sleep 2

# React frontend (opens browser automatically)
(cd "$ROOT_DIR/frontend" && npm start) &
REACT_PID=$!
ok "React frontend started (pid $REACT_PID)"

echo ""
echo -e "${GREEN}${BOLD}  All services running${NC}"
echo -e "  Frontend : ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend  : ${BLUE}http://localhost:5000${NC}"
echo -e "  Ollama   : ${BLUE}http://localhost:11434${NC}"
echo ""
echo -e "Press ${BOLD}Ctrl+C${NC} to stop all services."

# Graceful shutdown on Ctrl+C
cleanup() {
    echo ""
    log "Stopping services..."
    [ -n "$REACT_PID" ]  && kill "$REACT_PID"  2>/dev/null || true
    [ -n "$FLASK_PID" ]  && kill "$FLASK_PID"  2>/dev/null || true
    [ -n "$OLLAMA_PID" ] && kill "$OLLAMA_PID" 2>/dev/null || true
    pg_ctl -D "$ROOT_DIR/data" stop -m fast 2>/dev/null || true
    ok "All services stopped"
    exit 0
}
trap cleanup INT TERM

wait "$FLASK_PID" "$REACT_PID" 2>/dev/null || true
