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
