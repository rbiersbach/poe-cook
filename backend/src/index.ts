import { TradeApiServer } from "api/api";
import { NinjaClientService } from "services/ninja-client-service";
import { NinjaDataService } from "services/ninja-data-service";
import { NinjaItemStore } from "stores/ninja-item-store";



const ninjaItemStore = new NinjaItemStore();
const apiServer = new TradeApiServer(undefined, undefined, undefined, ninjaItemStore);
const league = "Standard";

// Instantiate and refresh all ninja items on server start
const ninjaClient = new NinjaClientService(apiServer.server.log);

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
