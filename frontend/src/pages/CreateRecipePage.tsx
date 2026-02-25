import { RecipeItemList } from "components/RecipeItemList";
import { useEffect, useRef, useState } from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { DefaultService } from "../api/generated/services/DefaultService";
import { Button } from "../components/Button";
import { RecipeItemRow } from "../components/RecipeItemRow";
import { ErrorMessage, SectionHeader, SuccessMessage } from "../components/SectionHeader";

export default function CreateRecipePage() {
    // Editable input/output form state
    const [inputDrafts, setInputDrafts] = useState([
        { tradeUrl: "", qty: 1, fallbackPrice: { amount: 0, currency: "chaos" } }
    ]);
    const [outputDraft, setOutputDraft] = useState({ tradeUrl: "", qty: 1, fallbackPrice: { amount: 0, currency: "chaos" } });
    // Resolved items state
    const [resolvedInputs, setResolvedInputs] = useState<RecipeItem[]>([]);
    const [resolvedOutput, setResolvedOutput] = useState<RecipeItem | null>(null);
    const lastResolvedInputUrls = useRef<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [resolvingInputIdx, setResolvingInputIdx] = useState<number | null>(null);
    const [resolvingOutput, setResolvingOutput] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Handlers for input fields
    const tradeUrlPattern = /^https:\/\/www\.pathofexile\.com\/trade\/search\/[A-Za-z]+\/[A-Za-z0-9]{10}$/;

    const handleInputChange = (
        idx: number,
        field: string,
        value: any
    ) => {
        setInputDrafts(drafts => {
            const updated = [...drafts];
            if (field === "fallbackPrice.amount") {
                updated[idx].fallbackPrice = { ...updated[idx].fallbackPrice, amount: Number(value) };
            } else if (field === "fallbackPrice.currency") {
                updated[idx].fallbackPrice = { ...updated[idx].fallbackPrice, currency: value };
            } else if (field === "tradeUrl") {
                updated[idx].tradeUrl = value;
            } else if (field === "qty") {
                updated[idx].qty = value;
            }
            return updated;
        });
    };
    // useEffect to auto-resolve input drafts when tradeUrl changes and matches pattern
    useEffect(() => {
        // Always ensure at least one empty draft exists
        setInputDrafts(drafts => {
            if (drafts.length === 0) {
                return [
                    ...drafts,
                    { tradeUrl: "", qty: 1, fallbackPrice: { amount: 0, currency: "chaos" } }
                ];
            }
            return drafts;
        });
        inputDrafts.forEach((draft, idx) => {
            if (
                draft.tradeUrl &&
                tradeUrlPattern.test(draft.tradeUrl) &&
                lastResolvedInputUrls.current[idx] !== draft.tradeUrl
            ) {
                lastResolvedInputUrls.current[idx] = draft.tradeUrl;
                handleResolveInput(idx);
            }
        });
        // Clean up removed drafts
        lastResolvedInputUrls.current = lastResolvedInputUrls.current.slice(0, inputDrafts.length);
    }, [inputDrafts]);

    const handleAddInput = () => {
        setInputDrafts(drafts => [
            ...drafts,
            { tradeUrl: "", qty: 1, fallbackPrice: { amount: 0, currency: "chaos" } }
        ]);
    };

    const handleRemoveInputDraft = (idx: number) => {
        setInputDrafts(drafts => drafts.filter((_, i) => i !== idx));
    };

    const handleOutputChange = (field: string, value: any) => {
        setOutputDraft(draft => {
            if (field === "fallbackPrice.amount") {
                return { ...draft, fallbackPrice: { ...draft.fallbackPrice, amount: Number(value) } };
            } else if (field === "fallbackPrice.currency") {
                return { ...draft, fallbackPrice: { ...draft.fallbackPrice, currency: value } };
            } else {
                return { ...draft, [field]: value };
            }
        });
    };
    const lastResolvedOutputUrl = useRef<string>("");
    // useEffect to auto-resolve output draft when tradeUrl changes and matches pattern
    useEffect(() => {
        if (
            outputDraft.tradeUrl &&
            tradeUrlPattern.test(outputDraft.tradeUrl) &&
            lastResolvedOutputUrl.current !== outputDraft.tradeUrl
        ) {
            lastResolvedOutputUrl.current = outputDraft.tradeUrl;
            handleResolveOutput();
        }
    }, [outputDraft]);

    // Remove a resolved input item
    const handleRemoveResolvedInput = (idx: number) => {
        setResolvedInputs(inputs => inputs.filter((_, i) => i !== idx));
    };

    // Remove resolved output
    const handleRemoveResolvedOutput = () => {
        setResolvedOutput(null);
    };

    // Submit to resolve inputs/outputs
    const handleResolveInput = async (idx: number) => {
        setResolvingInputIdx(idx);
        setError(null);
        try {
            const draft = inputDrafts[idx];
            const res = await DefaultService.postApiResolveItem({ tradeUrl: draft.tradeUrl });
            setResolvedInputs(inputs => [
                ...inputs,
                {
                    tradeUrl: draft.tradeUrl,
                    search: res.search || { query: { tradeUrl: draft.tradeUrl }, sort: {} },
                    qty: draft.qty,
                    fallbackPrice: draft.fallbackPrice,
                    resolved: res.resolved,
                },
            ]);
            // Remove from drafts
            setInputDrafts(drafts => drafts.filter((_, i) => i !== idx));
        } catch (e) {
            setError("Failed to resolve item");
        } finally {
            setResolvingInputIdx(null);
        }
    };

    const handleResolveOutput = async () => {
        setResolvingOutput(true);
        setError(null);
        try {
            const draft = outputDraft;
            const res = await DefaultService.postApiResolveItem({ tradeUrl: draft.tradeUrl });
            setResolvedOutput({
                tradeUrl: draft.tradeUrl,
                search: res.search || { query: { tradeUrl: draft.tradeUrl }, sort: {} },
                qty: draft.qty,
                fallbackPrice: draft.fallbackPrice,
                resolved: res.resolved,
            });
            // Clear output draft
            setOutputDraft({ tradeUrl: "", qty: 1, fallbackPrice: { amount: 0, currency: "chaos" } });
        } catch (e) {
            setError("Failed to resolve output item");
        } finally {
            setResolvingOutput(false);
        }
    };

    // Submit the recipe
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (!resolvedOutput || resolvedInputs.length === 0) {
                setError("Please resolve at least one input and the output item.");
                setLoading(false);
                return;
            }
            await DefaultService.postApiRecipes({
                inputs: resolvedInputs,
                output: resolvedOutput,
            });
            setSuccess("Recipe submitted successfully!");
            setResolvedInputs([]);
            setResolvedOutput(null);
        } catch (e) {
            setError("Failed to submit recipe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Create Recipe</h1>
            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}
            <div className="mb-6">
                <SectionHeader>Inputs</SectionHeader>
                {/* Resolved inputs first, then editable drafts */}
                <RecipeItemList
                    items={resolvedInputs}
                    resolved
                    onQtyChange={(idx, qty) => setResolvedInputs(inputs => inputs.map((ri, i) => i === idx ? { ...ri, qty } : ri))}
                    onRemove={handleRemoveResolvedInput}
                />
                <RecipeItemList
                    items={inputDrafts}
                    draft
                    loadingIdx={resolvingInputIdx}
                    onChange={handleInputChange}
                    onRemove={handleRemoveInputDraft}
                    onResolve={handleResolveInput}
                />
            </div>
            <div className="mb-6">
                <SectionHeader>Output</SectionHeader>
                {/* Editable output draft */}
                {!resolvedOutput && (
                    <RecipeItemRow
                        item={outputDraft}
                        draft
                        disableRemove
                        loading={resolvingOutput}
                        onChange={handleOutputChange}
                        onResolve={handleResolveOutput}
                    />
                )}
                {/* Resolved output */}
                {resolvedOutput && (
                    <RecipeItemRow
                        item={resolvedOutput}
                        resolved
                        disableRemove={false}
                        onQtyChange={qty => setResolvedOutput(ro => ro ? { ...ro, qty } : ro)}
                        onRemove={handleRemoveResolvedOutput}
                    />
                )}
            </div>
            <Button
                color="blue"
                className="px-4 py-2 rounded"
                onClick={handleSubmit}
                disabled={loading || !resolvedOutput || resolvedInputs.length === 0}
            >
                {loading ? "Submitting..." : "Submit Recipe"}
            </Button>
        </div>
    );
}
