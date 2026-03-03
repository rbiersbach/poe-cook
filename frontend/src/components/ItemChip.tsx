import type { NinjaItem } from "api/generated/models/NinjaItem";
import { RecipeItem } from "api/generated/models/RecipeItem";
import type { TradeItem } from "api/generated/models/TradeItem";
import React from "react";
import { isNinjaItem, isTradeItem } from "../utils/itemHelpers";
import { ItemIconWithHover } from "./ItemIconWithHover";
import { NinjaPriceTooltip } from "./NinjaPriceTooltip";
import { PriceWithTooltip } from "./PriceWithTooltip";

interface ItemChipProps {
    item: RecipeItem;
}

export const ItemChip: React.FC<ItemChipProps> = ({ item }) => {
    const qty = item.qty;
    const iconUrl = item.icon;
    const name = item.name;

    if (isTradeItem(item)) {
        const tradeData = item.item as TradeItem;
        if (!tradeData.resolved) return null;
        return (
            <div className="item-chip flex items-center gap-2 rounded px-2 py-1">
                {qty !== 1 && <span className="item-qty font-bold">{qty}x</span>}
                <ItemIconWithHover
                    iconUrl={iconUrl}
                    name={name}
                    tradeUrl={tradeData.tradeUrl}
                    alt={name}
                    className="item-icon"
                />
                <PriceWithTooltip resolved={tradeData.resolved} />
            </div>
        );
    }

    if (isNinjaItem(item)) {
        return (
            <div className="item-chip flex items-center gap-2 rounded px-2 py-1">
                {qty !== 1 && <span className="item-qty font-bold">{qty}x</span>}
                <ItemIconWithHover
                    iconUrl={iconUrl}
                    name={name}
                    tradeUrl={undefined}
                    alt={name}
                    className="item-icon"
                />
                <NinjaPriceTooltip item={item.item as NinjaItem} />
            </div>
        );
    }

    return null;
};
