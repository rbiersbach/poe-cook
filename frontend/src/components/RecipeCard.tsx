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


// Deprecated: use ProfitDisplay for profit calculation

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onRefresh, refreshing, refreshError }) => {
    return (
        <div className="recipe-card card-row rounded shadow p-4 mb-4 flex flex-col gap-2" data-testid={`recipe-card-${recipe.id}`}>
            <div className="flex items-center justify-between mb-2 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                        className="truncate text-sm font-semibold text-primary dark:text-primary-dark min-w-0"
                        data-testid="recipe-name"
                        title={recipe.name}
                    >
                        {recipe.name}
                    </span>
                    <span className="relative group text-sm font-normal text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0" data-testid="recipe-updated-at">
                        <TimeAgo date={recipe.updatedAt} />
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:flex px-2 py-1 rounded bg-surface text-xs text-primary shadow tooltip-fade border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                            {new Date(recipe.updatedAt).toLocaleString()}
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="profit flex items-center gap-2 text-sm font-semibold text-primary dark:text-primary-dark">
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
                </div>
            </div>
            <div className="flex w-full gap-2">
                    <div className="card-section flex flex-wrap gap-2 items-center flex-1 min-w-0">
                    {recipe.inputs.map((item, idx) => (
                        <ItemChip key={idx} item={item} />
                    ))}
                </div>
                    <div className="card-section flex flex-wrap gap-2 items-center flex-1 min-w-0 justify-end">
                    {recipe.outputs.map((item, idx) => (
                        <ItemChip key={"out-" + idx} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};
