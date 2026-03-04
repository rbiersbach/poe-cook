import * as dotenv from "dotenv";
dotenv.config();

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
apiServerFull.server.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
