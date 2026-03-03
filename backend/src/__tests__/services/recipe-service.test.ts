import { NinjaItem } from "models/ninja-types";
import { isTradeItem, Recipe, RecipeItem, TradeItem } from "models/trade-types";
import { RecipeService } from "services/recipe-service";
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
const mockNinjaItemStore = { get: vi.fn() };

const service = new RecipeService(
    mockStore as any,
    mockResolver as any,
    mockLogger as any,
    mockNinjaItemStore as any
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
        mockResolver.resolveItemFromSearch.mockResolvedValue({ name: "resolved", iconUrl: "icon.png" });
        const recipe: Recipe = {
            id: "r3",
            name: "Test Recipe",
            inputs: [{ qty: 1, type: 'trade', name: 'Item1', icon: 'i1.png', item: { tradeUrl: 'url1', search: { query: {} } } } as RecipeItem],
            outputs: [{ qty: 1, type: 'trade', name: 'Item2', icon: 'i2.png', item: { tradeUrl: 'url2', search: { query: {} } } } as RecipeItem],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const refreshed = await service.refreshRecipe(recipe);

        if (isTradeItem(refreshed.inputs[0])) {
            expect((refreshed.inputs[0].item as TradeItem).resolved).toEqual({ name: "resolved", iconUrl: "icon.png" });
        }
        if (isTradeItem(refreshed.outputs[0])) {
            expect((refreshed.outputs[0].item as TradeItem).resolved).toEqual({ name: "resolved", iconUrl: "icon.png" });
        }
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: "r3" }));
    });

    it("refreshRecipe updates ninja items from store", async () => {
        const ninjaItemData: NinjaItem = {
            id: 'ninja1',
            name: 'Ninja Orb',
            icon: 'icon.png',
            category: 'Currency' as any,
            detailsId: 'orb-1',
            price: 123,
            priceHistory: [100, 110, 120, 123],
            volume: 1000,
            maxVolumeCurrency: 'chaos',
            maxVolumeRate: 1,
            fetchedAt: '2026-03-01T00:00:00Z',
        };

        const ninjaRecipeItem: RecipeItem = {
            qty: 1,
            type: 'ninja',
            name: ninjaItemData.name,
            icon: ninjaItemData.icon,
            item: ninjaItemData,
        };

        const recipe: Recipe = {
            id: "r4",
            name: "Ninja Recipe",
            inputs: [ninjaRecipeItem],
            outputs: [ninjaRecipeItem],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const updatedNinjaItemData = { ...ninjaItemData, price: 130 };

        mockNinjaItemStore.get.mockReturnValue(updatedNinjaItemData);
        const refreshed = await service.refreshRecipe(recipe);
        expect((refreshed.inputs[0].item as NinjaItem).price).toBe(130);
        expect((refreshed.outputs[0].item as NinjaItem).price).toBe(130);
        expect(refreshed.inputs[0].name).toBe(ninjaItemData.name);
    });
});
