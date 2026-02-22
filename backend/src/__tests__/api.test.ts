import { vi } from "vitest";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { TradeApiServer } from "../api";
import { NoopLogger } from "../logger";
import { TradeClient } from "trade-client";


let tradeClientMock: TradeClient;
let apiServer: TradeApiServer;

beforeAll(async () => {
    tradeClientMock = {
        search: vi.fn(),
        fetchListings: vi.fn(),
        logger: NoopLogger,
    } as unknown as TradeClient;
    apiServer = new TradeApiServer(tradeClientMock);
    await apiServer.server.listen({ port: 0 });

});

afterAll(async () => {
    await apiServer.server.close();
});



describe("POST /api/trade-search", () => {
    it("returns simplified results for a valid request", async () => {
        const mockSearch = tradeClientMock.search as unknown as ReturnType<typeof vi.fn>;
        const mockFetchListings = tradeClientMock.fetchListings as unknown as ReturnType<typeof vi.fn>;

        mockSearch.mockResolvedValueOnce({
            result: ["id1", "id2"],
            id: "query123",
        });
        mockFetchListings.mockResolvedValueOnce({
            result: [
                { id: "id1", listing: { price: { amount: 100, currency: "chaos", type: "~price" } } },
                { id: "id2", listing: { price: { amount: 200, currency: "divine", type: "~b/o" } } },
            ],
        });

        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({
                query: { term: "Headhunter" },
                sort: { price: "asc" },
            })
            .expect(200);

        expect(response.body.result).toEqual([
            { id: "id1", price: "100 chaos (~price)" },
            { id: "id2", price: "200 divine (~b/o)" },
        ]);
    });

    it("returns 400 for invalid request", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({})
            .expect(400);

        expect(response.body.error).toBe("Invalid TradeSearchRequest");
    });

    it("returns 500 if tradeClient.search throws", async () => {
        const mockSearch = tradeClientMock.search as unknown as ReturnType<typeof vi.fn>;
        mockSearch.mockRejectedValueOnce(new Error("External API error"));

        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({ query: { term: "Headhunter" }, sort: { price: "asc" } })
            .expect(500);

        expect(response.body.error).toBe("Server error");
    });

    it("returns 500 if tradeClient.fetchListings throws", async () => {
        const mockSearch = tradeClientMock.search as unknown as ReturnType<typeof vi.fn>;
        const mockFetchListings = tradeClientMock.fetchListings as unknown as ReturnType<typeof vi.fn>;
        mockSearch.mockResolvedValueOnce({ result: ["id1"], id: "query999" });
        mockFetchListings.mockRejectedValueOnce(new Error("Fetch failed"));

        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({ query: { term: "Headhunter" }, sort: { price: "asc" } })
            .expect(500);

        expect(response.body.error).toBe("Server error");
    });

    it("returns empty results if no listings found", async () => {
        const mockSearch = tradeClientMock.search as unknown as ReturnType<typeof vi.fn>;
        const mockFetchListings = tradeClientMock.fetchListings as unknown as ReturnType<typeof vi.fn>;

        mockSearch.mockResolvedValueOnce({ result: [], id: "query123" });
        mockFetchListings.mockResolvedValueOnce({ result: [] });

        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({ query: { term: "Nothing" }, sort: { price: "asc" } })
            .expect(200);

        expect(response.body.result).toEqual([]);
    });

    it("returns 400 if query is missing", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .send({ sort: { price: "asc" } })
            .expect(400);
        expect(response.body.error).toBe("Invalid TradeSearchRequest");
    });

    it("returns 400 if body is missing", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/trade-search")
            .expect(400);
        expect(response.body.error).toBe("Invalid TradeSearchRequest");
    });
});