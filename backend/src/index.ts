import { TradeApiServer } from "api";
import { HtmlExtractor } from "html-extractor";
import { NoopLogger } from "logger";
import { TradeClient } from "trade-client";
import { TradeResolver } from "trade-resolver";



const apiServer = new TradeApiServer();

// Start the API server
apiServer.server.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

async function runResolverWithExample() {
  // Use real TradeClient and HtmlExtractor
  const tradeClient = new TradeClient(
    "poe-tools-api/1.0 (contact: support@example.com)", // userAgent
    "Keepers", // league
    apiServer.server.log // logger
  );
  const resolver = new TradeResolver(NoopLogger, tradeClient, HtmlExtractor);
  const tradeUrl = "https://www.pathofexile.com/trade/search/Keepers/Z6KmYGb8CQ";
  const poeSessid = "example-session-id";
  try {
    const result = await resolver.resolveItemFromUrl(tradeUrl, poeSessid);
    console.log("ResolvedMarketData result:", result);
  } catch (err) {
    console.error("Error resolving item:", err);
  }
}

// Run the test function if this file is executed directly

await runResolverWithExample().catch(console.error);
