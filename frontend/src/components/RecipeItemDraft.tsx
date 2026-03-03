import React, { useState } from "react";
import type { NinjaItem } from "../api/generated/models/NinjaItem";
import { ItemSearchInput } from "./ItemSearchInput";
import { Loader } from "./Loader";

export interface RecipeItemDraftProps {
    error?: string | null;
    errorAnim?: boolean;
    item: { tradeUrl: string; qty: number | string };
    loading?: boolean;
    onChange?: (field: string, value: any) => void;
    onResolve?: () => void;
    onSelectNinja?: (item: NinjaItem) => void;
}

export const RecipeItemDraft: React.FC<RecipeItemDraftProps> = ({
    item,
    loading = false,
    onChange,
    onResolve,
    error = null,
    errorAnim = false,
    onSelectNinja,
}) => {
    const [focusedField, setFocusedField] = useState<'tradeUrl' | 'search' | null>(null);

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
            {error && (
                <span
                    className="form-error-msg"
                    data-testid="draft-error-msg"
                    style={{ animation: 'fade-in 0.3s ease' }}
                >
                    {error}
                </span>
            )}
        </div>
    );
};
