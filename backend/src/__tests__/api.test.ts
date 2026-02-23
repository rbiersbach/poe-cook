import { beforeEach, vi } from "vitest";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { TradeApiServer } from "../api";
import { NoopLogger } from "../logger";
import { TradeClient } from "trade-client";
import { TradeResolver, ResolveItemError } from "../trade-resolver";
import path from "path";
import fs from "fs";

const TEST_RECIPES_PATH = path.join(__dirname, "resources/recipes.test.json");

const mockAdd = vi.fn();
const mockGetAll = vi.fn(() => []);
const mockClear = vi.fn();
const mockGet = vi.fn();

class MockRecipeStore {
    add = mockAdd;
    getAll = mockGetAll;
    clear = mockClear;
    get = mockGet;
}

let tradeClientMock: TradeClient;
let apiServer: TradeApiServer;

beforeAll(async () => {
    // Clear test file before starting
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
    tradeClientMock = {
        search: vi.fn(),
        fetchListings: vi.fn(),
        logger: NoopLogger,
    } as unknown as TradeClient;
    apiServer = new TradeApiServer(tradeClientMock, new MockRecipeStore());
    await apiServer.server.listen({ port: 0 });

});

afterAll(async () => {
    await apiServer.server.close();
    // Clean up test file
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
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

describe("POST /api/resolve-item", () => {
    it("returns resolved item for a valid request (happy path)", async () => {
        // Mock TradeResolver and tradeClient
        const mockResult = {
            iconUrl: "icon.png",
            name: "Test Item",
            minPrice: { amount: 100, currency: "chaos" },
            originalMinPrice: { amount: 1, currency: "divine" },
            medianPrice: { amount: 120, currency: "chaos" },
            originalMedianPrice: { amount: 2, currency: "divine" },
            medianCount: 2,
            fetchedAt: new Date().toISOString(),
        };
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItem").mockResolvedValueOnce(mockResult);

        const response = await supertest(apiServer.server.server)
            .post("/api/resolve-item")
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(200);
        expect(response.body.resolved).toMatchObject({
            iconUrl: "icon.png",
            name: "Test Item",
            minPrice: { amount: 100, currency: "chaos" },
            originalMinPrice: { amount: 1, currency: "divine" },
            medianPrice: { amount: 120, currency: "chaos" },
            originalMedianPrice: { amount: 2, currency: "divine" },
            medianCount: 2,
        });
        spy.mockRestore();
    });

    it("returns 400 if tradeUrl is missing", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/resolve-item")
            .send({})
            .expect(400);
        expect(response.body.error).toBe("Invalid ResolveItemRequest");
    });

    it("returns 400 if ResolveItemError is thrown", async () => {
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItem").mockRejectedValueOnce(new ResolveItemError("No listings found"));
        const response = await supertest(apiServer.server.server)
            .post("/api/resolve-item")
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(400);
        expect(response.body.error).toBe("No listings found");
        spy.mockRestore();
    });

    it("returns 500 for unexpected errors", async () => {
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItem").mockRejectedValueOnce(new Error("Unexpected failure"));
        const response = await supertest(apiServer.server.server)
            .post("/api/resolve-item")
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(500);
        expect(response.body.error).toBe("Server error");
        spy.mockRestore();
    });
});

describe("POST /api/recipes", () => {
    beforeEach(() => {
        mockAdd.mockClear();
        mockGetAll.mockClear();
        mockClear.mockClear();
        mockGet.mockClear();
        mockGetAll.mockReturnValue([]);
    });

    it("creates a recipe and returns it", async () => {
        const recipeInput = {
            inputs: [
                {
                    tradeUrl: "url1",
                    qty: 2,
                    fallbackPrice: { amount: 10, currency: "chaos" },
                    resolved: {
                        iconUrl: "icon1.png",
                        name: "Input Item 1",
                        minPrice: { amount: 10, currency: "chaos" },
                        originalMinPrice: { amount: 12, currency: "chaos" },
                        medianPrice: { amount: 11, currency: "chaos" },
                        originalMedianPrice: { amount: 13, currency: "chaos" },
                        medianCount: 5,
                        fetchedAt: new Date().toISOString(),
                    }
                },
                {
                    tradeUrl: "url2",
                    qty: 1,
                    fallbackPrice: { amount: 20, currency: "divine" },
                    resolved: {
                        iconUrl: "icon2.png",
                        name: "Input Item 2",
                        minPrice: { amount: 20, currency: "divine" },
                        originalMinPrice: { amount: 22, currency: "divine" },
                        medianPrice: { amount: 21, currency: "divine" },
                        originalMedianPrice: { amount: 23, currency: "divine" },
                        medianCount: 3,
                        fetchedAt: new Date().toISOString(),
                    }
                }
            ],
            output: {
                tradeUrl: "url3",
                qty: 1,
                fallbackPrice: { amount: 100, currency: "chaos" },
                resolved: {
                    iconUrl: "icon3.png",
                    name: "Output Item",
                    minPrice: { amount: 100, currency: "chaos" },
                    originalMinPrice: { amount: 120, currency: "chaos" },
                    medianPrice: { amount: 110, currency: "chaos" },
                    originalMedianPrice: { amount: 130, currency: "chaos" },
                    medianCount: 10,
                    fetchedAt: new Date().toISOString(),
                }
            }
        };
        mockAdd.mockImplementation(recipe => recipe);
        const response = await supertest(apiServer.server.server)
            .post("/api/recipes")
            .send(recipeInput)
            .expect(200);
        expect(mockAdd).toHaveBeenCalled();
        expect(response.body.recipe.inputs).toEqual(recipeInput.inputs);
        expect(response.body.recipe.output).toEqual(recipeInput.output);
        expect(typeof response.body.recipe.id).toBe("string");
        expect(typeof response.body.recipe.createdAt).toBe("string");
        expect(typeof response.body.recipe.updatedAt).toBe("string");
    });

    it("returns 400 for missing inputs or output", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/recipes")
            .send({})
            .expect(400);
        expect(response.body.error).toBe("Invalid CreateRecipeRequest");
    });

    it("returns 400 for non-array inputs", async () => {
        const response = await supertest(apiServer.server.server)
            .post("/api/recipes")
            .send({ inputs: "not-an-array", output: { tradeUrl: "url", qty: 1 } })
            .expect(400);
        expect(response.body.error).toBe("Invalid CreateRecipeRequest");
    });
});

