import React from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { PriceDisplay } from "../components/PriceDisplay";
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
                <input
                    type="number"
                    className="input w-20"
                    min={1}
                    value={item.qty}
                    onChange={e => onChange && onChange("qty", Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="qty-input"
                />
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
            <div className="card-row border-primary flex items-center" data-testid="recipe-item-row-resolved">
                <ItemIcon src={item.resolved?.iconUrl} alt="icon" className="w-8 h-8" />
                <span>{item.resolved?.name || "Unknown Item"}</span>
                <span className="flex items-center gap-1">
                    Qty:
                    <button
                        className="qty-btn"
                        onClick={() => onQtyChange && onQtyChange(Math.max(1, item.qty - 1))}
                        aria-label="Decrease quantity"
                        type="button"
                    >
                        &#8595;
                    </button>
                    <span className="mx-1">{item.qty}</span>
                    <button
                        className="qty-btn"
                        onClick={() => onQtyChange && onQtyChange(item.qty + 1)}
                        aria-label="Increase quantity"
                        type="button"
                    >
                        &#8593;
                    </button>
                </span>
                <span>
                    Price: <PriceDisplay amount={item.resolved?.originalMinPrice?.amount} currency={item.resolved?.originalMinPrice?.currency} />
                </span>
                {/* Trade URL link */}
                {item.tradeUrl && (
                    <TradeUrlLink url={item.tradeUrl} />
                )}
                {!disableRemove && (
                    <RemoveButton
                        onClick={onRemove}
                        data-testid="remove-input-button"
                    />
                )}
            </div>
        );
    }

    return null;
};
