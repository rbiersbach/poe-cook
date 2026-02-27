import { Recipe } from "api/generated/models/Recipe";
import React from "react";
import { Button } from "./Button";
import { ProfitDisplay } from "./ProfitDisplay";
import { TimeAgo } from "./TimeAgo";
import { ItemChip } from "./ItemChip";

interface RecipeCardProps {
    recipe: Recipe;
    onRefresh: (id: string) => Promise<void>;
    refreshing: boolean;
    refreshError?: string | null;
}

function computeProfit(recipe: Recipe): number | null {
    if (!recipe.inputs.every(i => i.resolved && i.resolved.minPrice) || !recipe.output.resolved || !recipe.output.resolved.minPrice) {
        return null;
    }
    const costChaos = recipe.inputs.reduce((sum, item) => sum + (item.qty * (item.resolved?.minPrice?.amount ?? 0)), 0);
    const revenueChaos = recipe.output.qty * (recipe.output.resolved.minPrice.amount ?? 0);
    return revenueChaos - costChaos;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onRefresh, refreshing, refreshError }) => {
    return (
        <div className="recipe-card card-row rounded shadow p-4 mb-4 flex flex-col gap-2" data-testid={`recipe-card-${recipe.id}`}>
            <div className="inputs-strip flex flex-wrap gap-2 items-center">
                {recipe.inputs.map((item, idx) => (
                    <ItemChip key={idx} item={item} />
                ))}
                <span className="arrow mx-2">→</span>
                <ItemChip item={recipe.output} />
            </div>
            <div className="flex items-center gap-4 mt-2">
                <div className="profit flex items-center gap-2">
                    <ProfitDisplay recipe={recipe} />
                </div>
                <Button
                    as="button"
                    onClick={() => onRefresh(recipe.id)}
                    disabled={refreshing}
                    data-testid={`refresh-recipe-${recipe.id}`}
                    aria-label="Refresh recipe"
                    iconLeft={refreshing ? (
                        <span className="loader" data-testid="refresh-spinner">⏳</span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" clipRule="evenodd" />
                        </svg>
                    )} children={undefined} />
                {refreshError && <span className="refresh-error text-red-500">{refreshError}</span>}
                <span className="relative group text-xs text-neutral-500 ml-4" data-testid="recipe-updated-at">
                    <TimeAgo date={recipe.updatedAt} />
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:flex px-2 py-1 rounded bg-surface text-xs text-primary shadow tooltip-fade border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                        {new Date(recipe.updatedAt).toLocaleString()}
                    </span>
                </span>
            </div>
        </div>
    );
};
