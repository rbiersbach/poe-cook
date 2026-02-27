import { RecipeItem } from "api/generated/models/RecipeItem";
import React from "react";
import { ItemIconWithHover } from "./ItemIconWithHover";
import { PriceWithTooltip } from "./PriceWithTooltip";

interface ItemChipProps {
    item: RecipeItem;
}

export const ItemChip: React.FC<ItemChipProps> = ({ item }) => {
    const resolved = item.resolved;
    if (!resolved) return null;
    return (
        <div className="item-chip flex items-center gap-2 rounded px-2 py-1">
            <ItemIconWithHover
                iconUrl={resolved.iconUrl || ""}
                name={resolved.name}
                tradeUrl={item.tradeUrl}
                alt={resolved.name || "icon"}
                className="item-icon"
            />
            <span className="item-qty font-bold">{item.qty}x</span>
            <PriceWithTooltip resolved={resolved} />
        </div>
    );
};
