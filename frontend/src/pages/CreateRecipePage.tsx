import { useContext, useEffect, useState } from "react";
import { TextInput } from "../components/TextInput";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { DefaultService } from "../api/generated/services/DefaultService";
import { RecipesListRefetchContext } from "../App";
import { Button } from "../components/Button";
import { RecipeItemDraftManager } from "../components/RecipeItemDraftManager";
import { ErrorMessage, SuccessMessage } from "../components/SectionHeader";

export default function CreateRecipePage() {
    const [name, setName] = useState("");
    const [hasAutofilled, setHasAutofilled] = useState(false);
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
            let recipeName = name.trim();
            // Autofill name if empty and possible
            if (!recipeName && resolvedOutputs.length > 0 && resolvedOutputs[0]?.resolved?.name) {
                recipeName = resolvedOutputs[0].resolved.name;
                setName(recipeName);
                setHasAutofilled(true);
            }
            if (!recipeName) {
                setError("Recipe name is required.");
                setLoading(false);
                return;
            }
            if (resolvedOutputs.length === 0 || resolvedInputs.length === 0) {
                setError("Please resolve at least one input and one output item.");
                setLoading(false);
                return;
            }
            await DefaultService.postApiRecipes({
                name: recipeName,
                inputs: resolvedInputs,
                outputs: resolvedOutputs,
            });
            setSuccess("Recipe submitted successfully!");
            setName("");
            setHasAutofilled(false);
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

    // Autofill name if first output is resolved and name is empty
    // Autofill name only once if first output is resolved and name is empty
    useEffect(() => {
        // Autofill name as soon as first output is resolved and name is empty
        if (!hasAutofilled && !name && resolvedOutputs.length > 0 && resolvedOutputs[0]?.resolved?.name) {
            setName(resolvedOutputs[0].resolved.name);
            setHasAutofilled(true);
        }
    }, [resolvedOutputs]);

    return (
        <div className="max-w-2xl mx-auto p-6 container rounded shadow">
            <h1 className="text-2xl font-bold mb-4 header">Create Recipe</h1>
            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}
            <div className="mb-4">
                <label htmlFor="recipe-name" className="block font-semibold mb-1">Recipe Name <span className="text-red-500">*</span></label>
                <TextInput
                    id="recipe-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    showClear={true}
                    onClear={() => setName("")}
                    placeholder="Recipe name"
                    data-testid="recipe-name-input"
                    required
                />
            </div>
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
