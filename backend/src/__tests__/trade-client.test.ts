import { describe, it, expect, vi, beforeEach } from "vitest";
import { TradeClient } from "trade-client";
import { NoopLogger } from "logger";
import type { TradeSearchRequest, TradeSearchResponse, TradeFetchResponse } from "trade-types";



describe("TradeClient", () => {
  let fetchImpl: ReturnType<typeof vi.fn>;
  let client: TradeClient;

  beforeEach(() => {
    fetchImpl = vi.fn();
    client = new TradeClient("test-agent", "TestLeague", NoopLogger, "https://www.pathofexile.com", undefined, fetchImpl as any);
  });

  describe("search", () => {
    it("sends correct POST request and returns response", async () => {
      const req: TradeSearchRequest = { /* minimal valid request */ } as any;
      const mockRes: TradeSearchResponse = { result: ["id1"], id: "q1" } as any;
      fetchImpl.mockResolvedValue({
        ok: true,
        json: async () => mockRes,
        headers: new Map(),
      });
      const res = await client.search(req);
      expect(fetchImpl).toHaveBeenCalledWith(
        expect.stringContaining("/api/trade/search/TestLeague"),
        expect.objectContaining({ method: "POST" })
      );
      expect(res).toEqual(mockRes);
    });

    it("throws on non-ok response", async () => {
      fetchImpl.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "rate limited",
      });
      await expect(client.search({} as any)).rejects.toThrow(/HTTP 403/);
    });
  });

  describe("fetchListings", () => {
    it("returns empty result for empty ids", async () => {
      const res = await client.fetchListings([], "q1");
      expect(res).toEqual({ result: [] });
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("sends correct GET request and returns response", async () => {
      const ids = ["id1", "id2"];
      const mockRes: TradeFetchResponse = {
        result: [
          {
            id: "id1",
            listing: {
              price: {
                amount: 1,
                currency: "divine",
                type: "~b/o",
              },
            },
            item: {}, // not relevant for this test
          },
          {
            id: "id2",
            listing: {
              price: {
                amount: 10,
                currency: "chaos",
                type: "~b/o",
              },
            },
            item: {}, // not relevant for this test
          },
        ],
      };
      fetchImpl.mockResolvedValue({
        ok: true,
        json: async () => mockRes,
        headers: new Map(),
      });
      const res = await client.fetchListings(ids, "q1");
      expect(fetchImpl).toHaveBeenCalledWith(
        expect.stringContaining("/api/trade/fetch/id1%2Cid2?query=q1"),
        expect.objectContaining({ method: "GET" })
      );
      // Check normalized fields
      expect(res.result[0].listing.normalized_price?.amount).toBe(180); // 1 divine = 180 chaos
      expect(res.result[0].listing.normalized_price?.currency).toBe("chaos");
      expect(res.result[1].listing.normalized_price?.amount).toBe(10); // 10 chaos = 10 chaos
      expect(res.result[1].listing.normalized_price?.currency).toBe("chaos");
    });

    it("throws on non-ok response", async () => {
      fetchImpl.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "rate limited",
      });
      await expect(client.fetchListings(["id1"], "q1")).rejects.toThrow(/HTTP 429/);
    });
  });

  describe("headers", () => {
    it("includes User-Agent and Accept headers", () => {
      const h = (client as any).headers();
      expect(h["User-Agent"]).toBe("test-agent");
      expect(h["Accept"]).toBe("application/json");
    });
    it("includes POESESSID cookie if set", () => {
      const c = new TradeClient("test-agent", "TestLeague", NoopLogger, "https://www.pathofexile.com", "abc", fetchImpl as any);
      const h = (c as any).headers();
      expect(h["Cookie"]).toMatch(/POESESSID=abc/);
    });
    it("merges extra headers", () => {
      const h = (client as any).headers({ Foo: "Bar" });
      expect(h["Foo"]).toBe("Bar");
    });
  });

  describe("searchAndFetch", () => {
    it("combines search and fetch and returns both", async () => {
      const req: TradeSearchRequest = { query: {} } as any;
      const mockSearch: TradeSearchResponse = { result: ["id1", "id2"], id: "q1" } as any;
      const mockFetch: TradeFetchResponse = { result: [{ id: "id1", listing: {} }, { id: "id2", listing: {} }] } as any;

      // Mock search and fetchListings
      fetchImpl.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearch,
        headers: new Map(),
      });
      fetchImpl.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFetch,
        headers: new Map(),
      });

      const res = await client.searchAndFetch(req, 2);
      expect(res.search).toEqual(mockSearch);
      expect(res.listings).toEqual(mockFetch);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });
});
