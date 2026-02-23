import { ResolveItemRequest, ResolvedMarketData, Price } from "trade-types";
import { HtmlExtractor } from "html-extractor";
import { TradeSearchRequest, TradeQuery, TradeStatGroup, TradeFilters } from "trade-types";
import { FastifyBaseLogger } from "fastify";
import { TradeClient } from "trade-client";


export class ResolveItemError extends Error {
    constructor(message: string, public details?: unknown) {
        super(message);
        this.name = "ResolveItemError";
    }
}
export class TradeResolver {
    constructor(
        private logger: FastifyBaseLogger,
        private tradeClient: TradeClient,
        private htmlExtractor: typeof HtmlExtractor
    ) { }

    /**
     * Receives a Path of Exile trade page URL, fetches the HTML, extracts the JSON, validates it,
     * and returns a TradeSearchRequest object.
     */
    async resolveTradeRequestFromUrl(url: string, poeSessid: string): Promise<TradeSearchRequest> {
        try {
            this.logger.info({ url }, "Fetching HTML from URL");
            const html = await this.htmlExtractor.fetchHtml(url, poeSessid);
            this.logger.info({ url }, "HTML fetched, extracting JSON");
            const json = this.htmlExtractor.extractJsonFromHtml(html);
            this.logger.info({ url }, "JSON extracted, validating");
            this.htmlExtractor.validateExtractedJson(json);
            this.logger.info({ url }, "JSON validated, mapping to TradeSearchRequest");

            // Map the extracted JSON to TradeSearchRequest
            const query: TradeQuery = new TradeQuery({
                status: json.state?.status ? { option: json.state.status } : undefined,
                name: json.state?.name,
                type: json.state?.type,
                stats: json.state?.stats,
                filters: json.state?.filters ? new TradeFilters(json.state.filters) : undefined,
            });

            this.logger.info({ url }, "TradeSearchRequest created successfully");
            return new TradeSearchRequest({ query });
        } catch (error) {
            this.logger.error("Failed to resolve TradeSearchRequest", { error, url });
            throw new Error(`Failed to resolve TradeSearchRequest from URL: ${url} - ${(error as Error).message}`);
        }
    }

    /**
     * Resolves a trade item from a tradeUrl, returning enriched market data.
     */
    async resolveItemFromUrl(tradeUrl: string, poeSessid: string): Promise<ResolvedMarketData> {
        const searchRequest = await this.resolveTradeRequestFromUrl(tradeUrl, poeSessid);
        return this.resolveItemFromSearch(searchRequest, poeSessid);
    }

    /**
     * Resolves a trade item from a TradeSearchRequest, returning enriched market data.
     */
    async resolveItemFromSearch(searchRequest: TradeSearchRequest, poeSessid: string): Promise<ResolvedMarketData> {
        this.logger.info({ searchRequest }, "Resolving item from search");
        // Use combined search and fetch
        const { search, listings } = await this.tradeClient.searchAndFetch(searchRequest, 10);

        if (!listings || !listings.result || listings.result.length === 0) {
            this.logger.warn({ searchRequest }, "No listings found");
            throw new ResolveItemError("No listings found for item resolution", { searchRequest });
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
            this.logger.error("No valid normalized prices found", { prices });
            throw new ResolveItemError("No valid normalized prices found for item resolution", { prices });
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

