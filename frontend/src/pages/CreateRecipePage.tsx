import { useState, useContext } from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { DefaultService } from "../api/generated/services/DefaultService";
import { Button } from "../components/Button";
import { RecipeItemDraftManager } from "../components/RecipeItemDraftManager";
import { ErrorMessage, SuccessMessage } from "../components/SectionHeader";
import { RecipesListRefetchContext } from "../App";

export default function CreateRecipePage() {
    const refetchRecipes = useContext(RecipesListRefetchContext);
    const [resolvedInputs, setResolvedInputs] = useState<RecipeItem[]>([]);
    const [resolvedOutputs, setResolvedOutputs] = useState<RecipeItem[]>([]);
    const [resetKey, setResetKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const tradeUrlPattern = /^https:\/\/www\.pathofexile\.com\/trade\/search\/[A-Za-z]+\/[A-Za-z0-9]{10}$/;

    // Real resolve logic for RecipeItemDraftManager
    const resolveItem = async (draft: RecipeItem) => {
        const res = await DefaultService.postApiResolveItem({ tradeUrl: draft.tradeUrl! });
        return {
            tradeUrl: draft.tradeUrl,
            search: res.search || { query: { tradeUrl: draft.tradeUrl }, sort: {} },
            qty: draft.qty,
            resolved: res.resolved,
        } as RecipeItem;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (resolvedOutputs.length === 0 || resolvedInputs.length === 0) {
                setError("Please resolve at least one input and one output item.");
                setLoading(false);
                return;
            }
            await DefaultService.postApiRecipes({
                name: resolvedOutputs[0]?.resolved?.name || "Recipe",
                inputs: resolvedInputs,
                outputs: resolvedOutputs,
            });
            setSuccess("Recipe submitted successfully!");
            setResolvedInputs([]);
            setResolvedOutputs([]);
            setResetKey(k => k + 1);
            if (refetchRecipes) refetchRecipes();
        } catch (e) {
            setError("Failed to submit recipe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 container rounded shadow">
            <h1 className="text-2xl font-bold mb-4 header">Create Recipe</h1>
            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}
            <RecipeItemDraftManager
                key={`inputs-${resetKey}`}
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
                onResolvedChange={setResolvedInputs}
                allowRemoveResolved={true}
                resolveItem={resolveItem}
            />
            <RecipeItemDraftManager
                key={`outputs-${resetKey}`}
                label="Outputs"
                tradeUrlPattern={tradeUrlPattern}
                onResolvedChange={setResolvedOutputs}
                allowRemoveResolved={true}
                resolveItem={resolveItem}
            />
            <Button
                color="blue"
                className="px-4 py-2 rounded"
                onClick={handleSubmit}
                disabled={loading || resolvedOutputs.length === 0 || resolvedInputs.length === 0}
            >
                {loading ? "Submitting..." : "Submit Recipe"}
            </Button>
        </div>
    );
}
