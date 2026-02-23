import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecipeService } from "recipe-service";
import { RecipeStore } from "recipe-store";
import { TradeResolver } from "trade-resolver";
import { Recipe, RecipeItem } from "trade-types";

const mockStore = {
    getAll: vi.fn(),
    get: vi.fn(),
    add: vi.fn(),
};
const mockResolver = {
    resolveItemFromSearch: vi.fn(),
};
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const service = new RecipeService(
    mockStore as unknown as RecipeStore,
    mockResolver as unknown as TradeResolver,
    mockLogger as any
);

describe("RecipeService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getAllRecipes returns recipes from store", async () => {
        mockStore.getAll.mockReturnValue([{ id: "r1" }]);
        const recipes = await service.getAllRecipes();
        expect(recipes).toEqual([{ id: "r1" }]);
    });

    it("getRecipeById returns recipe from store", async () => {
        mockStore.get.mockReturnValue({ id: "r2" });
        const recipe = await service.getRecipeById("r2");
        expect(recipe).toEqual({ id: "r2" });
    });

    it("refreshRecipe updates resolved items and persists", async () => {
        mockResolver.resolveItemFromSearch.mockResolvedValue({ name: "resolved" });
        const recipe: Recipe = {
            id: "r3",
            inputs: [{ search: {}, qty: 1 } as RecipeItem],
            output: { search: {}, qty: 1 } as RecipeItem,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const refreshed = await service.refreshRecipe(recipe);
        expect(refreshed.inputs[0].resolved).toEqual({ name: "resolved" });
        expect(refreshed.output.resolved).toEqual({ name: "resolved" });
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: "r3" }));
    });

});
