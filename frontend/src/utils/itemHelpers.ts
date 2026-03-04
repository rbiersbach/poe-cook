import type { NinjaItem } from '../api/generated/models/NinjaItem';
import type { RecipeItem } from '../api/generated/models/RecipeItem';
import type { TradeItem } from '../api/generated/models/TradeItem';

export function isTradeItem(item: RecipeItem): item is RecipeItem & { item: TradeItem } {
    return (item.type as string) === 'trade';
}

export function isNinjaItem(item: RecipeItem): item is RecipeItem & { item: NinjaItem } {
    return (item.type as string) === 'ninja';
}

export function getItemPriceChaos(item: RecipeItem): number | undefined {
    if (isTradeItem(item)) return (item.item as TradeItem).resolved?.minPrice?.amount;
    return (item.item as NinjaItem).price;
}

/**
 * If chaos amount >= 2 divine orbs worth, converts to divine.
 * Returns { amount, currency } ready for display.
 */
export function convertChaosPrice(
    amount: number,
    divineRate: number | null,
): { amount: number; currency: string } {
    if (divineRate && divineRate > 0 && Math.abs(amount) >= divineRate * 2) {
        return { amount: amount / divineRate, currency: "divine" };
    }
    return { amount, currency: "chaos" };
}
