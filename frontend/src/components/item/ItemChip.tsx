import type { NinjaItem } from "api/generated/models/NinjaItem";
import { RecipeItem } from "api/generated/models/RecipeItem";
import type { TradeItem } from "api/generated/models/TradeItem";
import React from "react";
import { formatQty, isNinjaItem, isTradeItem } from "../../utils/itemHelpers";
import { ItemIconWithHover } from "./ItemIconWithHover";
import { NinjaPriceTooltip } from "./NinjaPriceTooltip";
import { PriceWithTooltip } from "./PriceWithTooltip";

interface ItemChipProps {
    item: RecipeItem;
}

export const ItemChip: React.FC<ItemChipProps> = ({ item }) => {
    const qty = item.qty;
    const qtyFmt = formatQty(qty);
    const iconUrl = item.icon;
    const name = item.name;

    const qtyBadge = qty !== 1 ? (
        qtyFmt.isRate
            ? <span className="font-bold text-gray-500 dark:text-gray-400">{qtyFmt.value}</span>
            : <span className="font-bold">{qtyFmt.value}x</span>
    ) : null;

    if (isTradeItem(item)) {
        const tradeData = item.item as TradeItem;
        if (!tradeData.resolved) return null;
        return (
            <div className="flex items-center gap-2 rounded px-2 py-1">
                {qtyBadge}
                <ItemIconWithHover
                    iconUrl={iconUrl}
                    name={name}
                    tradeUrl={tradeData.tradeUrl}
                    alt={name}
                />
                <PriceWithTooltip resolved={tradeData.resolved} />
            </div>
        );
    }

    if (isNinjaItem(item)) {
        return (
            <div className="flex items-center gap-2 rounded px-2 py-1">
                {qtyBadge}
                <ItemIconWithHover
                    iconUrl={iconUrl}
                    name={name}
                    tradeUrl={undefined}
                    alt={name}
                />
                <NinjaPriceTooltip item={item.item as NinjaItem} />
            </div>
        );
    }

    return null;
};
