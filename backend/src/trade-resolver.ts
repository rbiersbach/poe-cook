export interface ITradeResolver {
    resolveTradeRequestFromUrl(url: string, poeSessid: string): Promise<TradeSearchRequest>;
    resolveItemFromUrl(url: string, poeSessid: string): Promise<{ resolved: ResolvedMarketData; search: TradeSearchRequest; }>;
    resolveItemFromSearch(search: TradeSearchRequest, poeSessid: string): Promise<ResolvedMarketData>;
}
import { FastifyBaseLogger } from "fastify";
import { HtmlExtractor } from "html-extractor";
import type { ITradeClient } from "trade-client";
import { Price, ResolvedMarketData, TradeFilters, TradeQuery, TradeSearchRequest } from "trade-types";



export class ResolveItemError extends Error {
    constructor(message: string, public details?: unknown) {
        super(message);
        this.name = "ResolveItemError";
    }
}

export class TradeResolver implements ITradeResolver {
    constructor(
        private logger: FastifyBaseLogger,
        private tradeClient: ITradeClient,
        private htmlExtractor: typeof HtmlExtractor
    ) { }

    /**
     * Receives a Path of Exile trade page URL, fetches the HTML, extracts the JSON, validates it,
     * and returns a TradeSearchRequest object.
     */
    async resolveTradeRequestFromUrl(url: string, poeSessid: string): Promise<TradeSearchRequest> {
        try {
            // Normalize URL: add https:// and www if missing
            let normalizedUrl = url.trim();
            if (!/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = "https://" + normalizedUrl;
            }
            // Always ensure 'www.' after protocol
            normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)(?!www\.)/, "$1www.");
            this.logger.info({ url: normalizedUrl }, "Fetching HTML from URL");
            const html = await this.htmlExtractor.fetchHtml(normalizedUrl, poeSessid);
            this.logger.info({ url: normalizedUrl }, "HTML fetched, extracting JSON");
            const json = this.htmlExtractor.extractJsonFromHtml(html);
            this.logger.info({ url: normalizedUrl }, "JSON extracted, validating");
            this.htmlExtractor.validateExtractedJson(json);
            this.logger.info({ url: normalizedUrl }, "JSON validated, mapping to TradeSearchRequest");

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
            this.logger.error({ error, url }, "Failed to resolve TradeSearchRequest");
            throw new Error(`Failed to resolve TradeSearchRequest from URL: ${url} - ${(error as Error).message}`);
        }
    }

    /**
     * Resolves a trade item from a tradeUrl, returning enriched market data.
     */
    async resolveItemFromUrl(tradeUrl: string, poeSessid: string): Promise<{ resolved: ResolvedMarketData, search: TradeSearchRequest }> {
        const searchRequest = await this.resolveTradeRequestFromUrl(tradeUrl, poeSessid);
        const resolved = await this.resolveItemFromSearch(searchRequest, poeSessid);
        return { resolved, search: searchRequest };
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
        let name = "Unknown";
        for (const result of listings.result) {
            if (result.item && result.item.icon) {
                iconUrl = result.item.icon;
            }
            // Prefer to update name if both name and type are present in result.item
            if (result.item && (result.item.name || result.item.type || result.item.baseType)) {
                const resName = typeof result.item.name === "string" ? result.item.name : "";
                const resType = typeof result.item.type === "string" ? result.item.type : "";
                const resBaseType = typeof result.item.baseType === "string" ? result.item.baseType : "";
                const resTypeOrBase = resType || resBaseType;
                if (resName && resTypeOrBase) {
                    name = `${resName} ${resTypeOrBase}`;
                } else if (resName) {
                    name = resName;
                } else if (resTypeOrBase) {
                    name = resTypeOrBase;
                }
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

