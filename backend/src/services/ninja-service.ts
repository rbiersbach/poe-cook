import axios from "axios";
import type { FastifyBaseLogger } from "fastify";
import type { BulkItem } from "../models/bulk-item-types";
import type { NinjaCoreItem, NinjaCurrencyLine, NinjaCurrencyOverviewResponse } from "../models/ninja-currency-response";

const BASE_URL = "https://poe.ninja/poe1/api/economy/exchange/current/overview";


export class NinjaService {
    constructor(private logger: FastifyBaseLogger) { }

    private async fetchNinjaCurrencyOverview(league: string = "Standard", type: string = "Currency"): Promise<NinjaCurrencyOverviewResponse> {
        const url = `${BASE_URL}?league=${encodeURIComponent(league)}&type=${encodeURIComponent(type)}`;
        this.logger.info({ url, league, type }, "Fetching ninja currency overview");
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
            }
        });
        return res.data;
    }

    private mergeToBulkItem(item: NinjaCoreItem, line: NinjaCurrencyLine): BulkItem {
        return {
            id: item.id,
            name: item.name,
            icon: item.image,
            category: item.category,
            detailsId: item.detailsId,
            price: line.primaryValue,
            priceHistory: line.sparkline?.data || [],
            volume: line.volumePrimaryValue,
            maxVolumeCurrency: line.maxVolumeCurrency,
            maxVolumeRate: line.maxVolumeRate,
        };
    }

    async fetchBulkItems(league: string = "Standard", type: string = "Currency"): Promise<BulkItem[]> {
        const data = await this.fetchNinjaCurrencyOverview(league, type);
        const itemMap = new Map<string, NinjaCoreItem>(data.items.map((i: NinjaCoreItem) => [i.id, i]));
        return data.lines.map((line: NinjaCurrencyLine) => {
            const item = itemMap.get(line.id);
            if (!item) {
                this.logger.error({ lineId: line.id }, "No matching item found for line");
                throw new Error(`No matching item found for line with id: ${line.id}`);
            }
            return this.mergeToBulkItem(item, line);
        });
    }
}
