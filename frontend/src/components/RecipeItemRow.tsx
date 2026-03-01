import React from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { PriceDisplay } from "../components/PriceDisplay";
import { PriceWithTooltip } from "./PriceWithTooltip";
import ItemIcon from "./ItemIcon";
import { Loader } from "./Loader";
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
}) => {
    if (draft) {
        // Handler for Enter key on any input
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
            if (e.key === "Enter" && onResolve && !loading && item.tradeUrl) {
                onResolve();
            }
        };
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
                <input
                    type="text"
                    className="input"
                    placeholder="Trade URL"
                    value={item.tradeUrl}
                    onChange={e => onChange && onChange("tradeUrl", e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="trade-url-input"
                />
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
        return (
            <div className="card-row border-primary flex items-center gap-0 min-h-11 max-h-13" style={{ overflow: 'hidden' }} data-testid="recipe-item-row-resolved">
                <ItemIcon src={item.resolved?.iconUrl} alt="icon" className="w-7 h-7 shrink-0" />
                <span className="truncate flex-1 min-w-0">{item.resolved?.name || "Unknown Item"}</span>
                <span className="flex items-center">
                    <input
                        type="number"
                        className="input w-22 min-w-0 max-w-22 text-center h-7 shrink-0"
                        value={item.qty ?? ''}
                        onChange={e => onQtyChange && onQtyChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        data-testid="qty-input"
                    />
                </span>
                <div className="flex items-center gap-0.5 ml-auto">
                    <span className="min-w-[2.2rem] text-right">
                        {item.resolved ? (
                            <PriceWithTooltip resolved={item.resolved} />
                        ) : (
                            <PriceDisplay amount={item.resolved?.originalMinPrice?.amount} currency={item.resolved?.originalMinPrice?.currency} />
                        )}
                    </span>
                    {/* Trade URL link */}
                    {item.tradeUrl && (
                        <span className="shrink-0"><TradeUrlLink url={item.tradeUrl} className="p-1" /></span>
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
