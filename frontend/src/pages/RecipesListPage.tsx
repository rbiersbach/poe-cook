import { Recipe } from "api/generated/models/Recipe";
import { DefaultService } from "api/generated/services/DefaultService";
import React, { useContext, useEffect, useState } from "react";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { RecipeEditContext } from "../App";

const PAGE_SIZE = 20;

const RecipesListPage: React.FC<{ refetchRef?: React.MutableRefObject<() => void> }> = ({ refetchRef }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshingIds, setRefreshingIds] = useState<{ [id: string]: boolean }>({});
    const [refreshErrors, setRefreshErrors] = useState<{ [id: string]: string | null }>({});
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const editContext = useContext(RecipeEditContext);
    const setSelectedRecipe = editContext?.setSelectedRecipe ?? (() => {});

    const fetchRecipes = () => {
        setLoading(true);
        setError(null);
        DefaultService.getApiRecipes("", PAGE_SIZE)
            .then((resp) => {
                setRecipes(resp.recipes || []);
                setNextCursor(resp.nextCursor ?? null);
                setLoading(false);
            })
            .catch((err) => {
                setError(err?.message || "Failed to load recipes");
                setLoading(false);
            });
    };
    useEffect(() => {
        fetchRecipes();
        if (refetchRef) {
            refetchRef.current = fetchRecipes;
        }
    }, []);

    const handleLoadMore = () => {
        if (!nextCursor) return;
        setLoadMoreLoading(true);
        DefaultService.getApiRecipes(nextCursor, PAGE_SIZE)
            .then((resp) => {
                setRecipes((prev) => [...prev, ...(resp.recipes || [])]);
                setNextCursor(resp.nextCursor ?? null);
                setLoadMoreLoading(false);
            })
            .catch((err) => {
                setError(err?.message || "Failed to load more recipes");
                setLoadMoreLoading(false);
            });
    };

    const refreshRecipe = async (id: string) => {
        setRefreshingIds((prev) => ({ ...prev, [id]: true }));
        setRefreshErrors((prev) => ({ ...prev, [id]: null }));
        try {
            const updated = await DefaultService.getApiRecipeById(id, true);
            setRecipes((prev) => prev.map(r => r.id === id ? updated : r));
        } catch (err: any) {
            setRefreshErrors((prev) => ({ ...prev, [id]: err?.message || "Refresh failed" }));
        } finally {
            setRefreshingIds((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
    };

    const handleDelete = async (id: string) => {
        try {
            await DefaultService.deleteApiRecipeById(id);
            setRecipes((prev) => prev.filter(r => r.id !== id));
            setSelectedRecipe(null);
        } catch (err: any) {
            throw err;
        }
    };

    return (
        <div className="recipes-list-page card mx-auto w-full md:min-w-xl md:max-w-6xl py-8 px-4">
            <h1 className="text-2xl font-bold mb-6" data-testid="recipes-page-title">Recipes</h1>
            {loading && <div data-testid="page-loader" className="text-muted">Loading...</div>}
            {error && <div data-testid="page-error" className="text-error">Error: {error}</div>}
            {!loading && !error && (
                <>
                    {recipes.length === 0 ? (
                        <div className="text-muted">No recipes found.</div>
                    ) : (
                        <div className="recipe-list flex flex-col gap-4">
                            {recipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onRefresh={refreshRecipe}
                                    refreshing={!!refreshingIds[recipe.id]}
                                    refreshError={refreshErrors[recipe.id] || null}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                    {nextCursor && (
                        <button
                            className="load-more-btn bg-emerald-500 dark:bg-emerald-700 text-white px-4 py-2 rounded mt-6"
                            onClick={handleLoadMore}
                            disabled={loadMoreLoading}
                            data-testid="load-more-button"
                        >
                            {loadMoreLoading ? "Loading..." : "Load more"}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default RecipesListPage;
