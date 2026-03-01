import { NinjaItem } from "models/ninja-types";
import { isTradeItem, Recipe, TradeItem } from "models/trade-types";
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
        mockResolver.resolveItemFromSearch.mockResolvedValue({ name: "resolved" });
        const recipe: Recipe = {
            id: "r3",
            name: "Test Recipe",
            inputs: [{ type: 'trade', tradeUrl: 'url1', search: { query: {} }, qty: 1 } as TradeItem],
            outputs: [{ type: 'trade', tradeUrl: 'url2', search: { query: {} }, qty: 1 } as TradeItem],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const refreshed = await service.refreshRecipe(recipe);

        if (isTradeItem(refreshed.inputs[0])) {
            expect(refreshed.inputs[0].resolved).toEqual({ name: "resolved" });
        }
        if (isTradeItem(refreshed.outputs[0])) {
            expect(refreshed.outputs[0].resolved).toEqual({ name: "resolved" });
        }
        expect(mockStore.add).toHaveBeenCalledWith(expect.objectContaining({ id: "r3" }));
    });

    it("refreshRecipe updates ninja items from store", async () => {
        const ninjaItem = {
            type: 'ninja',
            id: 'ninja1',
            name: 'Ninja Orb',
            icon: 'icon.png',
            category: 'Currency',
            detailsId: 'orb-1',
            price: 123,
            priceHistory: [100, 110, 120, 123],
            volume: 1000,
            maxVolumeCurrency: 'chaos',
            maxVolumeRate: 1,
            fetchedAt: '2026-03-01T00:00:00Z',
        } as NinjaItem;

        const recipe: Recipe = {
            id: "r4",
            name: "Ninja Recipe",
            inputs: [ninjaItem],
            outputs: [ninjaItem],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        };
        const updatedNinjaItem = { ...ninjaItem, price: 130 };

        mockNinjaItemStore.get.mockReturnValue(updatedNinjaItem); // Updated price
        // Act
        const refreshed = await service.refreshRecipe(recipe);
        // Assert
        expect(refreshed.inputs[0]).toEqual(updatedNinjaItem);
        expect(refreshed.outputs[0]).toEqual(updatedNinjaItem);
    });
});
