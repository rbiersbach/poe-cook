import { FastifyBaseLogger } from "fastify";
import type { StoreRegistry } from "stores/store-registry";

export interface ITradeRateService {
    /**
     * Returns a map of NinjaItem.id → chaos value for all known currencies in the given league.
     * Always includes `chaos: 1` as the baseline.
     */
    getRatesMap(league: string): Record<string, number>;

    /**
     * Converts an amount in the given currency (identified by NinjaItem.id, e.g. "divine")
     * to its chaos equivalent. Throws if the currency is unknown.
     */
    getChaosValue(id: string, league: string): number;
}

export class TradeRateService implements ITradeRateService {
    constructor(
        private registry: StoreRegistry,
        private logger: FastifyBaseLogger
    ) { }

    getRatesMap(league: string): Record<string, number> {
        const rates: Record<string, number> = { chaos: 1 };
        const store = this.registry.getExchangeRateStore(league);
        for (const rate of store.getAll()) {
            rates[rate.id] = rate.chaosValue;
        }
        return rates;
    }

    getChaosValue(id: string, league: string): number {
        if (id === "chaos") return 1;
        const rate = this.registry.getExchangeRateStore(league).get(id);
        if (!rate) {
            this.logger.error({ id, league }, "Unknown currency id, cannot normalise to chaos");
            throw new Error(`Unknown currency "${id}" for league "${league}": no exchange rate available`);
        }
        return rate.chaosValue;
    }
}
