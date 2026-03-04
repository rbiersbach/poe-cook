import { useContext, useEffect, useState } from "react";
import type { RecipeItem } from "../api/generated/models/RecipeItem";
import { DefaultService } from "../api/generated/services/DefaultService";
import { RecipeEditContext, RecipesListRefetchContext } from "../App";
import { RecipeItemList } from "../components/recipe/RecipeItemList";
import { Button } from "../components/ui/Button";
import { ErrorMessage, SuccessMessage } from "../components/ui/SectionHeader";
import { TextInput } from "../components/ui/TextInput";
import { useLeague } from "../context/LeagueContext";
import { createRecipeSchema } from "../validation/schemas";

type TradeDraft = { tradeUrl: string; qty: number };

export default function CreateRecipePage() {
    const [name, setName] = useState("");
    const [hasAutofilled, setHasAutofilled] = useState(false);
    const refetchRecipes = useContext(RecipesListRefetchContext);
    const editContext = useContext(RecipeEditContext);
    const selectedRecipe = editContext?.selectedRecipe ?? null;
    const setSelectedRecipe = editContext?.setSelectedRecipe ?? (() => { });
    const { league } = useLeague();

    const [resolvedInputs, setResolvedInputs] = useState<RecipeItem[]>([]);
    const [resolvedOutputs, setResolvedOutputs] = useState<RecipeItem[]>([]);
    const [resetKey, setResetKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Prefill form when editing
    useEffect(() => {
        if (selectedRecipe) {
            setName(selectedRecipe.name);
            setResolvedInputs(selectedRecipe.inputs);
            setResolvedOutputs(selectedRecipe.outputs);
            setHasAutofilled(true);
            setResetKey(k => k + 1); // Remount form when editing
        }
    }, [selectedRecipe]);

    const resolveItem = async (draft: TradeDraft): Promise<RecipeItem> => {
        const res = await DefaultService.postApiLeagueResolveItem(league!.id, { tradeUrl: draft.tradeUrl! });
        return {
            qty: draft.qty,
            type: 'trade' as any,
            name: res.resolved?.name ?? '',
            icon: res.resolved?.iconUrl ?? '',
            item: {
                tradeUrl: draft.tradeUrl,
                search: res.search || { query: { tradeUrl: draft.tradeUrl }, sort: {} },
                resolved: res.resolved,
            },
        } as RecipeItem;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            let recipeName = name.trim();
            // Autofill name if empty and possible
            if (!recipeName && resolvedOutputs.length > 0) {
                const firstOutput = resolvedOutputs[0];
                const outputName = firstOutput.name;
                if (outputName && outputName !== 'Unknown Item') {
                    recipeName = outputName;
                    setName(recipeName);
                    setHasAutofilled(true);
                }
            }
            const validation = createRecipeSchema.safeParse({
                name: recipeName,
                inputs: resolvedInputs,
                outputs: resolvedOutputs,
            });
            if (!validation.success) {
                const { name: nameErr, inputs: inputsErr, outputs: outputsErr } = validation.error.flatten().fieldErrors;
                setError(nameErr?.[0] ?? inputsErr?.[0] ?? outputsErr?.[0] ?? "Invalid form data.");
                setLoading(false);
                return;
            }

            if (selectedRecipe) {
                // Update existing recipe
                await DefaultService.putApiLeagueRecipeById(league!.id, selectedRecipe.id, {
                    name: recipeName,
                    inputs: resolvedInputs,
                    outputs: resolvedOutputs,
                });
                setSuccess("Recipe updated successfully!");
            } else {
                // Create new recipe
                await DefaultService.postApiLeagueRecipes(league!.id, {
                    name: recipeName,
                    inputs: resolvedInputs,
                    outputs: resolvedOutputs,
                });
                setSuccess("Recipe submitted successfully!");
            }

            setName("");
            setHasAutofilled(false);
            setResolvedInputs([]);
            setResolvedOutputs([]);
            setResetKey(k => k + 1);
            setSelectedRecipe(null);
            if (refetchRecipes) refetchRecipes();
        } catch (e) {
            setError(selectedRecipe ? "Failed to update recipe" : "Failed to submit recipe");
        } finally {
            setLoading(false);
        }
    };

    // Autofill name if first output is resolved and name is empty
    // Autofill name only once if first output is resolved and name is empty
    useEffect(() => {
        // Autofill name as soon as first output is resolved and name is empty
        if (!selectedRecipe && !hasAutofilled && !name && resolvedOutputs.length > 0) {
            const firstOutput = resolvedOutputs[0];
            const outputName = firstOutput.name;
            if (outputName && outputName !== 'Unknown Item') {
                setName(outputName);
                setHasAutofilled(true);
            }
        }
    }, [resolvedOutputs, selectedRecipe]);

    // Auto-clear success/error messages after 4 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    if (!league) {
        return (
            <div className="max-w-2xl mx-auto p-6 card shadow">
                <p className="text-muted" data-testid="no-league-message">Please select a league to create recipes.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 card shadow">
            <h1 className="text-2xl font-bold mb-4">{selectedRecipe ? "Edit Recipe" : "Create Recipe"}</h1>
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
            <RecipeItemList
                key={`inputs-${resetKey}`}
                label="Inputs"
                onResolvedChange={setResolvedInputs}
                initialResolved={selectedRecipe ? resolvedInputs : []}
                allowRemoveResolved={true}
                resolveItem={resolveItem}
            />
            <RecipeItemList
                key={`outputs-${resetKey}`}
                label="Outputs"
                onResolvedChange={setResolvedOutputs}
                initialResolved={selectedRecipe ? resolvedOutputs : []}
                allowRemoveResolved={true}
                resolveItem={resolveItem}
            />
            <Button
                color="blue"
                className="px-4 py-2 rounded"
                onClick={handleSubmit}
                disabled={loading || resolvedOutputs.length === 0 || resolvedInputs.length === 0}
            >
                {loading ? (selectedRecipe ? "Updating..." : "Submitting...") : (selectedRecipe ? "Update Recipe" : "Submit Recipe")}
            </Button>
        </div>
    );
}
