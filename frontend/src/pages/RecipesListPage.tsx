import { Recipe } from "api/generated/models/Recipe";
import { DefaultService } from "api/generated/services/DefaultService";
import React, { useContext, useEffect, useState } from "react";
import { RecipeEditContext } from "../App";
import { DivineChaosRate } from "../components/item/DivineChaosRate";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { Button } from "../components/ui/Button";
import { useLeague } from "../context/LeagueContext";

const PAGE_SIZE = 20;

const RecipesListPage: React.FC<{ refetchRef?: React.MutableRefObject<() => void> }> = ({ refetchRef }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshingIds, setRefreshingIds] = useState<{ [id: string]: boolean }>({});
    const [refreshErrors, setRefreshErrors] = useState<{ [id: string]: string | null }>({});
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [refreshingAll, setRefreshingAll] = useState(false);
    const editContext = useContext(RecipeEditContext);
    const setSelectedRecipe = editContext?.setSelectedRecipe ?? (() => { });
    const { league } = useLeague();

    const fetchRecipes = (invalidateCache = false) => {
        if (!league) return;
        setLoading(true);
        setError(null);
        DefaultService.getApiLeagueRecipes(league.id, "", PAGE_SIZE, invalidateCache || undefined)
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

    const handleRefreshAll = async () => {
        setRefreshingAll(true);
        try {
            await new Promise<void>((resolve, reject) => {
                if (!league) return resolve();
                DefaultService.getApiLeagueRecipes(league.id, "", PAGE_SIZE, true)
                    .then((resp) => {
                        setRecipes(resp.recipes || []);
                        setNextCursor(resp.nextCursor ?? null);
                        resolve();
                    })
                    .catch(reject);
            });
        } catch (err: any) {
            setError(err?.message || "Refresh all failed");
        } finally {
            setRefreshingAll(false);
        }
    };
    useEffect(() => {
        fetchRecipes();
        if (refetchRef) {
            refetchRef.current = fetchRecipes;
        }
    }, [league]);

    const handleLoadMore = () => {
        if (!nextCursor || !league) return;
        setLoadMoreLoading(true);
        DefaultService.getApiLeagueRecipes(league.id, nextCursor, PAGE_SIZE)
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
            const updated = await DefaultService.getApiLeagueRecipeById(league!.id, id, true);
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
            await DefaultService.deleteApiLeagueRecipeById(league!.id, id);
            setRecipes((prev) => prev.filter(r => r.id !== id));
            setSelectedRecipe(null);
        } catch (err: any) {
            throw err;
        }
    };

    if (!league) {
        return (
            <div className="recipes-list-page card mx-auto w-full md:min-w-xl md:max-w-6xl py-8 px-4">
                <p className="text-muted" data-testid="no-league-message">Please select a league to view recipes.</p>
            </div>
        );
    }

    return (
        <div className="recipes-list-page card mx-auto w-full md:min-w-xl md:max-w-6xl p-6">
            <div className="relative flex items-center mb-4">
                <h1 className="text-2xl font-bold" data-testid="recipes-page-title">Recipes</h1>
                <div className="absolute left-1/2 -translate-x-1/2">
                    <DivineChaosRate />
                </div>
                <Button
                    data-testid="refresh-all-button"
                    aria-label="Refresh all recipes"
                    disabled={refreshingAll || loading}
                    onClick={handleRefreshAll}
                    className="ml-auto"
                    iconLeft={refreshingAll ? (
                        <span className="loader" data-testid="refresh-all-spinner">⏳</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" clipRule="evenodd" />
                        </svg>
                    )}
                >{null}</Button>
            </div>
            {loading && <div data-testid="page-loader" className="text-muted">Loading...</div>}
            {error && <div data-testid="page-error" className="text-error">Error: {error}</div>}
            {!loading && !error && (
                <>
                    {recipes.length === 0 ? (
                        <div className="text-muted">No recipes found.</div>
                    ) : (
                        <div className="recipe-list flex flex-col gap-2">
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
