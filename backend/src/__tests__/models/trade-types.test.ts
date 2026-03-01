import { describe, expect, it } from "vitest";
import { TradeSearchRequest } from "../../models/trade-types";


describe("TradeSearchRequest serialization", () => {
    it("should serialize to expected dictionary with defaults including query.status", () => {
        const req = new TradeSearchRequest();
        const dict = JSON.parse(JSON.stringify(req));
        expect(dict).toEqual({ sort: { price: "asc" }, query: { status: { option: "securable" } } });
    });
});


