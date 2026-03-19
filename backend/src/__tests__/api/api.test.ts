import { beforeEach, vi } from "vitest";

import supertest from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import fs from "fs";
import { Recipe } from "models/trade-types";
import path from "path";
import { RateLimitedError, TradeClientService } from "services/trade-client-service";
import { StoreRegistry } from "stores/store-registry";
import { TradeApiServer } from "../../api/api";
import { NoopLogger } from "../../logger";
import type { IRecipeService } from "../../services/recipe-service";
import { ResolveItemError, TradeResolverService } from "../../services/trade-resolver-service";
import { makeNinjaItem, makeRecipe, makeResolvedMarketData } from "../fixtures";

const TEST_RECIPES_PATH = path.join(__dirname, "../resources/recipes.test.json");
const TEST_LEAGUE = "Standard";
const LEAGUE_PREFIX = `/api/leagues/${TEST_LEAGUE}`;

const mockGetAllRecipes = vi.fn(async (_league: string, _invalidateCache?: boolean) => [] as Recipe[]);
const mockGetRecipeById = vi.fn(async (_league: string, _id: string, _invalidateCache?: boolean) => undefined as Recipe | undefined);
const mockAdd = vi.fn(async (_recipe: Recipe, _league: string) => { });
const mockRefreshRecipe = vi.fn(async (recipe: Recipe, _league: string) => recipe);
const mockRefreshItem = vi.fn(async (item: any, _league: string) => item);

const recipeServiceMock: IRecipeService = {
    getAllRecipes: mockGetAllRecipes,
    getRecipeById: mockGetRecipeById,
    addRecipe: mockAdd,
    refreshRecipe: mockRefreshRecipe,
    refreshItem: mockRefreshItem,
    deleteRecipe: vi.fn((_league: string, _id: string) => true),
    updateRecipe: vi.fn(async (_league: string, id: string, recipe: Recipe) => ({ ...recipe, id })),
};


let tradeClientMock: TradeClientService;
let apiServer: TradeApiServer;

const mockFindByText = vi.fn(() => [] as any[]);
const mockNinjaItemStore = { findByText: mockFindByText } as any;
const mockRecipeStore = {} as any;
let mockRegistry: StoreRegistry;

beforeAll(async () => {
    // Clear test file before starting
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
    tradeClientMock = {
        search: vi.fn(),
        fetchListings: vi.fn(),
        travelToHideout: vi.fn(),
        logger: NoopLogger,
    } as unknown as TradeClientService;
    mockRegistry = {
        getNinjaItemStore: vi.fn(() => mockNinjaItemStore),
        getRecipeStore: vi.fn(() => mockRecipeStore),
    } as unknown as StoreRegistry;
    apiServer = new TradeApiServer(tradeClientMock, recipeServiceMock, NoopLogger, mockRegistry);
    await apiServer.server.listen({ port: 0 });
});

afterAll(async () => {
    await apiServer.server.close();
    // Clean up test file
    fs.writeFileSync(TEST_RECIPES_PATH, "[]");
});




