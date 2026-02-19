import tradeClient from "trade-client";
import fastify from "api";
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

// Start the API server
fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
