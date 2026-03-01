import React, { useEffect, useRef, useState } from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { RecipeItemList } from "./RecipeItemList";

interface RecipeItemDraftManagerProps {
    label: string;
    tradeUrlPattern: RegExp;
    onResolvedChange: (resolved: RecipeItem[]) => void;
    initialDrafts?: RecipeItem[];
    initialResolved?: RecipeItem[];
    allowRemoveResolved?: boolean;
    resolveItem: (draft: RecipeItem) => Promise<RecipeItem>;
}

export const RecipeItemDraftManager: React.FC<RecipeItemDraftManagerProps> = ({
    label,
    tradeUrlPattern,
    onResolvedChange,
    initialDrafts = [
        { tradeUrl: "", qty: 1 }
    ],
    initialResolved = [],
    allowRemoveResolved = true,
    resolveItem,
}) => {
    const [drafts, setDrafts] = useState<RecipeItem[]>(initialDrafts);
    const [resolved, setResolved] = useState<RecipeItem[]>(initialResolved);
    const [resolvingIdx, setResolvingIdx] = useState<number | null>(null);
    const [draftErrors, setDraftErrors] = useState<(string | null)[]>([]);
    const [draftErrorAnims, setDraftErrorAnims] = useState<boolean[]>([]);
    const lastResolvedUrls = useRef<string[]>([]);

    // Always ensure at least one empty draft exists
    useEffect(() => {
        setDrafts(drafts => {
            if (drafts.length === 0) {
                return [
                    { tradeUrl: "", qty: 1 }
                ];
            }
            return drafts;
        });
    }, [drafts.length]);

    // Auto-resolve when tradeUrl changes and matches pattern (for all rows)
    useEffect(() => {
        drafts.forEach((draft, idx) => {
            if (
                draft.tradeUrl &&
                tradeUrlPattern.test(draft.tradeUrl) &&
                lastResolvedUrls.current[idx] !== draft.tradeUrl
            ) {
                lastResolvedUrls.current[idx] = draft.tradeUrl;
                handleResolve(idx);
            }
        });
        // Clean up removed drafts
        lastResolvedUrls.current = drafts.map(d => d.tradeUrl ?? "");
    }, [drafts]);

    useEffect(() => {
        onResolvedChange(resolved);
    }, [resolved, onResolvedChange]);

    const handleChange = (idx: number, field: string, value: any) => {
        setDrafts(drafts => {
            const updated = [...drafts];
            if (field === "tradeUrl") {
                updated[idx].tradeUrl = value;
            } else if (field === "qty") {
                updated[idx].qty = value;
            }
            return updated;
        });
        setDraftErrors(errors => {
            const updated = [...errors];
            updated[idx] = null;
            return updated;
        });
        setDraftErrorAnims(anims => {
            const updated = [...anims];
            updated[idx] = false;
            return updated;
        });
    };

    const handleRemoveDraft = (idx: number) => {
        setDrafts(drafts => drafts.filter((_, i) => i !== idx));
        setDraftErrors(errors => errors.filter((_, i) => i !== idx));
        setDraftErrorAnims(anims => anims.filter((_, i) => i !== idx));
    };

    const handleRemoveResolved = (idx: number) => {
        setResolved(items => items.filter((_, i) => i !== idx));
    };

    const handleQtyChange = (idx: number, qty: number) => {
        setResolved(items => items.map((ri, i) => i === idx ? { ...ri, qty } : ri));
    };

    const handleResolve = async (idx: number) => {
        setResolvingIdx(idx);
        setDraftErrors(errors => {
            const updated = [...errors];
            updated[idx] = null;
            return updated;
        });
        setDraftErrorAnims(anims => {
            const updated = [...anims];
            updated[idx] = false;
            return updated;
        });
        try {
            const draft = drafts[idx];
            const resolvedItem = await resolveItem(draft);
            setResolved(items => [...items, resolvedItem]);
            // Remove the resolved draft
            setDrafts(drafts => {
                const updated = drafts.filter((_, i) => i !== idx);
                // Always add a new empty draft if none left
                return updated.length === 0
                    ? [{ tradeUrl: "", qty: 1 }]
                    : updated;
            });
            setDraftErrors(errors => errors.filter((_, i) => i !== idx));
            setDraftErrorAnims(anims => anims.filter((_, i) => i !== idx));
        } catch (e) {
            setDraftErrors(errors => {
                const updated = [...errors];
                updated[idx] = "Failed to resolve item";
                return updated;
            });
            setDraftErrorAnims(anims => {
                const updated = [...anims];
                updated[idx] = true;
                return updated;
            });
            setTimeout(() => {
                setDraftErrorAnims(anims => {
                    const updated = [...anims];
                    updated[idx] = false;
                    return updated;
                });
            }, 800);
        } finally {
            setResolvingIdx(null);
        }
    };

    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-2">{label}</h3>
            <RecipeItemList
                items={resolved}
                resolved
                onQtyChange={handleQtyChange}
                onRemove={allowRemoveResolved ? handleRemoveResolved : undefined}
            />
            <RecipeItemList
                items={drafts}
                draft
                loadingIdx={resolvingIdx}
                onChange={handleChange}
                onRemove={handleRemoveDraft}
                onResolve={handleResolve}
                errors={draftErrors}
                errorAnims={draftErrorAnims}
            />
        </div>
    );
};
