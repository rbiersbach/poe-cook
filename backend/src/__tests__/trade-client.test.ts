
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TradeClient, TradeClientOptions } from "../trade-client";
import type { TradeSearchRequest, TradeSearchResponse, TradeFetchResponse } from "../trade-types";

const baseOpts: TradeClientOptions = {
  userAgent: "test-agent",
  league: "TestLeague",
};

describe("TradeClient", () => {
  let fetchImpl: ReturnType<typeof vi.fn>;
  let client: TradeClient;

  beforeEach(() => {
    fetchImpl = vi.fn();
    client = new TradeClient({ ...baseOpts, fetchImpl: fetchImpl as any });
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
      const mockRes: TradeFetchResponse = { result: [{ id: "id1" }] } as any;
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
      expect(res).toEqual(mockRes);
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
      const c = new TradeClient({ ...baseOpts, poeSessId: "abc", fetchImpl: fetchImpl as any });
      const h = (c as any).headers();
      expect(h["Cookie"]).toMatch(/POESESSID=abc/);
    });
    it("merges extra headers", () => {
      const h = (client as any).headers({ Foo: "Bar" });
      expect(h["Foo"]).toBe("Bar");
    });
  });
});
