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
 * Formats a quantity for display.
 * Values < 1 are shown as a percentage (e.g. 0.1 → "10%").
 * Values >= 1 are returned as a plain number string.
 */
export function formatQty(qty: number): { value: string; isRate: boolean } {
    if (qty < 1) {
        const pct = parseFloat((qty * 100).toPrecision(6));
        return { value: `${pct}%`, isRate: true };
    }
    const formatted = parseFloat(qty.toFixed(2)).toString();
    return { value: formatted, isRate: false };
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
