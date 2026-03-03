import { NinjaItem } from "../api/generated/models/NinjaItem";
import type { Recipe } from "../api/generated/models/Recipe";
import { RecipeItem } from "../api/generated/models/RecipeItem";
import type { ResolveItemResponse } from "../api/generated/models/ResolveItemResponse";
import type { ResolvedMarketData } from "../api/generated/models/ResolvedMarketData";
import type { TradeItem } from "../api/generated/models/TradeItem";

export function makeNinjaItem(overrides?: Partial<NinjaItem>): NinjaItem {
    return {
        id: "orb-of-alteration",
        name: "Orb of Alteration",
        icon: "https://example.com/alt.png",
        category: NinjaItem.category.CURRENCY,
        detailsId: "orb-of-alteration",
        price: 1.5,
        priceHistory: [1.2, 1.4, 1.5],
        volume: 1000,
        maxVolumeCurrency: "chaos",
        maxVolumeRate: 0.5,
        fetchedAt: new Date().toISOString(),
        ...overrides,
    };
}

export function makeTradeItem(overrides?: Partial<TradeItem>): TradeItem {
    return {
        tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij",
        search: { query: {} },
        resolved: {
            name: "Test Item",
            iconUrl: "icon.png",
            minPrice: { amount: 10, currency: "chaos" },
            originalMinPrice: { amount: 10, currency: "chaos" },
        },
        ...overrides,
    };
}

export function makeResolved(overrides?: Partial<ResolvedMarketData>): ResolvedMarketData {
    return {
        name: "Test Item",
        iconUrl: "icon.png",
        minPrice: { amount: 10, currency: "chaos" },
        originalMinPrice: { amount: 10, currency: "chaos" },
        ...overrides,
    };
}

export function makeTradeRecipeItem(overrides?: Partial<RecipeItem>): RecipeItem {
    return {
        qty: 1,
        type: RecipeItem.type.TRADE,
        name: "Test Item",
        icon: "icon.png",
        item: makeTradeItem(),
        ...overrides,
    };
}

export function makeNinjaRecipeItem(overrides?: Partial<RecipeItem>): RecipeItem {
    return {
        qty: 1,
        type: RecipeItem.type.NINJA,
        name: "Orb of Alteration",
        icon: "https://example.com/alt.png",
        item: makeNinjaItem(),
        ...overrides,
    };
}

/** Default recipe suitable for RecipeCard and RecipesListPage tests */
export function makeRecipe(overrides?: Partial<Recipe>): Recipe {
    return {
        id: "test1",
        name: "Test Recipe",
        inputs: [
            makeTradeRecipeItem({
                name: "Input Trade Item",
                icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png",
                item: makeTradeItem({ tradeUrl: "", resolved: { minPrice: { amount: 5, currency: "chaos" } } }),
            }),
            makeNinjaRecipeItem({
                name: "Input Ninja Item",
                icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyIdentification.png",
            }),
        ],
        outputs: [
            makeTradeRecipeItem({
                name: "Output Trade Item",
                icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyUpgradeToRare.png",
                item: makeTradeItem({ tradeUrl: "", resolved: { minPrice: { amount: 10, currency: "chaos" } } }),
            }),
            makeNinjaRecipeItem({
                name: "Output Ninja Item",
                icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png",
            }),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

export function makeResolveItemResponse(overrides?: {
    name?: string;
    iconUrl?: string;
    amount?: number;
    search?: ResolveItemResponse["search"];
}): ResolveItemResponse {
    return {
        resolved: {
            name: overrides?.name ?? "Test Item",
            iconUrl: overrides?.iconUrl ?? "icon.png",
            originalMinPrice: { amount: overrides?.amount ?? 10, currency: "chaos" },
        },
        search: overrides?.search ?? { query: {}, sort: {} },
    };
}
