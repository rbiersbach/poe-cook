import React, { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/generated/core/ApiError";
import type { NinjaItem } from "../../api/generated/models/NinjaItem";
import type { RecipeItem } from "../../api/generated/models/RecipeItem";
import { useRateLimit } from "../../context/RateLimitContext";
import { tradeUrlSchema } from "../../validation/schemas";
import { RecipeItemDraft } from "./RecipeItemDraft";
import { RecipeItemRow } from "./RecipeItemRow";

type TradeDraft = { tradeUrl: string; qty: number };

interface RecipeItemListProps {
    label: string;
    onResolvedChange: (resolved: RecipeItem[]) => void;
    initialResolved?: RecipeItem[];
    allowRemoveResolved?: boolean;
    resolveItem: (draft: TradeDraft) => Promise<RecipeItem>;
}

export const RecipeItemList: React.FC<RecipeItemListProps> = ({
    label,
    onResolvedChange,
    initialResolved = [],
    allowRemoveResolved = true,
    resolveItem,
}) => {
    const [draft, setDraft] = useState<TradeDraft>({ tradeUrl: "", qty: 1 });
    const [resolved, setResolved] = useState<RecipeItem[]>(initialResolved);
    const [resolving, setResolving] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftErrorAnim, setDraftErrorAnim] = useState(false);
    const lastResolvedUrl = useRef("");
    const { triggerRateLimit } = useRateLimit();

    // Auto-resolve when tradeUrl matches pattern
    useEffect(() => {
        if (draft.tradeUrl && tradeUrlSchema.safeParse(draft.tradeUrl).success && lastResolvedUrl.current !== draft.tradeUrl) {
            lastResolvedUrl.current = draft.tradeUrl;
            handleResolve();
        }
    }, [draft.tradeUrl]);

    useEffect(() => {
        onResolvedChange(resolved);
    }, [resolved, onResolvedChange]);

    const handleChange = (field: string, value: any) => {
        setDraft(prev => field === "tradeUrl" ? { ...prev, tradeUrl: value } : { ...prev, qty: value });
        setDraftError(null);
        setDraftErrorAnim(false);
    };

    const handleRemoveResolved = (idx: number) => {
        setResolved(items => items.filter((_, i) => i !== idx));
    };

    const handleQtyChange = (idx: number, qty: number) => {
        setResolved(items => items.map((ri, i) => i === idx ? { ...ri, qty } : ri));
    };

    const handleSelectNinja = useCallback((item: NinjaItem) => {
        setResolved(items => [...items, {
            qty: 1,
            type: 'ninja' as any,
            name: item.name,
            icon: item.icon,
            item,
        }]);
    }, []);

    const handleResolve = async () => {
        setResolving(true);
        setDraftError(null);
        setDraftErrorAnim(false);
        try {
            const currentDraft = draft;
            const resolvedItem = await resolveItem(currentDraft);
            setResolved(items => [...items, resolvedItem]);
            setDraft({ tradeUrl: "", qty: 1 });
            lastResolvedUrl.current = "";
        } catch (e) {
            if (e instanceof ApiError && e.status === 429) {
                triggerRateLimit(e.body?.error ?? e.message);
            }
            const msg =
                e instanceof ApiError && e.status === 403
                    ? "Session expired: POE session ID is invalid or not set on the server."
                    : e instanceof ApiError && e.status === 429
                        ? "Rate limited by PoE servers"
                        : "Failed to resolve item";
            setDraftError(msg);
            setDraftErrorAnim(true);
            setTimeout(() => setDraftErrorAnim(false), 800);
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-2" data-testid={`recipe-item-list-${label.toLowerCase()}`}>{label}</h3>
            <div className="flex flex-col gap-2">
            {resolved.map((item, idx) => (
                <RecipeItemRow
                    key={"resolved-" + idx}
                    item={item}
                    onQtyChange={qty => handleQtyChange(idx, qty)}
                    onRemove={allowRemoveResolved ? () => handleRemoveResolved(idx) : undefined}
                />
            ))}
            <RecipeItemDraft
                item={draft}
                loading={resolving}
                onChange={handleChange}
                onResolve={handleResolve}
                onSelectNinja={handleSelectNinja}
                error={draftError}
                errorAnim={draftErrorAnim}
            />
            </div>
        </div>
    );
};
