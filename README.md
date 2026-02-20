## Example: Using the Trade Client

Here is an example of how to use the backend trade client directly:

```ts
import tradeClient from "trade-client";
import { TradeSearchRequest } from "trade-types";

async function main() {
  const req: TradeSearchRequest = {
    query: {
      term: "Headhunter",
      filters: {
        trade_filters: {
          filters: {
            price: { max: 15000 },
          },
        },
      },
    },
    sort: { price: "asc" },
  };

  const search = await tradeClient.search(req);
  console.log("query id:", search.id, "total:", search.total);

  const first10 = search.result.slice(0, 10);
  const fetched = await tradeClient.fetchListings(first10, search.id);

  for (const r of fetched.result) {
    const price = r.listing.price
      ? `${r.listing.price.amount} ${r.listing.price.currency} (${r.listing.price.type})`
      : "no price";
    console.log(r.id, price);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```
# POE Tools

Basic TypeScript monorepo layout with a React frontend and Node.js backend.

## Folder structure
- `backend/` Node.js + TypeScript API (terminal output only to start)
- `frontend/` React + Vite app

## Install
```bash
npm install
```

## Backend dev
```bash
npm run dev
```

Expected output (dev):
```
backend: hello from the server
```

## Frontend dev
```bash
npm run dev:frontend
```

## Build both
```bash
npm run build
```

## API Spec & Code Generation

- **Generate frontend API client from OpenAPI spec:**
  ```bash
  npm run generate:api
  ```
  *(Runs OpenAPI TypeScript codegen to create/update the frontend API client from `openapi.yaml`)*

## Frontend Testing

- **Run unit tests with Vitest:**
  ```bash
  npm run test
  ```

## Setup

- Make sure to install dependencies in both `frontend` and `backend` directories.
- API client generation and tests are run from the `frontend` directory.

## Useful Commands

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run generate:api` | Generate frontend API client from OpenAPI spec   |
| `npm run test`         | Run frontend unit tests with Vitest              |

## Notes

- API client is generated in `frontend/src/api/generated`.
- Tests are located in `frontend/src/__tests__` and `frontend/src/components/__tests__`.
- OpenAPI spec is located at `openapi.yaml` (or `specs/openapi.yaml`).
