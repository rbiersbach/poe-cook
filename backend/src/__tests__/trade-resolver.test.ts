import fs from "fs";
import path from "path";
import { ITradeClient } from "../trade-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlExtractor } from "../html-extractor";
import { ResolveItemError, TradeResolver } from "../trade-resolver";
import { TradeSearchRequest } from "../trade-types";

const exampleHtmlPath = path.join(__dirname, "./resources/trade_page.html");


vi.spyOn(HtmlExtractor, "fetchHtml").mockImplementation(async () => {
    return fs.readFileSync(exampleHtmlPath, "utf8");
});

// Mock extractJsonFromHtml to return all required fields for validation
vi.spyOn(HtmlExtractor, "extractJsonFromHtml").mockImplementation(() => ({
    tab: {},
    realm: "pc",
    realms: {},
    leagues: [],
    news: [],
    basePath: "/",
    league: "Sanctum",
    state: {
        name: "Mageblood",
        type: "Heavy Belt",
        status: "securable",
        stats: [{ type: "and" }],
        filters: undefined,
    },
}));

describe("TradeResolver", () => {
    let NoopLogger;
    let mockTradeClient: ITradeClient;
    let mockHtmlExtractor: HtmlExtractor;
    let resolver: TradeResolver;
    let listingsData: any;

    beforeEach(async () => {
        NoopLogger = (await import("../logger")).NoopLogger;
        listingsData = {
            result: [
                {
                    id: "id1",
                    item: {
                        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvSW5qZWN0b3JCZWx0IiwidyI6MiwiaCI6MSwic2NhbGUiOjF9XQ/21ec0269de/InjectorBelt.png",
                        name: "Mageblood"
                    },
                    listing: {
                        price: { amount: 90, currency: "divine" },
                        normalized_price: { amount: 16200, currency: "chaos" }
                    }
                },
                {
                    id: "id2",
                    item: {
                        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvSW5qZWN0b3JCZWx0IiwidyI6MiwiaCI6MSwic2NhbGUiOjF9XQ/21ec0269de/InjectorBelt.png",
                        name: "Mageblood"
                    },
                    listing: {
                        price: { amount: 93, currency: "divine" },
                        normalized_price: { amount: 16740, currency: "chaos" }
                    }
                },
                {
                    id: "id3",
                    item: {
                        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvSW5qZWN0b3JCZWx0IiwidyI6MiwiaCI6MSwic2NhbGUiOjF9XQ/21ec0269de/InjectorBelt.png",
                        name: "Mageblood"
                    },
                    listing: {
                        price: { amount: 93, currency: "divine" },
                        normalized_price: { amount: 16740, currency: "chaos" }
                    }
                },
                {
                    id: "id4",
                    item: {
                        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvSW5qZWN0b3JCZWx0IiwidyI6MiwiaCI6MSwic2NhbGUiOjF9XQ/21ec0269de/InjectorBelt.png",
                        name: "Mageblood"
                    },
                    listing: {
                        price: { amount: 93, currency: "divine" },
                        normalized_price: { amount: 16740, currency: "chaos" }
                    }
                },
                {
                    id: "id5",
                    item: {
                        icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQmVsdHMvSW5qZWN0b3JCZWx0IiwidyI6MiwiaCI6MSwic2NhbGUiOjF9XQ/21ec0269de/InjectorBelt.png",
                        name: "Mageblood"
                    },
                    listing: {
                        price: { amount: 95, currency: "divine" },
                        normalized_price: { amount: 17100, currency: "chaos" }
                    }
                }
            ]
        };
        mockTradeClient = {
            searchAndFetch: vi.fn(async () => ({
                search: { id: "mock-id", result: [], total: 0 },
                listings: listingsData
            })),
            search: vi.fn(async () => ({ id: "mock-id", result: [], total: 0 })),
            fetchListings: vi.fn(async () => ({ result: [] }))
        };
        resolver = new TradeResolver(NoopLogger, mockTradeClient, HtmlExtractor);
    });
    it("should normalize trade URL by adding https:// and www if missing", async () => {
        const tradeUrlNoProtocol = "pathofexile.com/trade";
        const tradeUrlNoWww = "https://pathofexile.com/trade";
        const poeSessid = "test-session-id";
        // Spy on fetchHtml to capture the URL used
        const fetchHtmlSpy = vi.spyOn(HtmlExtractor, "fetchHtml");
        await resolver.resolveTradeRequestFromUrl(tradeUrlNoProtocol, poeSessid);
        expect(fetchHtmlSpy).toHaveBeenCalledWith("https://www.pathofexile.com/trade", poeSessid);
        await resolver.resolveTradeRequestFromUrl(tradeUrlNoWww, poeSessid);
        expect(fetchHtmlSpy).toHaveBeenCalledWith("https://www.pathofexile.com/trade", poeSessid);
        fetchHtmlSpy.mockRestore();
    });

    it("should resolve item with relevant mock listings data", async () => {
        const tradeUrl = "https://www.pathofexile.com/trade";
        const poeSessid = "test-session-id";
        const result = await resolver.resolveItemFromUrl(tradeUrl, poeSessid);
        expect(result).toBeDefined();
        expect(result.resolved.iconUrl).toContain("InjectorBelt.png");
        expect(result.resolved.name).toBe("Mageblood");
        expect(result.resolved.minPrice.amount).toBe(16200);
        expect(result.resolved.minPrice.currency).toBe("chaos");
        expect(result.resolved.originalMinPrice.amount).toBe(90);
        expect(result.resolved.originalMinPrice.currency).toBe("divine");
        expect(result.resolved.medianPrice.amount).toBe(16740);
        expect(result.resolved.medianPrice.currency).toBe("chaos");
        expect(result.resolved.originalMedianPrice?.amount).toBe(93);
        expect(result.resolved.originalMedianPrice?.currency).toBe("divine");
        expect(result.resolved.medianCount).toBe(4);
        expect(typeof result.resolved.fetchedAt).toBe("string");
        expect(result.search).toBeDefined();
    });

    it("should resolve a TradeSearchRequest from a PoE trade page URL", async () => {
        const tradeRequest = await resolver.resolveTradeRequestFromUrl("https://www.pathofexile.com/trade", "test-session-id");
        expect(tradeRequest).toBeInstanceOf(TradeSearchRequest);
        expect(tradeRequest.query).toBeDefined();
        expect(tradeRequest.query.name).toBe("Mageblood");
        expect(tradeRequest.query.type).toBe("Heavy Belt");
        expect(tradeRequest.query.status?.option).toBe("securable");
        expect(tradeRequest.query.stats?.[0]?.type).toBe("and");
    });

    it("should throw ResolveItemError if no listings found", async () => {
        listingsData.result = [];
        const tradeUrl = "https://www.pathofexile.com/trade";
        const poeSessid = "test-session-id";
        await expect(resolver.resolveItemFromUrl(tradeUrl, poeSessid)).rejects.toThrowError(/No listings found/);
        await expect(resolver.resolveItemFromUrl(tradeUrl, poeSessid)).rejects.toThrowError(ResolveItemError);
    });

    it("should throw ResolveItemError if no valid normalized prices found", async () => {
        listingsData.result = [
            {
                id: "id1",
                item: { icon: "icon.png", name: "Test" },
                listing: { price: { amount: 1, currency: "divine" } } // missing normalized_price
            }
        ];
        const tradeUrl = "https://www.pathofexile.com/trade";
        const poeSessid = "test-session-id";
        await expect(resolver.resolveItemFromUrl(tradeUrl, poeSessid)).rejects.toThrowError(/No valid normalized prices/);
        await expect(resolver.resolveItemFromUrl(tradeUrl, poeSessid)).rejects.toThrowError(ResolveItemError);
    });
});
