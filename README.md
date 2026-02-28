# Juiko

A personal finance tracker for importing bank/credit card statements, tagging transactions, and understanding your spending.

---

## Getting Started

### Prerequisites

- macOS (the setup script uses Homebrew)
- An internet connection for the first run (to download dependencies and the LLM model)

### One-command setup

```bash
git clone <repo-url>
cd juiko
chmod +x setup.sh && ./setup.sh
```

The script will:

1. Install missing tools via Homebrew — PostgreSQL 16, Python 3, Node.js, Ollama
2. Initialize a local PostgreSQL cluster in `./data/` on port **5430**
3. Create the `juiko_db` database and run the schema
4. Create a Python virtualenv and install backend dependencies
5. Install frontend Node dependencies
6. Pull the `llama3.2:3b` LLM model (~2.2 GB, only on first run)
7. Start all four services and open the app in your browser

Once running:

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:3000     |
| Backend  | http://localhost:5000     |
| Ollama   | http://localhost:11434    |

Press `Ctrl+C` to stop everything cleanly.

The setup script is **idempotent** — safe to run again if something was interrupted.

### Manual startup (after first setup)

If you've already run the setup once and just want to start the app:

```bash
# Start the database
./scripts/start_db.sh

# Start Ollama
ollama serve &

# Start the backend (from the backend/ directory)
DATABASE_URL="postgresql://postgres@localhost:5430/juiko_db" FLASK_APP=app.py backend/venv/bin/flask run

# Start the frontend (from the frontend/ directory)
cd frontend && npm start
```

---

## What is Juiko?

Juiko is a self-hosted personal finance management tool. The core idea is that all your financial data — transactions from multiple banks, credit cards, and investment accounts — lives in one place that you fully control, with no third-party sync services involved.

**The main workflow:**

1. Add your financial accounts as **instruments** (e.g. "Chase Sapphire", "Fidelity Brokerage")
2. Download a statement CSV from your bank's website and upload it to Juiko
3. Transactions are parsed and imported automatically in the background
4. An on-device LLM suggests a spending category **tag** for each transaction based on your own past tagging history
5. You can review, correct, or manually add tags at any time
6. (Planned) Summary visuals on the home page give you an overview of spending by category, account, and time period

The emphasis on local-first design — a PostgreSQL cluster in `./data/`, Ollama running on your machine — means your financial data never leaves your computer.

### Customising the AI tagger

The AI tagging behaviour is fully configurable without touching any code. Edit **`backend/tagging_config.yaml`** and restart the Flask backend to apply changes:

- **`model`** — swap the Ollama model (e.g. `llama3.1:8b` for better accuracy, `llama3.2:1b` for speed)
- **`categories`** — the spending taxonomy the model reasons from. Each key is the tag name; the value is a plain-English description with merchant examples. Add, rename, or remove categories freely.
- **`system_prompt`** — the base instructions sent to the model
- **`temperature`**, **`max_examples`**, **`examples_per_tag`** — generation and sampling controls

---

## Project Structure

```
juiko/
├── setup.sh                    # One-command setup and launch script
├── README.md
├── sql/
│   ├── create_tables.sql       # Full database schema
│   └── migrate.sql             # Incremental migration scripts
├── scripts/
│   ├── init_db.sh              # initdb — initialize the PostgreSQL cluster
│   ├── start_db.sh             # pg_ctl start on port 5430
│   └── create_tables.sh        # createdb + run schema
├── data/                       # PostgreSQL data directory (git-ignored)
├── logs/                       # PostgreSQL log output (git-ignored)
├── backend/
│   ├── app.py                  # Flask application factory + blueprint registration
│   ├── config.py               # Database URL config (env var or interactive prompt)
│   ├── requirements.txt
│   ├── tagging_config.yaml     # ✏️  AI tagger settings — edit to customise tagging behaviour
│   ├── models/
│   │   ├── base.py             # SQLAlchemy declarative base
│   │   ├── instrument_type.py
│   │   ├── instrument.py
│   │   ├── statement.py
│   │   ├── transaction.py
│   │   └── transaction_tag.py
│   ├── controllers/
│   │   ├── instrument_type.py
│   │   ├── instrument.py
│   │   ├── statement.py        # CSV upload + async background processing
│   │   └── transaction.py      # CRUD + tag management
│   └── services/
│       ├── transaction.py      # Shared parsing and creation logic
│       └── tagging.py          # Ollama few-shot tag suggestion (reads tagging_config.yaml)
└── frontend/
    └── src/
        ├── App.js              # Root component, page switching, data fetching
        ├── App.css             # Global styles and component styles
        ├── index.css           # CSS custom properties (design tokens)
        └── pages/
            ├── transaction.js  # Transaction table, inline edit, bulk delete, CSV upload modal
            ├── instrument.js   # Instrument table, inline edit/delete
            └── statement.js    # Statement list with async status tracking
```

