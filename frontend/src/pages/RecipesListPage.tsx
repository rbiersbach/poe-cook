import { Recipe } from "api/generated/models/Recipe";
import { DefaultService } from "api/generated/services/DefaultService";
import React, { useEffect, useState } from "react";
import { RecipeCard } from "../components/RecipeCard";

const PAGE_SIZE = 20;

const RecipesListPage: React.FC<{ refetchRef?: React.MutableRefObject<() => void> }> = ({ refetchRef }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshingIds, setRefreshingIds] = useState<{ [id: string]: boolean }>({});
    const [refreshErrors, setRefreshErrors] = useState<{ [id: string]: string | null }>({});
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);

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

    return (
        <div className="recipes-list-page container mx-auto w-full md:min-w-[36rem] md:max-w-6xl py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Recipes</h1>
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
