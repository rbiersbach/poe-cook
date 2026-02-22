import { ResolveItemRequest, ResolvedMarketData, Price } from "./trade-types";

import { HtmlExtractor } from "./html-extractor";
import { TradeSearchRequest, TradeQuery, TradeStatGroup, TradeFilters } from "./trade-types";
import { LoggerLike, NoopLogger } from "./logger";
import { TradeClient } from "./trade-client";


export class TradeResolver {
    constructor(
        private logger: LoggerLike,
        private tradeClient: TradeClient,
        private htmlExtractor: typeof HtmlExtractor
    ) { }

    /**
     * Receives a Path of Exile trade page URL, fetches the HTML, extracts the JSON, validates it,
     * and returns a TradeSearchRequest object.
     */
    async resolveTradeRequestFromUrl(url: string, poeSessid: string): Promise<TradeSearchRequest> {
        try {
            this.logger.info("Fetching HTML from URL", { url });
            const html = await this.htmlExtractor.fetchHtml(url, poeSessid);
            this.logger.info("HTML fetched, extracting JSON", { url });
            const json = this.htmlExtractor.extractJsonFromHtml(html);
            this.logger.info("JSON extracted, validating", { url });
            this.htmlExtractor.validateExtractedJson(json);
            this.logger.info("JSON validated, mapping to TradeSearchRequest", { url });

            // Map the extracted JSON to TradeSearchRequest
            const query: TradeQuery = new TradeQuery({
                status: json.state?.status ? { option: json.state.status } : undefined,
                name: json.state?.name,
                type: json.state?.type,
                stats: json.state?.stats,
                filters: json.state?.filters ? new TradeFilters(json.state.filters) : undefined,
            });

            this.logger.info("TradeSearchRequest created successfully", { url });
            return new TradeSearchRequest({ query });
        } catch (error) {
            this.logger.error({ error, url }, "Failed to resolve TradeSearchRequest");
            throw new Error(`Failed to resolve TradeSearchRequest from URL: ${url} - ${(error as Error).message}`);
        }
    }

    /**
    * Resolves a trade item from a tradeUrl or fallback price, returning enriched market data.
    * Throws on error, returns ResolvedMarketData on success.
    */
    async resolveItem(request: ResolveItemRequest, poeSessid: string): Promise<ResolvedMarketData> {
        this.logger.info("Resolving item", { request });
        const searchRequest: TradeSearchRequest = await this.resolveTradeRequestFromUrl(request.tradeUrl!, poeSessid);
        // Use combined search and fetch
        const { search, listings } = await this.tradeClient.searchAndFetch(searchRequest, 10);

        if (!listings || !listings.result || listings.result.length === 0) {
            this.logger.warn("No listings found", { request });
            throw new Error("No listings found for item resolution");
        }

        // Extract icon, name, normalized prices
        type NormalizedPrice = { original: Price, normalized_price: number };
        const prices: NormalizedPrice[] = [];
        let iconUrl = "";
        let name = searchRequest.query.name || "Unknown";
        for (const result of listings.result) {
            if (result.item && result.item.icon) {
                iconUrl = result.item.icon;
            }
            if (result.item && result.item.name) {
                name = result.item.name;
            }
            if (result.listing && result.listing.normalized_price && result.listing.price) {
                const price = result.listing.price;
                const normalized_price = result.listing.normalized_price;

                prices.push({ original: price, normalized_price: normalized_price.amount });
            }
        }

        // Calculate minPrice, medianPrice, medianCount using normalized_price
        prices.sort((a, b) => a.normalized_price - b.normalized_price);
        const originalMinPrice = prices.length > 0 ? prices[0].original : undefined;
        const minPriceAmount = prices.length > 0 ? prices[0].normalized_price : undefined;
        const medianIdx = Math.floor(prices.length / 2);
        const medianPriceAmount = prices.length > 0 ? prices[medianIdx].normalized_price : undefined;
        const originalMedianPrice = prices.length > 0 ? prices[medianIdx].original : undefined;
        const medianNormalized = prices.length > 0 ? prices[medianIdx].normalized_price : undefined;
        const medianCount = medianNormalized ? prices.filter(p => p.normalized_price <= medianNormalized).length : undefined;

        const fetchedAt = new Date().toISOString();

        if (!minPriceAmount || !medianPriceAmount) {
            this.logger.error({ prices }, "No valid normalized prices found");
            throw new Error("No valid normalized prices found for item resolution");
        }

        const minPrice: Price = {
            amount: minPriceAmount!,
            currency: "chaos",
        };
        const medianPrice: Price = {
            amount: medianPriceAmount!,
            currency: "chaos",
        };

        return new ResolvedMarketData({
            iconUrl,
            name,
            originalMinPrice,
            minPrice,
            originalMedianPrice,
            medianPrice,
            medianCount,
            fetchedAt,
        });
    }
}
