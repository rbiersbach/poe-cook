import React from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { PriceDisplay } from "../components/PriceDisplay";
import { Loader } from "./Loader";

interface RecipeItemRowProps {
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
}) => {
    if (draft) {
        // Handler for Enter key on any input
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
            if (e.key === "Enter" && onResolve && !loading && item.tradeUrl) {
                onResolve();
            }
        };
        return (
            <div className="mb-2 p-2 border rounded flex items-center gap-4 w-full relative" data-testid="recipe-item-row-draft">
                {/* Overlay when loading */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10 rounded" data-testid="loader-overlay">
                        <Loader size={28} />
                    </div>
                )}
                <input
                    type="text"
                    className="border px-2 py-1 rounded w-64"
                    placeholder="Trade URL"
                    value={item.tradeUrl}
                    onChange={e => onChange && onChange("tradeUrl", e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="trade-url-input"
                />
                <input
                    type="number"
                    className="border px-2 py-1 rounded w-20"
                    min={1}
                    value={item.qty}
                    onChange={e => onChange && onChange("qty", Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="qty-input"
                />
                <input
                    type="number"
                    className="border px-2 py-1 rounded w-24"
                    placeholder="Fallback Price"
                    value={item.fallbackPrice?.amount || ""}
                    onChange={e => onChange && onChange("fallbackPrice.amount", e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="fallback-price-input"
                />
                <select
                    className="border px-2 py-1 rounded w-24"
                    value={item.fallbackPrice?.currency || "chaos"}
                    onChange={e => onChange && onChange("fallbackPrice.currency", e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    data-testid="currency-select"
                >
                    <option value="chaos">chaos</option>
                    <option value="divine">divine</option>
                </select>
                {!disableRemove && (
                    <button
                        className="text-red-600 hover:underline ml-2"
                        onClick={onRemove}
                        disabled={loading}
                        data-testid="remove-input-button"
                    >
                        Remove
                    </button>
                )}
            </div>
        );
    }

    if (resolved) {
        return (
            <div className="flex items-center gap-4 mb-2 p-2 border rounded bg-gray-50" data-testid="recipe-item-row-resolved">
                <img src={item.resolved?.iconUrl} alt="icon" className="w-8 h-8" />
                <span>{item.resolved?.name || "Unknown Item"}</span>
                <span className="flex items-center gap-1">
                    Qty:
                    <button
                        className="px-1 text-lg border rounded bg-gray-200 hover:bg-gray-300"
                        onClick={() => onQtyChange && onQtyChange(Math.max(1, item.qty - 1))}
                        aria-label="Decrease quantity"
                        type="button"
                    >
                        &#8595;
                    </button>
                    <span className="mx-1">{item.qty}</span>
                    <button
                        className="px-1 text-lg border rounded bg-gray-200 hover:bg-gray-300"
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
                {!disableRemove && (
                    <button
                        className="text-red-600 hover:underline ml-2"
                        onClick={onRemove}
                    >
                        Remove
                    </button>
                )}
            </div>
        );
    }

    return null;
};
