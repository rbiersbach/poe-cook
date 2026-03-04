import type { FastifyBaseLogger } from "fastify";
import { NinjaCategory, NinjaItem } from "../models/ninja-types";
import type { StoreRegistry } from "../stores/store-registry";
import type { INinjaClientService } from "./ninja-client-service";

export interface INinjaDataService {
    refresh(categories: NinjaCategory[], league: string): Promise<NinjaItem[]>;
    refreshAll(league: string, force?: boolean): Promise<NinjaItem[]>;
}

export class NinjaDataService implements INinjaDataService {
    constructor(
        private logger: FastifyBaseLogger,
        private ninjaClient: INinjaClientService,
        private registry: StoreRegistry
    ) { }

    /**
     * Refreshes ninja items for the given categories/types (e.g., ["Currency", "Fragment"]).
     * Fetches items from poe.ninja and persists them in the store.
     */
    async refresh(categories: NinjaCategory[], league: string): Promise<NinjaItem[]> {
        this.logger.info({ categories, league }, "Refreshing ninja items for categories");
        const ninjaItemStore = this.registry.getNinjaItemStore(league);
        let allItems: NinjaItem[] = [];
        for (const category of categories) {
            try {
                const items = await this.ninjaClient.fetchBulkItems(league, category);
                this.logger.info({ category, count: items.length }, "Fetched ninja items");
                ninjaItemStore.addMany(items);
                allItems = allItems.concat(items);

            } catch (err) {
                this.logger.error({ category, err }, "Failed to fetch or persist ninja items");
                throw err;
            }
        }
        return allItems;
    }

    /**
     * Refreshes ninja items for all categories defined in NinjaCategory.
     * Only refetches if any item is older than 1 hour, or if force is true.
     */
    async refreshAll(league: string, force = false): Promise<NinjaItem[]> {
        const categories = Object.values(NinjaCategory) as NinjaCategory[];
        const items = this.registry.getNinjaItemStore(league).getAll();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        let needsRefresh = force;
        if (!force) {
            needsRefresh = items.length === 0 || items.some(item => {
                if (!item.fetchedAt) return true;
                const fetched = Date.parse(item.fetchedAt);
                return isNaN(fetched) || (now - fetched > oneHour);
            });
        }
        if (needsRefresh) {
            this.logger.info({ force }, "Refreshing ninja items due to staleness or force");
            return this.refresh(categories, league);
        } else {
            this.logger.info("Ninja items are fresh; skipping refresh");
            return items;
        }
    }
}