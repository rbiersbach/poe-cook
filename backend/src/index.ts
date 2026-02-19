// example.ts
import { TradeClient } from "./trade-client";
import { TradeSearchRequest } from "./trade-types";

async function main() {
  const client = new TradeClient({
    userAgent: "my-poe-tool/0.1 (contact: you@example.com)", // set a descriptive User-Agent
    // poeSessId: process.env.POESESSID, // optional
  });

  const league = "Phrecia 2.0"; // change to current league

  const req: TradeSearchRequest = {
    query: {
      term: "Headhunter",
      filters: {
        trade_filters: {
          filters: {
            price: {  max: 15000 },
          },
        },
      },
    },
    sort: { price: "asc" },
  };

  const search = await client.search(league, req);
  console.log("query id:", search.id, "total:", search.total);

  const first10 = search.result.slice(0, 10);
  const fetched = await client.fetchListings(first10, search.id);

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
