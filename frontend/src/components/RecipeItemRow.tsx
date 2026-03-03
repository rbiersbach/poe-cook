import React, { useState } from "react";
import type { NinjaItem } from "../api/generated/models/NinjaItem";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import type { TradeItem } from "../api/generated/models/TradeItem";
import { isNinjaItem, isTradeItem } from "../utils/itemHelpers";
import ItemIcon from "./ItemIcon";
import { ItemSearchInput } from "./ItemSearchInput";
import { Loader } from "./Loader";
import { NinjaPriceTooltip } from "./NinjaPriceTooltip";
import { PriceWithTooltip } from "./PriceWithTooltip";
import { RemoveButton } from "./RemoveButton";
import { TradeUrlLink } from "./TradeUrlLink";

interface RecipeItemRowProps {
    error?: string | null;
    errorAnim?: boolean;
    item: RecipeItem | any;
    draft?: boolean;
    resolved?: boolean;
    disableRemove?: boolean;
    loading?: boolean;
    onChange?: (field: string, value: any) => void;
    onRemove?: () => void;
    onResolve?: () => void;
    onQtyChange?: (qty: number) => void;
    onSelectNinja?: (item: NinjaItem) => void;
}

export const RecipeItemRow: React.FC<RecipeItemRowProps> = ({
    item,
    draft = false,
    resolved = false,
    disableRemove = false,
    loading = false,
    onChange,
    onRemove,
    onResolve,
    onQtyChange,
    error = null,
    errorAnim = false,
    onSelectNinja,
}) => {
    const [focusedField, setFocusedField] = useState<'tradeUrl' | 'search' | null>(null);

    if (draft) {
        // Handler for Enter key on any input
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
            if (e.key === "Enter" && onResolve && !loading && item.tradeUrl) {
                onResolve();
            }
        };
        const hideTradeUrl = focusedField === 'search';
        const hideSearch = focusedField === 'tradeUrl';
        return (
            <div
                className={`card-row border-primary${errorAnim ? ' bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-500' : ''} relative`}
                data-testid="recipe-item-row-draft"
            >
                {/* Overlay when loading */}
                {loading && (
                    <div className="row-loader-overlay" data-testid="loader-overlay">
                        <Loader size={28} />
                    </div>
                )}
                <span className={`flex-1 min-w-0 transition-all duration-200${hideTradeUrl ? ' hidden' : ''}`}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Paste Trade URL"
                        value={item.tradeUrl}
                        onChange={e => onChange && onChange("tradeUrl", e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocusedField('tradeUrl')}
                        onBlur={() => setFocusedField(null)}
                        disabled={loading}
                        data-testid="trade-url-input"
                    />
                </span>
                <span className={`text-sm text-gray-400 shrink-0${focusedField ? ' hidden' : ''}`}>or</span>
                <span className={`flex-1 min-w-0 transition-all duration-200${hideSearch ? ' hidden' : ''}`} data-testid="ninja-item-search">
                    <ItemSearchInput
                        onSelect={item => onSelectNinja && onSelectNinja(item)}
                        placeholder="Search poe.ninja"
                        disabled={loading}
                        onFocus={() => setFocusedField('search')}
                        onBlur={() => setFocusedField(null)}
                    />
                </span>
                <span className="flex items-center">
                    <input
                        type="number"
                        className="input w-22 min-w-0 max-w-22 text-center shrink-0"
                        value={item.qty ?? ''}
                        onChange={e => onChange && onChange("qty", e.target.value === '' ? '' : Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        data-testid="qty-input"
                    />
                </span>
                {!disableRemove && (
                    <RemoveButton
                        onClick={onRemove}
                        disabled={loading}
                        data-testid="remove-input-button"
                    />
                )}
                {error && (
                    <span
                        className="form-error-msg"
                        data-testid="draft-error-msg"
                        style={{
                            animation: 'fade-in 0.3s ease',
                        }}
                    >
                        {error}
                    </span>
                )}
            </div>
        );
    }

    if (resolved) {
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
    }

    return null;
};
