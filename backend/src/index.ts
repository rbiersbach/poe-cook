
import fastify from "api";
import { TradeResolver } from "trade-resolver";
import tradeClient from "trade-client";


const resolver = new TradeResolver(fastify.log);
resolver.resolveTradeRequestFromUrl(
  "https://www.pathofexile.com/trade/search/Keepers/Z6KmYGb8CQ",
  "example-session-id"
)
  .then(async (req) => {
    try {
      const result = await tradeClient.search(req);
      console.log("Trade search results:", result);
      if (result.result && result.result.length > 0) {
        const ids = result.result.slice(0, 10);
        const fetched = await tradeClient.fetchListings(ids, result.id);
        console.log("Fetched listings:", fetched);
      }
    } catch (err) {
      console.error("Error executing trade search:", err);
    }
  })
  .catch((err) => {
    console.error("Error resolving trade request:", err);
  });

// Start the API server
fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