describe("GET /api/recipes/:id", () => {
    beforeEach(() => {
        mockGet.mockClear();
    });

    it("returns the recipe for a valid id", async () => {
        const recipe = { id: "r1", inputs: [], output: {}, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" };
        mockGet.mockReturnValueOnce(recipe);
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes/r1")
            .expect(200);
        expect(response.body.id).toBe("r1");
    });

    it("returns 404 if recipe not found", async () => {
        mockGet.mockReturnValueOnce(undefined);
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes/doesnotexist")
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("GET /api/recipes", () => {
    beforeEach(() => {
        mockGetAll.mockClear();
        mockGetAll.mockReturnValue([
            { id: "r1", inputs: [], output: {}, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
            { id: "r2", inputs: [], output: {}, createdAt: "2024-01-02T00:00:00Z", updatedAt: "2024-01-02T00:00:00Z" },
            { id: "r3", inputs: [], output: {}, createdAt: "2024-01-03T00:00:00Z", updatedAt: "2024-01-03T00:00:00Z" },
        ]);
    });

    it("returns all recipes if no cursor/limit", async () => {
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes")
            .expect(200);
        expect(response.body.recipes.length).toBe(3);
        expect(response.body.recipes[0].id).toBe("r1");
    });

    it("returns limited recipes and nextCursor", async () => {
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes?limit=2")
            .expect(200);
        expect(response.body.recipes.length).toBe(2);
        expect(response.body.nextCursor).toBe("r2");
    });

    it("returns recipes after cursor", async () => {
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes?cursor=r1&limit=1")
            .expect(200);
        expect(response.body.recipes.length).toBe(1);
        expect(response.body.recipes[0].id).toBe("r2");
    });

    it("returns empty array if cursor at end", async () => {
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes?cursor=r3")
            .expect(200);
        expect(response.body.recipes.length).toBe(0);
    });
});