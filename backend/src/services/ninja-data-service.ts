import type { FastifyBaseLogger } from "fastify";
import { NinjaCategory, NinjaItem } from "../models/ninja-types";
import type { INinjaItemStore } from "../stores/ninja-item-store";
import type { INinjaClientService } from "./ninja-client-service";

export interface INinjaDataService {
    refresh(categories: NinjaCategory[], league?: string): Promise<NinjaItem[]>;
    refreshAll(league?: string): Promise<NinjaItem[]>;
}

export class NinjaDataService implements INinjaDataService {
    constructor(
        private logger: FastifyBaseLogger,
        private ninjaClient: INinjaClientService,
        private ninjaItemStore: INinjaItemStore
    ) { }

    /**
     * Refreshes ninja items for the given categories/types (e.g., ["Currency", "Fragment"]).
     * Fetches items from poe.ninja and persists them in the store.
     */
    async refresh(categories: NinjaCategory[], league: string = "Standard"): Promise<NinjaItem[]> {
        this.logger.info({ categories, league }, "Refreshing ninja items for categories");
        let allItems: NinjaItem[] = [];
        for (const category of categories) {
            try {
                const items = await this.ninjaClient.fetchBulkItems(league, category);
                this.logger.info({ category, count: items.length }, "Fetched ninja items");
                this.ninjaItemStore.addMany(items);
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
     */
    async refreshAll(league: string = "Standard"): Promise<NinjaItem[]> {
        const categories = Object.values(NinjaCategory) as NinjaCategory[];
        return this.refresh(categories, league);
    }
}