describe("POST /api/leagues/:league/resolve-item", () => {
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
        const spy = vi.spyOn(TradeResolverService.prototype, "resolveItemFromUrl").mockResolvedValueOnce(mockResult);

        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/resolve-item`)
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
            .post(`${LEAGUE_PREFIX}/resolve-item`)
            .send({})
            .expect(400);
        expect(response.body.error).toBe("Invalid ResolveItemRequest");
    });

    it("normalizes a URL missing the https:// scheme", async () => {
        const spy = vi.spyOn(TradeResolverService.prototype, "resolveItemFromUrl").mockResolvedValueOnce({
            resolved: makeResolvedMarketData({ medianCount: 42 }),
            search: { query: { name: "Chaos Orb" }, sort: { price: "asc" } },
        });
        await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/resolve-item`)
            .send({ tradeUrl: "www.pathofexile.com/trade/search/Standard/3qj2DE7ZC5" })
            .expect(200);
        expect(spy).toHaveBeenCalledWith(
            "https://www.pathofexile.com/trade/search/Standard/3qj2DE7ZC5",
            expect.any(String),
            TEST_LEAGUE
        );
        spy.mockRestore();
    });

    it("normalizes a URL missing both scheme and www", async () => {
        const spy = vi.spyOn(TradeResolverService.prototype, "resolveItemFromUrl").mockResolvedValueOnce({
            resolved: makeResolvedMarketData({ medianCount: 42 }),
            search: { query: { name: "Chaos Orb" }, sort: { price: "asc" } },
        });
        await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/resolve-item`)
            .send({ tradeUrl: "pathofexile.com/trade/search/Standard/3qj2DE7ZC5" })
            .expect(200);
        expect(spy).toHaveBeenCalledWith(
            "https://www.pathofexile.com/trade/search/Standard/3qj2DE7ZC5",
            expect.any(String),
            TEST_LEAGUE
        );
        spy.mockRestore();
    });

    it("returns 400 if ResolveItemError is thrown", async () => {
        const spy = vi.spyOn(TradeResolverService.prototype, "resolveItemFromUrl").mockRejectedValueOnce(new ResolveItemError("No listings found"));
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/resolve-item`)
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(400);
        expect(response.body.error).toBe("No listings found");
        spy.mockRestore();
    });

    it("returns 500 for unexpected errors", async () => {
        const spy = vi.spyOn(TradeResolverService.prototype, "resolveItemFromUrl").mockRejectedValueOnce(new Error("Unexpected failure"));
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/resolve-item`)
            .send({ tradeUrl: "https://www.pathofexile.com/trade" })
            .expect(500);
        expect(response.body.error).toBe("Server error");
        spy.mockRestore();
    });
});

describe("POST /api/leagues/:league/recipes", () => {
    beforeEach(() => {
        mockAdd.mockClear();
        mockGetAllRecipes.mockClear();
        mockGetRecipeById.mockClear();
        mockGetAllRecipes.mockResolvedValue([]);
    });

    it("creates a recipe and returns it", async () => {
        const recipeInput = {
            name: "Test Recipe",
            inputs: [
                {
                    qty: 2,
                    type: "trade",
                    name: "Input Item 1",
                    icon: "icon1.png",
                    item: {
                        tradeUrl: "url1",
                        search: { query: { url: "url1" }, sort: { price: "asc" } },
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
                    }
                },
                {
                    qty: 1,
                    type: "trade",
                    name: "Input Item 2",
                    icon: "icon2.png",
                    item: {
                        tradeUrl: "url2",
                        search: { query: { url: "url2" }, sort: { price: "asc" } },
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
                }
            ],
            outputs: [
                {
                    qty: 1,
                    type: "trade",
                    name: "Output Item",
                    icon: "icon3.png",
                    item: {
                        tradeUrl: "url3",
                        search: { query: { url: "url3" }, sort: { price: "asc" } },
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
                },
                {
                    qty: 0.5,
                    type: "trade",
                    name: "Output Item 2",
                    icon: "icon4.png",
                    item: {
                        tradeUrl: "url4",
                        search: { query: { url: "url4" }, sort: { price: "asc" } },
                        resolved: {
                            iconUrl: "icon4.png",
                            name: "Output Item 2",
                            minPrice: { amount: 50, currency: "divine" },
                            originalMinPrice: { amount: 60, currency: "divine" },
                            medianPrice: { amount: 55, currency: "divine" },
                            originalMedianPrice: { amount: 65, currency: "divine" },
                            medianCount: 7,
                            fetchedAt: new Date().toISOString(),
                        }
                    }
                }
            ]
        };

        mockAdd.mockImplementation(async () => { });
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/recipes`)
            .send(recipeInput)
            .expect(200);
        expect(mockAdd).toHaveBeenCalled();
        // All items should have item.search in the sub-object
        expect(response.body.recipe.inputs[0].item.search).toBeDefined();
        expect(response.body.recipe.inputs[1].item.search).toBeDefined();
        expect(response.body.recipe.outputs[0].item.search).toBeDefined();
        expect(response.body.recipe.outputs[1].item.search).toBeDefined();
        expect(response.body.recipe.outputs.length).toBe(2);
        expect(typeof response.body.recipe.id).toBe("string");
        expect(typeof response.body.recipe.createdAt).toBe("string");
        expect(typeof response.body.recipe.updatedAt).toBe("string");
    });

    it("returns 400 for missing inputs, outputs, or name", async () => {
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/recipes`)
            .send({})
            .expect(400);
        expect(response.body.error).toBe("Invalid CreateRecipeRequest");
    });

    it("returns 400 for non-array inputs", async () => {
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/recipes`)
            .send({ name: "Test", inputs: "not-an-array", outputs: [{ tradeUrl: "url", qty: 1 }] })
            .expect(400);
        expect(response.body.error).toBe("Invalid CreateRecipeRequest");
    });

    it("creates a recipe with ninja items (no search required)", async () => {
        const ninjaItem = {
            qty: 5,
            type: "ninja",
            name: "Chaos Orb",
            icon: "https://web.poecdn.com/img/chaos.png",
            item: makeNinjaItem({
                icon: "https://web.poecdn.com/img/chaos.png",
                priceHistory: [],
                maxVolumeCurrency: "divine",
                maxVolumeRate: 0.002,
                fetchedAt: new Date().toISOString(),
            }),
        };
        const tradeItem = {
            qty: 1,
            type: "trade",
            name: "Unknown",
            icon: "",
            item: {
                tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/abc",
                search: { query: {}, sort: {} },
            },
        };
        mockAdd.mockImplementation(async () => { });
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/recipes`)
            .send({ name: "Ninja Recipe", inputs: [ninjaItem], outputs: [tradeItem] })
            .expect(200);
        expect(mockAdd).toHaveBeenCalled();
        expect(response.body.recipe.inputs[0].type).toBe("ninja");
        expect(response.body.recipe.outputs[0].type).toBe("trade");
    });
});

describe("GET /api/leagues/:league/recipes/:id", () => {
    beforeEach(() => {
        mockGetRecipeById.mockClear();
    });

    it("returns the recipe for a valid id", async () => {
        const recipe = { id: "r1", name: "Test Recipe", inputs: [], outputs: [], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" };
        mockGetRecipeById.mockResolvedValueOnce(recipe);
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes/r1`)
            .expect(200);
        expect(response.body.id).toBe("r1");
    });

    it("returns 404 if recipe not found", async () => {
        mockGetRecipeById.mockResolvedValueOnce(undefined);
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes/doesnotexist`)
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("GET /api/leagues/:league/recipes/:id (dup)", () => {
    beforeEach(() => {
        mockGetRecipeById.mockClear();
    });

    it("returns the recipe for a valid id", async () => {
        const recipe = { id: "r1", name: "Test Recipe", inputs: [], outputs: [], createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" };
        mockGetRecipeById.mockResolvedValueOnce(recipe);
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes/r1`)
            .expect(200);
        expect(response.body.id).toBe("r1");
    });

    it("returns 404 if recipe not found", async () => {
        mockGetRecipeById.mockResolvedValueOnce(undefined);
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes/doesnotexist`)
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("PUT /api/leagues/:league/recipes/:id", () => {
    beforeEach(() => {
        (recipeServiceMock.updateRecipe as any).mockClear();
    });

    it("updates a recipe successfully with valid request", async () => {
        const updateRequest = {
            name: "Updated Recipe",
            inputs: [
                {
                    qty: 2,
                    type: "trade",
                    name: "Input Item",
                    icon: "icon.png",
                    item: {
                        tradeUrl: "url1",
                        search: { query: { url: "url1" } },
                        resolved: {
                            iconUrl: "icon.png",
                            name: "Input Item",
                            minPrice: { amount: 10, currency: "chaos" },
                            originalMinPrice: { amount: 5, currency: "chaos" },
                            medianPrice: { amount: 12, currency: "chaos" },
                            originalMedianPrice: { amount: 6, currency: "chaos" },
                            medianCount: 5,
                            fetchedAt: new Date().toISOString(),
                        }
                    }
                }
            ],
            outputs: [
                {
                    qty: 1,
                    type: "trade",
                    name: "Output Item",
                    icon: "icon2.png",
                    item: {
                        tradeUrl: "url2",
                        search: { query: { url: "url2" } },
                        resolved: {
                            iconUrl: "icon2.png",
                            name: "Output Item",
                            minPrice: { amount: 20, currency: "chaos" },
                            originalMinPrice: { amount: 15, currency: "chaos" },
                            medianPrice: { amount: 22, currency: "chaos" },
                            originalMedianPrice: { amount: 17, currency: "chaos" },
                            medianCount: 10,
                            fetchedAt: new Date().toISOString(),
                        }
                    }
                }
            ]
        };
        const updatedRecipe = {
            id: "r1",
            ...updateRequest,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: new Date().toISOString(),
        };
        (recipeServiceMock.updateRecipe as any).mockResolvedValueOnce(updatedRecipe);
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/r1`)
            .send(updateRequest)
            .expect(200);
        expect(response.body.id).toBe("r1");
        expect(response.body.name).toBe("Updated Recipe");
        expect((recipeServiceMock.updateRecipe as any)).toHaveBeenCalledWith(TEST_LEAGUE, "r1", expect.objectContaining({
            id: "r1",
            name: "Updated Recipe",
        }));
    });

    it("returns 400 for missing required fields", async () => {
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/r1`)
            .send({ name: "Updated Recipe" })
            .expect(400);
        expect(response.body.error).toBe("Invalid UpdateRecipeRequest");
    });

    it("returns 400 if outputs is empty", async () => {
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/r1`)
            .send({
                name: "Updated Recipe",
                inputs: [],
                outputs: []
            })
            .expect(400);
        expect(response.body.error).toBe("Invalid UpdateRecipeRequest");
    });

    it("returns 400 if inputs or outputs are not arrays", async () => {
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/r1`)
            .send({
                name: "Updated Recipe",
                inputs: "not an array",
                outputs: []
            })
            .expect(400);
        expect(response.body.error).toBe("Invalid UpdateRecipeRequest");
    });

    it("returns 400 if trade items missing search object", async () => {
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/r1`)
            .send({
                name: "Updated Recipe",
                inputs: [
                    {
                        qty: 1,
                        type: "trade",
                        name: "Item",
                        icon: "icon.png",
                        item: { tradeUrl: "url" }
                    }
                ],
                outputs: [
                    {
                        qty: 1,
                        type: "trade",
                        name: "Item",
                        icon: "icon.png",
                        item: {
                            tradeUrl: "url",
                            search: { query: {} }
                        }
                    }
                ]
            })
            .expect(400);
        expect(response.body.error).toBe("Each item must have a search object");
    });

    it("returns 404 if recipe not found", async () => {
        (recipeServiceMock.updateRecipe as any).mockRejectedValueOnce(new Error("Recipe not found"));
        const response = await supertest(apiServer.server.server)
            .put(`${LEAGUE_PREFIX}/recipes/doesnotexist`)
            .send({
                name: "Updated Recipe",
                inputs: [
                    {
                        qty: 1,
                        type: "trade",
                        name: "Input Item",
                        icon: "icon.png",
                        item: {
                            tradeUrl: "url1",
                            search: { query: { url: "url1" }, sort: { price: "asc" } },
                        }
                    }
                ],
                outputs: [
                    {
                        qty: 1,
                        type: "trade",
                        name: "Output Item",
                        icon: "icon2.png",
                        item: {
                            tradeUrl: "url2",
                            search: { query: { url: "url2" }, sort: { price: "asc" } },
                        }
                    }
                ]
            })
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("DELETE /api/leagues/:league/recipes/:id", () => {
    beforeEach(() => {
        (recipeServiceMock.deleteRecipe as any).mockClear();
    });

    it("deletes a recipe successfully", async () => {
        (recipeServiceMock.deleteRecipe as any).mockReturnValueOnce(true);
        const response = await supertest(apiServer.server.server)
            .delete(`${LEAGUE_PREFIX}/recipes/r1`)
            .expect(204);
        expect((recipeServiceMock.deleteRecipe as any)).toHaveBeenCalledWith(TEST_LEAGUE, "r1");
        expect(response.body).toEqual({});
    });

    it("returns 404 if recipe not found", async () => {
        (recipeServiceMock.deleteRecipe as any).mockReturnValueOnce(false);
        const response = await supertest(apiServer.server.server)
            .delete(`${LEAGUE_PREFIX}/recipes/doesnotexist`)
            .expect(404);
        expect(response.body.error).toBe("Recipe not found");
    });
});

describe("GET /api/leagues/:league/recipes", () => {
    beforeEach(() => {
        mockGetAllRecipes.mockClear();
        mockGetAllRecipes.mockResolvedValue([
            makeRecipe({ id: "r1", name: "Recipe 1" }),
            makeRecipe({ id: "r2", name: "Recipe 2", createdAt: "2024-01-02T00:00:00.000Z", updatedAt: "2024-01-02T00:00:00.000Z" }),
            makeRecipe({ id: "r3", name: "Recipe 3", createdAt: "2024-01-03T00:00:00.000Z", updatedAt: "2024-01-03T00:00:00.000Z" }),
        ]);
    });

    it("returns all recipes if no cursor/limit", async () => {
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes`)
            .expect(200);
        expect(response.body.recipes.length).toBe(3);
        expect(response.body.recipes[0].id).toBe("r1");
    });

    it("returns limited recipes and nextCursor", async () => {
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes?limit=2`)
            .expect(200);
        expect(response.body.recipes.length).toBe(2);
        expect(response.body.nextCursor).toBe("r2");
    });

    it("returns recipes after cursor", async () => {
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes?cursor=r1&limit=1`)
            .expect(200);
        expect(response.body.recipes.length).toBe(1);
        expect(response.body.recipes[0].id).toBe("r2");
    });

    it("returns empty array if cursor at end", async () => {
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/recipes?cursor=r3`)
            .expect(200);
        expect(response.body.recipes.length).toBe(0);
    });
});
describe("GET /api/leagues/:league/ninja-items", () => {
    it("calls store with all query parameters and returns real items", async () => {
        const realItems = [
            {
                id: "0",
                name: "Item0",
                icon: "icon.png",
                category: "Currency",
                detailsId: "details0",
                price: 0,
                priceHistory: [0, 1],
                volume: 100,
                maxVolumeCurrency: "chaos",
                maxVolumeRate: 1,
                fetchedAt: "2026-03-01T17:35:42.993Z"
            },
            {
                id: "1",
                name: "Item1",
                icon: "icon.png",
                category: "Currency",
                detailsId: "details1",
                price: 1,
                priceHistory: [1, 2],
                volume: 100,
                maxVolumeCurrency: "chaos",
                maxVolumeRate: 1,
                fetchedAt: "2026-03-01T17:35:42.994Z"
            }
        ];
        mockFindByText.mockReturnValue(realItems);
        const params = {
            search: "chaos",
            key: "name",
            limit: "2"
        };
        const response = await supertest(apiServer.server.server)
            .get(`${LEAGUE_PREFIX}/ninja-items?search=${params.search}&key=${params.key}&limit=${params.limit}`)
            .expect(200);
        expect(mockNinjaItemStore.findByText).toHaveBeenCalledWith(params.key, params.search);
        expect(response.body.items.length).toBeGreaterThanOrEqual(2);
        expect(response.body.items[0].id).toBe("0");
        expect(response.body.items[1].id).toBe("1");
    });
});

