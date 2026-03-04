import { Recipe } from "api/generated/models/Recipe";
import { DefaultService } from "api/generated/services/DefaultService";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/generated/core/ApiError";
import { RecipeEditContext } from "../App";
import { DivineChaosRate } from "../components/item/DivineChaosRate";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { useLeague } from "../context/LeagueContext";
import { RateLimitContext } from "../context/RateLimitContext";

const PAGE_SIZE = 20;

const RecipesListPage: React.FC<{ refetchRef?: React.MutableRefObject<() => void> }> = ({ refetchRef }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshingIds, setRefreshingIds] = useState<{ [id: string]: boolean }>({});
    const [refreshErrors, setRefreshErrors] = useState<{ [id: string]: string | null }>({});
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const refreshErrorTimeouts = useRef<{ [id: string]: ReturnType<typeof setTimeout> }>({});
    const [autoRefresh, setAutoRefresh] = useState(false);
    const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Mutable ref so the interval callback always reads the latest state without restarting
    const autoRefreshStateRef = useRef<{ recipes: Recipe[]; refreshingIds: { [id: string]: boolean }; refreshFn: (id: string) => void }>({ recipes: [], refreshingIds: {}, refreshFn: () => {} });
    const rateLimitCtx = useContext(RateLimitContext);
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
                if (err instanceof ApiError && err.status === 429) {
                    rateLimitCtx?.triggerRateLimit(err.body?.error ?? err.message);
                }
                setError(
                    err instanceof ApiError && err.status === 429
                        ? "Rate limited by PoE servers"
                        : err?.message || "Failed to load recipes"
                );
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRecipes();
        if (refetchRef) {
            refetchRef.current = fetchRecipes;
        }
        // Clear auto-refresh interval on league change
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    }, [league]);

    useEffect(() => {
        if (autoRefreshIntervalRef.current) clearInterval(autoRefreshIntervalRef.current);
        if (!autoRefresh) return;
        const doRefresh = () => {
            const { recipes, refreshingIds, refreshFn } = autoRefreshStateRef.current;
            if (!recipes.length) return;
            const oldest = [...recipes]
                .filter(r => !refreshingIds[r.id])
                .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())[0];
            if (oldest) refreshFn(oldest.id);
        };
        doRefresh();
        autoRefreshIntervalRef.current = setInterval(doRefresh, 60_000);
        return () => { clearInterval(autoRefreshIntervalRef.current!); };
    }, [autoRefresh]);

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
                if (err instanceof ApiError && err.status === 429) {
                    rateLimitCtx?.triggerRateLimit(err.body?.error ?? err.message);
                    // Do not set error — keeps existing list visible; banner is enough
                } else {
                    setError(err?.message || "Failed to load more recipes");
                }
                setLoadMoreLoading(false);
            });
    };

    const refreshRecipe = async (id: string) => {
        setRefreshingIds((prev) => ({ ...prev, [id]: true }));
        // Clear error and any pending auto-clear timer
        clearTimeout(refreshErrorTimeouts.current[id]);
        setRefreshErrors((prev) => ({ ...prev, [id]: null }));
        try {
            const updated = await DefaultService.getApiLeagueRecipeById(league!.id, id, true);
            setRecipes((prev) => prev.map(r => r.id === id ? updated : r));
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 429) {
                rateLimitCtx?.triggerRateLimit(err.body?.error ?? err.message);
            }
            const msg =
                err instanceof ApiError && err.status === 403
                    ? "Session expired: POE session ID is invalid or not set on the server."
                    : err instanceof ApiError && err.status === 429
                        ? "Rate limited by PoE servers"
                        : err?.message || "Refresh failed";
            setRefreshErrors((prev) => ({ ...prev, [id]: msg }));
            refreshErrorTimeouts.current[id] = setTimeout(() => {
                setRefreshErrors((prev) => ({ ...prev, [id]: null }));
            }, 5_000);
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

    autoRefreshStateRef.current = { recipes, refreshingIds, refreshFn: refreshRecipe };
    const isAutoRefreshing = autoRefresh && Object.values(refreshingIds).some(Boolean);

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
                <button
                    data-testid="auto-refresh-toggle"
                    aria-label={autoRefresh ? "Disable auto refresh" : "Enable auto refresh"}
                    onClick={() => setAutoRefresh(r => !r)}
                    className={`ml-auto flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border transition-colors ${
                        autoRefresh
                            ? "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300"
                            : "border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        className={`size-4 ${isAutoRefreshing ? "animate-spin" : ""}`}
                        data-testid={isAutoRefreshing ? "auto-refresh-spinner" : undefined}
                    >
                        <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" clipRule="evenodd" />
                    </svg>
                    Auto Refresh
                </button>
            </div>
            {loading && <div data-testid="page-loader" className="text-muted">Loading...</div>}
            {error && <div data-testid="page-error" className="text-error">Error: {error}</div>}
            {!loading && (
                <>
                    {!error && recipes.length === 0 && (
                        <div className="text-muted">No recipes found.</div>
                    )}
                    {recipes.length > 0 && (
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
