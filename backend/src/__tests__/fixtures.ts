import type { NinjaItem } from "models/ninja-types";
import { Recipe, RecipeItem, ResolvedMarketData, TradeItem } from "models/trade-types";

// A fixed timestamp for deterministic tests
export const FIXED_DATE = "2024-01-01T00:00:00.000Z";

export function makeResolvedMarketData(overrides?: Partial<ResolvedMarketData>): ResolvedMarketData {
    return {
        iconUrl: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png",
        name: "Chaos Orb",
        minPrice: { amount: 1, currency: "chaos" },
        originalMinPrice: { amount: 1, currency: "chaos" },
        medianPrice: { amount: 1, currency: "chaos" },
        originalMedianPrice: { amount: 1, currency: "chaos" },
        medianCount: 10,
        fetchedAt: FIXED_DATE,
        ...overrides,
    } as ResolvedMarketData;
}

export function makeNinjaItem(overrides?: Partial<NinjaItem>): NinjaItem {
    return {
        id: "chaos-orb",
        name: "Chaos Orb",
        icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png",
        category: "Currency" as any,
        detailsId: "chaos-orb",
        price: 1,
        priceHistory: [1, 1, 1],
        volume: 1000,
        maxVolumeCurrency: "chaos",
        maxVolumeRate: 1,
        fetchedAt: FIXED_DATE,
        ...overrides,
    };
}

export function makeTradeItem(overrides?: {
    tradeUrl?: string;
    search?: any;
    resolved?: Partial<ResolvedMarketData> | null;
}): TradeItem {
    return {
        tradeUrl: overrides?.tradeUrl ?? "https://www.pathofexile.com/trade/search/Standard/abcdefghij",
        search: overrides?.search ?? { query: { url: overrides?.tradeUrl ?? "url" }, sort: { price: "asc" as const } },
        resolved: overrides?.resolved === null
            ? undefined
            : makeResolvedMarketData(overrides?.resolved ?? {}),
    };
}

export function makeTradeRecipeItem(overrides?: {
    qty?: number;
    name?: string;
    icon?: string;
    tradeUrl?: string;
    search?: any;
    resolved?: Partial<ResolvedMarketData>;
}): RecipeItem {
    return {
        qty: overrides?.qty ?? 1,
        type: "trade",
        name: overrides?.name ?? "Chaos Orb",
        icon: overrides?.icon ?? "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png",
        item: makeTradeItem({
            tradeUrl: overrides?.tradeUrl,
            search: overrides?.search,
            resolved: overrides?.resolved,
        }),
    };
}

export function makeNinjaRecipeItem(overrides?: {
    qty?: number;
    name?: string;
    icon?: string;
    ninjaItem?: Partial<NinjaItem>;
}): RecipeItem {
    return {
        qty: overrides?.qty ?? 1,
        type: "ninja",
        name: overrides?.name ?? "Chaos Orb",
        icon: overrides?.icon ?? "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png",
        item: makeNinjaItem(overrides?.ninjaItem),
    };
}

export function makeRecipe(overrides?: Partial<Recipe>): Recipe {
    return {
        id: "r1",
        name: "Test Recipe",
        inputs: [
            makeTradeRecipeItem({ name: "Input Trade Item", resolved: { minPrice: { amount: 10, currency: "chaos" }, originalMinPrice: { amount: 10, currency: "chaos" } } }),
            makeNinjaRecipeItem({ name: "Input Ninja Item" }),
        ],
        outputs: [
            makeTradeRecipeItem({ name: "Output Trade Item", resolved: { minPrice: { amount: 100, currency: "chaos" }, originalMinPrice: { amount: 100, currency: "chaos" } } }),
            makeNinjaRecipeItem({ name: "Output Ninja Item" }),
        ],
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        ...overrides,
    };
}
