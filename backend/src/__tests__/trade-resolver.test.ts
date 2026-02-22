import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { TradeResolver } from "../trade-resolver";
import * as htmlExtract from "../html-extract";
import { TradeSearchRequest } from "../trade-types";

const exampleHtmlPath = path.join(__dirname, "./resources/example.html");

// Mock fetchHtml to return the example HTML
vi.spyOn(htmlExtract, "fetchHtml").mockImplementation(async () => {
    return fs.readFileSync(exampleHtmlPath, "utf8");
});

describe("TradeResolver", () => {
    it("should resolve a TradeSearchRequest from a PoE trade page URL", async () => {
        const { NoopLogger } = await import("logger");
        const resolver = new TradeResolver(NoopLogger);
        const tradeRequest = await resolver.resolveTradeRequestFromUrl("https://www.pathofexile.com/trade");
        expect(tradeRequest).toBeInstanceOf(TradeSearchRequest);
        expect(tradeRequest.query).toBeDefined();
        expect(tradeRequest.query.name).toBe("Mageblood");
        expect(tradeRequest.query.type).toBe("Heavy Belt");
        expect(tradeRequest.query.status?.option).toBe("securable");
        expect(tradeRequest.query.stats?.[0]?.type).toBe("and");
    });
});
