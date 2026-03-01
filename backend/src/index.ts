import { TradeApiServer } from "api/api";
import { NoopLogger } from "logger";
import { HtmlExtractorService } from "services/html-extractor-service";
import { NinjaClientService } from "services/ninja-client-service";
import { NinjaDataService } from "services/ninja-data-service";
import { TradeClientService } from "services/trade-client-service";
import { TradeResolverService } from "services/trade-resolver-service";
import { NinjaItemStore } from "stores/ninja-item-store";



const apiServer = new TradeApiServer();
const league = "Keepers";

// Instantiate and refresh all ninja items on server start
const ninjaClient = new NinjaClientService(apiServer.server.log);
const ninjaItemStore = new NinjaItemStore();
const ninjaDataService = new NinjaDataService(apiServer.server.log, ninjaClient, ninjaItemStore);
ninjaDataService.refreshAll(league).then(() => {
  apiServer.server.log.info("Ninja items refreshed on startup");
}).catch((err) => {
  apiServer.server.log.error({ err }, "Failed to refresh ninja items on startup");
});

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
  const tradeClient = new TradeClientService(
    "poe-tools-api/1.0 (contact: support@example.com)",
    league,
    apiServer.server.log
  );
  const resolver = new TradeResolverService(NoopLogger, tradeClient, HtmlExtractorService);
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
