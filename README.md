<h1>
  <img src="frontend/resources/assets/logo_dark.png" alt="" height="50" style="vertical-align: bottom;" />
  PoE Cook
</h1>

**Your currency-making strategy tracker for Path of Exile.**

"Cooking" is the art of turning knowlegde into strategies that yield profit — whether that's flipping Divination cards, sacrificing items in Temples, running Bestiary recipes, farming bosses for drops, or crafting items to sell. PoE Cook lets you define, evaluate, and track these strategies as recipes: specify your inputs, set your outputs, and see in real-time whether the numbers make sense — powered by live poe.ninja prices and direct trade listing lookups.

> **Developer Alpha** — functional and usable locally, but rough edges remain. See the [Roadmap](#roadmap).

---

## Showcase

<!-- ─────────────────────────────────────────────────────────────────────────
  GIF 1 — Browsing the recipe list
  SCRIPT:
    - Open the app at http://localhost:8080 with a couple of pre-created recipes visible
    - Scroll through the recipe cards; each card shows input items, output item,
      profit range (min / median), and a "last updated" timestamp
    - Click the manual refresh button on one card → show the loading spinner,
      then the updated profit value
    - Toggle the Auto Refresh switch → demonstrate it cycling through recipes automatically
───────────────────────────────────────────────────────────────────────────── -->

*[GIF placeholder — browsing the recipe list, viewing profit ranges and auto-refresh]*

---

<!-- ─────────────────────────────────────────────────────────────────────────
  GIF 2 — Creating a recipe
  SCRIPT:
    - Click "Create Recipe" in the nav bar
    - Paste a Path of Exile trade URL into an input slot → item resolves (name, icon, price appear)
    - Set the quantity to 4
    - Click "+ Add Input" to add a second input slot, paste another trade URL, watch it resolve
    - Set the output item by pasting a trade URL into the output slot
    - The recipe name auto-fills; optionally edit it
    - Click "Create Recipe" → recipe appears in the list with an initial profit estimate
───────────────────────────────────────────────────────────────────────────── -->

*[GIF placeholder — creating a new recipe from trade URLs]*

---

<!-- ─────────────────────────────────────────────────────────────────────────
  GIF 3 — Editing a recipe
  SCRIPT:
    - On a recipe card, click the Edit button
    - The Create Recipe form opens pre-filled with the existing recipe data
    - Change the quantity of one input from 4 to 6
    - Click "Save" → the recipe card updates with the new quantity and recalculated profit
    - Edit again, make a change, then click "Cancel" → confirm no changes were saved
───────────────────────────────────────────────────────────────────────────── -->

*[GIF placeholder — editing an existing recipe and cancelling vs. saving]*

---

<!-- ─────────────────────────────────────────────────────────────────────────
  GIF 4 — Switching leagues
  SCRIPT:
    - Open the league picker in the top-right of the nav bar
    - Change from Standard to the current challenge league
    - Show all recipe prices updating to reflect that league's poe.ninja data
───────────────────────────────────────────────────────────────────────────── -->

*[GIF placeholder — switching leagues and watching prices update]*

---

## Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Getting your POESESSID](#getting-your-poesessid)
- [Available Commands](#available-commands)
- [Local Development (without Docker)](#local-development-without-docker)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [API & Code Generation](#api--code-generation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Features

- **Recipe builder** — define any strategy as a recipe: N input items → M output items, each with a configurable quantity. Works for currency flipping, Div card sets, Bestiary recipes, Temple sacrifices, boss drops, crafting, and more
- **Live profit calculation** — compares the chaos-equivalent cost of all inputs vs. the value of the outputs using real-time poe.ninja exchange rates
- **Trade page resolver** — paste any Path of Exile trade URL; PoE Cook fetches the live listings and extracts item details automatically (requires a valid `POESESSID`)
- **Multi-league support** — switch between leagues; all prices update instantly
- **Auto-refresh** — background scheduler keeps recipe values current while you play, so you always know which strategies are worth running
- **poe.ninja integration** — currency and item prices fetched and cached from poe.ninja

---

## Prerequisites

### Docker path (recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Local dev path
- Node.js 22+ and npm 10+

---

## Quick Start (Docker)

**1. Clone the repository**
```bash
git clone https://github.com/rbiersbach/poe-tools.git
cd poe-tools
```

**2. Configure your session ID**
```bash
cp .env.example .env
```
Open `.env` and replace `your_session_id_here` with your actual `POESESSID`.  
→ See [Getting your POESESSID](#getting-your-poesessid) if you're not sure where to find it.

> **Session ID** is needed to resolve trade urls to search parameters, I found no better way to do this for now.

**3. Start the app**
```bash
make start
```

This builds the Docker images and starts both services. Once complete:

| Service  | URL                        |
|----------|----------------------------|
| App      | http://localhost:8080      |
| API      | http://localhost:3001      |

> **First run** takes a minute or two to build the images. Subsequent starts are fast.

---

## Getting your POESESSID

POE Tools needs your Path of Exile session cookie to fetch trade listings on your behalf, because opening a trade link and deriving the search parameters from there requires authentication.

1. Open [pathofexile.com](https://www.pathofexile.com) and **log in**
2. Open your browser's DevTools (`F12` / `Cmd+Option+I`)
3. Go to **Application** (Chrome) or **Storage** (Firefox) → **Cookies** → `https://www.pathofexile.com`
4. Find the cookie named **`POESESSID`** and copy its value
5. Paste it as the value of `POE_SESSID` in your `.env` file

> **Note:** the session cookie expires when you log out of the Path of Exile website. If recipe resolution stops working, refresh the cookie by logging in again and repeating the steps above.
Sharing a session cookie with a third party app is not recommended and should be avoided.
A final version of this app should find a better solution.
If you are afraid of running my code, check first that its safe.

---

## Available Commands

```bash
make start     # Build images and start all services
make stop      # Stop and remove containers
make restart   # Stop then start
make build     # Rebuild Docker images without starting
make logs      # Follow logs from all containers
make dev       # Print local development instructions
make help      # List all commands
```

---

## Local Development (without Docker)

```bash
# 1. Install all workspace dependencies
npm install

# 2. Create your .env file (required — backend reads POE_SESSID from it)
cp .env.example .env
# Edit .env and set POE_SESSID

# 3. Start the backend (port 3001) — in one terminal
npm run dev:backend

# 4. Start the frontend (port 5173) — in another terminal
npm run dev:frontend
```

Open http://localhost:5173 in your browser.

---

## Project Structure

```
poe-tools/
├── backend/                  # Fastify API server (Node.js + TypeScript)
│   ├── src/
│   │   ├── api/              # Route handlers
│   │   ├── models/           # Shared types
│   │   ├── services/         # Business logic (trade resolver, poe.ninja, recipes…)
│   │   ├── stores/           # In-memory data stores
│   │   └── index.ts          # Entry point
│   └── data/
│       └── recipes.json      # Persisted recipe data (mounted as Docker volume)
│
├── frontend/                 # React + Vite + Tailwind app
│   └── src/
│       ├── api/generated/    # Auto-generated API client (from OpenAPI spec)
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page-level components (RecipesList, CreateRecipe)
│       └── context/          # React context (league, exchange rates, …)
│
├── specs/
│   └── openapi.yaml          # OpenAPI 3.0 spec (source of truth for the API)
│
├── docker-compose.yml        # Orchestrates backend + frontend containers
├── Makefile                  # Developer shortcuts
└── .env.example              # Environment variable template
```

---

## Running Tests

```bash
# Backend tests
npm run test --workspace backend

# Frontend tests
npm run test --workspace frontend
```

---

## API & Code Generation

The frontend API client is generated from the OpenAPI spec in `specs/openapi.yaml`.

After changing the spec or the backend API, regenerate the client:
```bash
npm run generate:api
```

The generated files land in `frontend/src/api/generated/` — do not edit them manually.

---

## Roadmap

### Planned for next releases

- [ ] Initial set of pre-built recipes to get started without creating everything from scratch
- [ ] Light mode polish
- [ ] Custom price overrides per item
- [ ] Filter out items/recipes below a configurable volume or profit threshold
- [ ] Baseline currency toggle (e.g. price everything in Divine instead of Chaos)

### Future / Backlog

- [ ] Tag recipes and show/hide groups
- [ ] Favourite recipes
- [ ] Read-only predefined core recipes with persisted refresh results
- [ ] Browser-based login / PoE OAuth (remove the need to copy POESESSID manually)
- [ ] Database persistence (replace the JSON file store)
- [ ] User accounts and cloud sync
- [ ] Hosted version (no local setup required)
- [ ] IP rate limiting and abuse protection
- [ ] Migrate recipes to a different league 

---

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Make your changes — run the tests before pushing (`npm run test --workspace backend && npm run test --workspace frontend`)
3. Open a pull request against `main` with a clear description of what changed and why

All feedback, bug reports, and suggestions are welcome via GitHub Issues.

---

*PoE Cook is an unofficial fan project. Not affiliated with or endorsed by Grinding Gear Games.*