describe("POST /api/leagues/:league/travel", () => {
    beforeEach(() => {
        (tradeClientMock as any).travelToHideout.mockClear();
    });

    it("returns 200 and calls travelToHideout with the search payload", async () => {
        (tradeClientMock as any).travelToHideout.mockResolvedValueOnce(undefined);

        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/travel`)
            .send({ search: { query: { name: "Chaos Orb" }, sort: { price: "asc" } } })
            .expect(200);

        expect(response.body).toEqual({});
        expect((tradeClientMock as any).travelToHideout).toHaveBeenCalledWith(
            { query: { name: "Chaos Orb" }, sort: { price: "asc" } },
            TEST_LEAGUE
        );
    });

    it("returns 400 if the search field is missing", async () => {
        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/travel`)
            .send({})
            .expect(400);

        expect(response.body.error).toBe("Invalid TravelToItemRequest");
    });

    it("returns 429 when a RateLimitedError is thrown", async () => {
        (tradeClientMock as any).travelToHideout.mockRejectedValueOnce(new RateLimitedError(30));

        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/travel`)
            .send({ search: { query: {} } })
            .expect(429);

        expect(response.body.error).toMatch(/Rate limited/i);
    });

    it("returns 500 for unexpected errors", async () => {
        (tradeClientMock as any).travelToHideout.mockRejectedValueOnce(new Error("upstream failure"));

        const response = await supertest(apiServer.server.server)
            .post(`${LEAGUE_PREFIX}/travel`)
            .send({ search: { query: {} } })
            .expect(500);

        expect(response.body.error).toBe("Server error");
    });
});