---

## Architecture

### Backend

**Flask + SQLAlchemy 2.0**

The backend is a standard Flask app using Blueprints — one per resource (`/transaction`, `/instrument`, `/instrument_type`, `/statement`). SQLAlchemy 2.0 with `Mapped`/`mapped_column` typed ORM is used throughout.

**Services layer**

Shared business logic lives in `backend/services/` rather than in controllers. This avoids controllers calling each other's HTTP endpoints (which would mean N network round-trips for N rows during CSV import). The `create_transaction` service function is called directly by both the transaction controller and the statement processing background thread.

**Async CSV processing**

When a statement CSV is uploaded, the controller immediately returns `202 Accepted` with the new statement record. A daemon thread (`threading.Thread`) takes over, parses every row, creates transaction records, and calls the tagging service. Statement status progresses through `pending → processing → completed` (or `failed`). The frontend's Statements page lets you poll for completion with a Refresh button.

**AI tagging with Ollama**

Once per statement import, `build_context()` queries all manually-tagged transactions and returns two things: uniformly-sampled few-shot examples (up to 20, spread across all tag types so the model doesn't overfit to the most common ones), and the full list of known tags. Both are compiled into a structured prompt — with the known tag vocabulary listed explicitly so the model picks from familiar options before inventing new ones — and sent to a local `llama3.2:3b` model via `POST localhost:11434/api/generate`. The response goes through a dedicated cleaning function that strips label prefixes, filters stop words, and validates output with a regex. If Ollama is unavailable or returns garbage, the function returns `None` and the transaction is left untagged — it never raises.

Tags carry a `source` field (`manual` or `ai`) stored in the `transaction_tags` table. The UI renders AI tags in purple and manual tags in blue.

**Database**

PostgreSQL is run as a local cluster (not a system service) with `pg_ctl`, keeping all data inside the repo's `./data/` directory. The database runs on port **5430** (not the default 5432) to avoid conflicting with any existing system PostgreSQL installation. Native PostgreSQL `ENUM` types are used for `statement_status` and `tag_source`.

### Frontend

**React 19 (Create React App, plain JS)**

The frontend is intentionally kept simple — no routing library, no state management library. Page switching is handled by a `currentPage` string in `App.js` that controls which component is rendered.

**Lookup pattern**

Backend endpoints return data in the shape `{ items: [...], lookup: { instrument: { id: {...} } } }`. This means the frontend only makes one API call per page load and resolves foreign keys (e.g. instrument name from instrument_id) locally using the lookup object, without making additional requests per row.

**Local state for optimistic updates**

Transaction and instrument tables maintain a local `txList` / `instrumentList` state. Deletes are removed from local state immediately after the API confirms success, and edits update local state from the server response. There is no full re-fetch after mutations. This works well for a single-user app where no concurrent modifications are expected.

**Inline editing**

Edit and delete actions happen inline in the table row — no separate page or modal. The `Transaction` component manages its own `isEditing` and `showConfirmDelete` boolean states. The same pattern is used for instruments.

### Database schema

```
instrument_types  ←── instruments ←── transactions ←── transaction_tags
                               ↑
                          statements ──────────────────┘ (statement_id FK)
```

- `instruments` belong to an `instrument_type`
- `transactions` belong to an `instrument` and optionally to a `statement` (NULL = entered manually)
- `transaction_tags` is a composite-keyed join table with a `source` column
- Deleting a transaction cascades to its tags (SQLAlchemy `cascade="all, delete-orphan"`)
- Deleting an instrument is blocked at the API level if transactions exist
