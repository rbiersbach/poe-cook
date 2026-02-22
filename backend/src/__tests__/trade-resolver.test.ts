import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { TradeResolver } from "../trade-resolver";
import { HtmlExtractor } from "../html-extractor";
import { TradeSearchRequest } from "../trade-types";

const exampleHtmlPath = path.join(__dirname, "./resources/trade_page.html");

// Mock HtmlExtractor.fetchHtml to return the example HTML
vi.spyOn(HtmlExtractor, "fetchHtml").mockImplementation(async () => {
    return fs.readFileSync(exampleHtmlPath, "utf8");
});

describe("TradeResolver", () => {
    let NoopLogger;
    let mockTradeClient;
    let mockHtmlExtractor;
    let resolver;
    let listingsData;

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
            searchAndFetch: vi.fn(async () => ({ search: {}, listings: listingsData })),
            search: vi.fn(async () => ({ result: [], id: "mock-id" })),
            fetchListings: vi.fn(async () => ({ result: [] }))
        };
        mockHtmlExtractor = {
            fetchHtml: vi.fn(async () => "<html></html>"),
            extractJsonFromHtml: vi.fn(() => ({ state: { name: "Mageblood", type: "Heavy Belt", status: "securable", stats: [{ type: "and" }] } })),
            validateExtractedJson: vi.fn(() => { }),
        };
        resolver = new TradeResolver(NoopLogger, mockTradeClient, mockHtmlExtractor);
    });

    it("should resolve item with relevant mock listings data", async () => {
        const request = { tradeUrl: "https://www.pathofexile.com/trade" };
        const poeSessid = "test-session-id";
        const result = await resolver.resolveItem(request, poeSessid);
        expect(result).toBeDefined();
        expect(result.iconUrl).toContain("InjectorBelt.png");
        expect(result.name).toBe("Mageblood");
        expect(result.minPrice.amount).toBe(16200);
        expect(result.minPrice.currency).toBe("chaos");
        expect(result.originalMinPrice.amount).toBe(90);
        expect(result.originalMinPrice.currency).toBe("divine");
        expect(result.medianPrice.amount).toBe(16740);
        expect(result.medianPrice.currency).toBe("chaos");
        expect(result.originalMedianPrice?.amount).toBe(93);
        expect(result.originalMedianPrice?.currency).toBe("divine");
        expect(result.medianCount).toBe(4);
        expect(typeof result.fetchedAt).toBe("string");
        // Add checks for any new properties here
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
});
