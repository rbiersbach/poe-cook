import { RecipeService } from "recipe-service";
import { IRecipeStore } from "../recipe-store";
import { ITradeResolver } from "../trade-resolver";
import { Recipe, RecipeItem } from "trade-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = {
    getAll: vi.fn(() => []),
    get: vi.fn((_id: string) => undefined),
    add: vi.fn((recipe: Recipe) => recipe),
    clear: vi.fn(),
};
const mockResolver = {
    resolveTradeRequestFromUrl: vi.fn(),
    resolveItemFromUrl: vi.fn(),
    resolveItemFromSearch: vi.fn(),
};
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const service = new RecipeService(
    mockStore as any,
    mockResolver as any,
    mockLogger as any
);

describe("RecipeService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getAllRecipes returns recipes from store", async () => {
        (mockStore.getAll as any).mockReturnValue([{ id: "r1" }]);
        const recipes = await service.getAllRecipes();
        expect(recipes).toEqual([{ id: "r1" }]);
    });

    it("getRecipeById returns recipe from store", async () => {
        (mockStore.get as any).mockReturnValue({ id: "r2" });
        const recipe = await service.getRecipeById("r2");
        expect(recipe).toEqual({ id: "r2" });
    });

    it("refreshRecipe updates resolved items and persists", async () => {
        mockResolver.resolveItemFromSearch.mockResolvedValue({ name: "resolved" });
        const recipe: Recipe = {
            id: "r3",
            name: "Test Recipe",
            inputs: [{ search: {}, qty: 1 } as RecipeItem],
            outputs: [{ search: {}, qty: 1 } as RecipeItem],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const refreshed = await service.refreshRecipe(recipe);
        expect(refreshed.inputs[0].resolved).toEqual({ name: "resolved" });
        expect(refreshed.outputs[0].resolved).toEqual({ name: "resolved" });
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: "r3" }));
    });

});
