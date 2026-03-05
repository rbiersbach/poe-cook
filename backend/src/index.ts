import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env from the project root (two levels up from backend/src/)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { TradeApiServer } from "api/api";
import { LeagueService } from "services/league-service";
import { NinjaClientService } from "services/ninja-client-service";
import { NinjaDataService } from "services/ninja-data-service";
import { NinjaScheduler } from "services/ninja-scheduler";
import { TradeRateService } from "services/trade-rate-service";
import { StoreRegistry } from "stores/store-registry";

const poeSessId = process.env.POE_SESSID;

const registry = new StoreRegistry();

const apiServer = new TradeApiServer(
  undefined,
  undefined,
  undefined,
  registry,
);

const ninjaClient = new NinjaClientService(apiServer.server.log);
const ninjaDataService = new NinjaDataService(apiServer.server.log, ninjaClient, registry);
const leagueService = new LeagueService(apiServer.server.log);
const ninjaScheduler = new NinjaScheduler(ninjaDataService, apiServer.server.log);
const tradeRateService = new TradeRateService(registry, apiServer.server.log);

// Re-wire services that need ninjaDataService/scheduler
// (Achieved by passing into the TradeApiServer constructor below)
const apiServerFull = new TradeApiServer(
  undefined,
  undefined,
  undefined,
  registry,
  leagueService,
  ninjaScheduler,
  tradeRateService,
  poeSessId,
);

ninjaScheduler.start();

// Start the API server
// host '0.0.0.0' is required in Docker so other containers (nginx) can reach the server;
// on localhost Fastify would default to 127.0.0.1 which is unreachable across containers.
apiServerFull.server.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
