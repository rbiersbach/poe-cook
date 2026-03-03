import React from "react";
import type { NinjaItem } from "../../api/generated/models/NinjaItem";
import type { RecipeItem } from "../../api/generated/models/RecipeItem";
import type { TradeItem } from "../../api/generated/models/TradeItem";
import { isNinjaItem, isTradeItem } from "../../utils/itemHelpers";
import ItemIcon from "../item/ItemIcon";
import { NinjaPriceTooltip } from "../item/NinjaPriceTooltip";
import { PriceWithTooltip } from "../item/PriceWithTooltip";
import { RemoveButton } from "../ui/RemoveButton";
import { TradeUrlLink } from "../item/TradeUrlLink";

export interface RecipeItemRowProps {
    item: RecipeItem | any;
    disableRemove?: boolean;
    onRemove?: () => void;
    onQtyChange?: (qty: number) => void;
}

export const RecipeItemRow: React.FC<RecipeItemRowProps> = ({
    item,
    disableRemove = false,
    onRemove,
    onQtyChange,
}) => {
    const itemName = item.name;
    const itemIcon = item.icon;
    const qty = item.qty;

    return (
        <div className="card-row border-primary flex items-center gap-0 min-h-11 max-h-13" style={{ overflow: 'hidden' }} data-testid="recipe-item-row-resolved">
            <ItemIcon src={itemIcon} alt="icon" className="w-7 h-7 shrink-0" />
            <span className="truncate flex-1 min-w-0">{itemName}</span>
            <span className="flex items-center">
                <input
                    type="number"
                    className="input w-22 min-w-0 max-w-22 text-center h-7 shrink-0"
                    value={qty ?? ''}
                    onChange={e => onQtyChange && onQtyChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    data-testid="qty-input"
                />
            </span>
            <div className="flex items-center gap-0.5 ml-auto">
                <span className="min-w-[2.2rem] text-right">
                    {isTradeItem(item) && (item.item as TradeItem).resolved ? (
                        <PriceWithTooltip resolved={(item.item as TradeItem).resolved!} />
                    ) : isNinjaItem(item) ? (
                        <NinjaPriceTooltip item={item.item as NinjaItem} />
                    ) : null}
                </span>
                {isTradeItem(item) && (item.item as TradeItem).tradeUrl && (
                    <span className="shrink-0"><TradeUrlLink url={(item.item as TradeItem).tradeUrl} className="p-1" /></span>
                )}
                {!disableRemove && (
                    <span className="shrink-0"><RemoveButton onClick={onRemove} data-testid="remove-input-button" className="p-1" /></span>
                )}
            </div>
        </div>
    );
};
