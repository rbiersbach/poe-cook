import { beforeEach, vi } from "vitest";

import supertest from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import fs from "fs";
import path from "path";
import { TradeClient } from "trade-client";
import { Recipe } from "trade-types";
import { TradeApiServer } from "../api";
import { NoopLogger } from "../logger";
import { ResolveItemError, TradeResolver } from "../trade-resolver";

const TEST_RECIPES_PATH = path.join(__dirname, "resources/recipes.test.json");

const mockGetAllRecipes = vi.fn(() => []);
const mockGetRecipeById = vi.fn();
const mockAdd = vi.fn();

class MockRecipeService {
    private store = {};
    private resolver = {};
    private logger = {};
    getAllRecipes = mockGetAllRecipes;
    getRecipeById = mockGetRecipeById;
    addRecipe = mockAdd;
    refreshRecipe = vi.fn();
    refreshItem = vi.fn();
}

let tradeClientMock: TradeClient;
let apiServer: TradeApiServer;
let recipeServiceMock: MockRecipeService;

beforeAll(async () => {
    // Clear test file before starting
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
    tradeClientMock = {
        search: vi.fn(),
        fetchListings: vi.fn(),
        logger: NoopLogger,
    } as unknown as TradeClient;
    recipeServiceMock = new MockRecipeService();
    apiServer = new TradeApiServer(tradeClientMock, recipeServiceMock, NoopLogger);
    await apiServer.server.listen({ port: 0 });
});

afterAll(async () => {
    await apiServer.server.close();
    // Clean up test file
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
});




describe("POST /api/resolve-item", () => {
    it("returns resolved item for a valid request (happy path)", async () => {
        // Mock TradeResolver and tradeClient
        const mockResult = {
            resolved: {
                iconUrl: "icon.png",
                name: "Test Item",
                minPrice: { amount: 100, currency: "chaos" },
                originalMinPrice: { amount: 1, currency: "divine" },
                medianPrice: { amount: 120, currency: "chaos" },
                originalMedianPrice: { amount: 2, currency: "divine" },
                medianCount: 2,
                fetchedAt: new Date().toISOString(),
            },
            search: { query: { name: "Test Item" } },
        };
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItemFromUrl").mockResolvedValueOnce(mockResult);

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
        expect(response.body.search).toBeDefined();
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
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItemFromUrl").mockRejectedValueOnce(new ResolveItemError("No listings found"));
        const response = await supertest(apiServer.server.server)
            .post("/api/resolve-item")
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(400);
        expect(response.body.error).toBe("No listings found");
        spy.mockRestore();
    });

    it("returns 500 for unexpected errors", async () => {
        const spy = vi.spyOn(TradeResolver.prototype, "resolveItemFromUrl").mockRejectedValueOnce(new Error("Unexpected failure"));
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
        mockGetAllRecipes.mockClear();
        mockGetRecipeById.mockClear();
        mockGetAllRecipes.mockReturnValue([]);
    });

    it("creates a recipe and returns it", async () => {
        const recipeInput = {
            inputs: [
                {
                    search: { query: { url: "url1" }, sort: { price: "asc" } },
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
                    search: { query: { url: "url2" }, sort: { price: "asc" } },
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
                search: { query: { url: "url3" }, sort: { price: "asc" } },
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
        // All items should have search, not tradeUrl
        expect(response.body.recipe.inputs[0].search).toBeDefined();
        expect(response.body.recipe.inputs[1].search).toBeDefined();
        expect(response.body.recipe.output.search).toBeDefined();
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
        mockGetRecipeById.mockClear();
    });

    it("returns the recipe for a valid id", async () => {
        const recipe = { id: "r1", inputs: [], output: {}, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" };
        mockGetRecipeById.mockReturnValueOnce(recipe);
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes/r1")
            .expect(200);
        expect(response.body.id).toBe("r1");
    });

    it("returns 404 if recipe not found", async () => {
        mockGetRecipeById.mockReturnValueOnce(undefined);
        const response = await supertest(apiServer.server.server)
            .get("/api/recipes/doesnotexist")
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("GET /api/recipes", () => {
    beforeEach(() => {
        mockGetAllRecipes.mockClear();
        mockGetAllRecipes.mockReturnValue([
            new Recipe({ id: "r1", inputs: [], output: { qty: 1 }, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" }),
            new Recipe({ id: "r2", inputs: [], output: { qty: 1 }, createdAt: "2024-01-02T00:00:00Z", updatedAt: "2024-01-02T00:00:00Z" }),
            new Recipe({ id: "r3", inputs: [], output: { qty: 1 }, createdAt: "2024-01-03T00:00:00Z", updatedAt: "2024-01-03T00:00:00Z" }),
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