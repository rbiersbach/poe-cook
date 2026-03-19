import { NoopLogger } from "logger";
import type { TradeFetchResponse, TradeSearchRequest, TradeSearchResponse } from "models/trade-types";
import { PoERequestQueue } from "services/poe-request-queue";
import { RateLimitedError, TradeClientService } from "services/trade-client-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";



describe("TradeClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockRateService: { getChaosValue: ReturnType<typeof vi.fn> };
  let client: TradeClientService;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    mockRateService = { getChaosValue: vi.fn((id: string) => id === "divine" ? 180 : 1) };
    client = new TradeClientService(mockRateService as any, "test-agent", NoopLogger, "https://www.pathofexile.com", undefined, new PoERequestQueue(10, 5000, 0));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("search", () => {
    it("sends correct POST request and returns response", async () => {
      const req: TradeSearchRequest = { /* minimal valid request */ } as any;
      const mockRes: TradeSearchResponse = { result: ["id1"], id: "q1" } as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRes,
        headers: new Map(),
      });
      const res = await client.search(req, "TestLeague");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/trade/search/TestLeague"),
        expect.objectContaining({ method: "POST" })
      );
      expect(res).toEqual(mockRes);
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "rate limited",
      });
      await expect(client.search({} as any, "TestLeague")).rejects.toThrow(/HTTP 403/);
    });
  });

  describe("fetchListings", () => {
    it("returns empty result for empty ids", async () => {
      const res = await client.fetchListings([], "q1");
      expect(res).toEqual({ result: [] });
      expect(mockFetch).not.toHaveBeenCalled();
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRes,
        headers: new Map(),
      });
      const res = await client.fetchListings(ids, "q1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/trade/fetch/id1%2Cid2?query=q1"),
        expect.objectContaining({ method: "GET" })
      );
      // fetchListings returns raw prices; normalization happens in searchAndFetch
      expect(res.result[0].listing.price!.currency).toBe("divine");
      expect(res.result[1].listing.price!.currency).toBe("chaos");
      expect(res.result[0].listing.normalized_price).toBeUndefined();
    });

    it("throws RateLimitedError on 429 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "rate limited",
        headers: new Map(),
      });
      const err = await client.fetchListings(["id1"], "q1").catch(e => e);
      expect(err).toBeInstanceOf(RateLimitedError);
      expect(err.message).toMatch(/Rate limited/);
    });

    it("throws RateLimitedError with retryAfter from state headers on 429", async () => {
      const headers = new Map([
        ["x-rate-limit-ip", "8:10:60"],
        ["x-rate-limit-ip-state", "8:10:45"],
      ]);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "rate limited",
        headers,
      });
      const err = await client.fetchListings(["id1"], "q1").catch(e => e);
      expect(err).toBeInstanceOf(RateLimitedError);
      expect((err as RateLimitedError).retryAfterSeconds).toBe(45);
    });

    it("throws RateLimitedError proactively when active restriction in response headers", async () => {
      const headers = new Map([
        ["x-rate-limit-ip", "8:10:60,15:60:120"],
        ["x-rate-limit-ip-state", "1:10:0,2:60:30"],
      ]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ result: [] }),
        headers,
      });
      const err = await client.fetchListings(["id1"], "q1").catch(e => e);
      expect(err).toBeInstanceOf(RateLimitedError);
      expect(err.message).toMatch(/30s/);
    });
  });

  describe("headers", () => {
    it("includes User-Agent and Accept headers", () => {
      const h = (client as any).headers();
      expect(h["User-Agent"]).toBe("test-agent");
      expect(h["Accept"]).toBe("application/json");
    });
    it("includes POESESSID cookie if set", () => {
      const c = new TradeClientService(mockRateService as any, "test-agent", NoopLogger, "https://www.pathofexile.com", "abc", new PoERequestQueue(10, 5000, 0));
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
      const mockFetchResponse: TradeFetchResponse = { result: [{ id: "id1", listing: {} }, { id: "id2", listing: {} }] } as any;

      // Mock search and fetchListings
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearch,
        headers: new Map(),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFetchResponse,
        headers: new Map(),
      });

      const res = await client.searchAndFetch(req, "TestLeague", 2);
      expect(res.search).toEqual(mockSearch);
      expect(res.listings).toEqual(mockFetchResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("normalises listing prices to chaos using TradeRateService", async () => {
      const customRateService = { getChaosValue: vi.fn((id: string) => id === "divine" ? 180 : 1) } as any;
      const clientWithRates = new TradeClientService(customRateService, "test-agent", NoopLogger, "https://www.pathofexile.com", undefined, new PoERequestQueue(10, 5000, 0));

      const mockSearch: TradeSearchResponse = { result: ["id1", "id2"], id: "q1" } as any;
      const mockFetchResponse: TradeFetchResponse = {
        result: [
          { id: "id1", listing: { price: { amount: 1, currency: "divine", type: "~b/o" } }, item: {} },
          { id: "id2", listing: { price: { amount: 10, currency: "chaos", type: "~b/o" } }, item: {} },
        ],
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockSearch, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockFetchResponse, headers: new Map() });

      const res = await clientWithRates.searchAndFetch({ query: {} } as any, "Standard", 2);
      expect(res.listings.result[0].listing.normalized_price?.amount).toBe(180); // 1 * 180
      expect(res.listings.result[0].listing.normalized_price?.currency).toBe("chaos");
      expect(res.listings.result[1].listing.normalized_price?.amount).toBe(10); // 10 * 1
      expect(res.listings.result[1].listing.normalized_price?.currency).toBe("chaos");
      expect(customRateService.getChaosValue).toHaveBeenCalledWith("divine", "Standard");
      expect(customRateService.getChaosValue).toHaveBeenCalledWith("chaos", "Standard");
    });

    it("propagates error from TradeRateService for unknown currency", async () => {
      const errorRateService = {
        getChaosValue: vi.fn(() => { throw new Error("Unknown currency"); }),
      } as any;
      const clientWithRates = new TradeClientService(errorRateService, "test-agent", NoopLogger, "https://www.pathofexile.com", undefined, new PoERequestQueue(10, 5000, 0));
      const mockSearch: TradeSearchResponse = { result: ["id1"], id: "q1" } as any;
      const mockFetchResponse: TradeFetchResponse = {
        result: [{ id: "id1", listing: { price: { amount: 1, currency: "mirror", type: "~b/o" } }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockSearch, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockFetchResponse, headers: new Map() });
      await expect(clientWithRates.searchAndFetch({ query: {} } as any, "Standard")).rejects.toThrow(
        /Unknown currency/
      );
    });
  });

  describe("travelToHideout", () => {
    it("calls the whisper endpoint with the hideout_token from the cheapest listing", async () => {
      const searchRes = { result: ["id1"], id: "q1", total: 1 };
      const fetchRes = {
        result: [{ id: "id1", listing: { hideout_token: "jwt-token-abc" }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fetchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => "", headers: new Map() });

      await client.travelToHideout({ query: {} } as any, "TestLeague");

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/trade/whisper"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "jwt-token-abc" }),
        })
      );
    });

    it("only fetches 1 listing (cheapest)", async () => {
      const searchRes = { result: ["id1", "id2", "id3"], id: "q1", total: 3 };
      const fetchRes = {
        result: [{ id: "id1", listing: { hideout_token: "token" }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fetchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => "", headers: new Map() });

      await client.travelToHideout({ query: {} } as any, "Standard");

      const listingsUrl: string = mockFetch.mock.calls[1][0];
      expect(listingsUrl).toContain("id1");
      expect(listingsUrl).not.toContain("id2");
    });

    it("throws if no listings are returned from the search", async () => {
      const searchRes = { result: [], id: "q1", total: 0 };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });

      await expect(client.travelToHideout({ query: {} } as any, "TestLeague"))
        .rejects.toThrow("No hideout token available for this listing");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("throws if the listing has no hideout_token", async () => {
      const searchRes = { result: ["id1"], id: "q1", total: 1 };
      const fetchRes = {
        result: [{ id: "id1", listing: { price: { amount: 5, currency: "chaos", type: "~b/o" } }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fetchRes, headers: new Map() });

      await expect(client.travelToHideout({ query: {} } as any, "TestLeague"))
        .rejects.toThrow("No hideout token available for this listing");
    });

    it("throws with a descriptive error if the whisper POST returns non-ok", async () => {
      const searchRes = { result: ["id1"], id: "q1", total: 1 };
      const fetchRes = {
        result: [{ id: "id1", listing: { hideout_token: "token" }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fetchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 403, statusText: "Forbidden", text: async () => "forbidden",
      });

      await expect(client.travelToHideout({ query: {} } as any, "TestLeague"))
        .rejects.toThrow(/Whisper request failed: HTTP 403/);
    });

    it("sends X-Requested-With and Content-Type headers to the whisper endpoint", async () => {
      const searchRes = { result: ["id1"], id: "q1", total: 1 };
      const fetchRes = {
        result: [{ id: "id1", listing: { hideout_token: "token" }, item: {} }],
      };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => searchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fetchRes, headers: new Map() });
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => "", headers: new Map() });

      await client.travelToHideout({ query: {} } as any, "Standard");

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });
});
