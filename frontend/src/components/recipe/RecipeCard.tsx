import { Recipe } from "api/generated/models/Recipe";
import React from "react";
import { ItemChip } from "../item/ItemChip";
import { ProfitDisplay } from "../item/ProfitDisplay";
import { Button } from "../ui/Button";
import { TimeAgo } from "../ui/TimeAgo";

interface RecipeCardProps {
    recipe: Recipe;
    onRefresh: (id: string) => Promise<void>;
    refreshing: boolean;
    refreshError?: string | null;
    onEdit?: (recipe: Recipe) => void;
    onDelete?: (id: string) => Promise<void>;
}


export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onRefresh, refreshing, refreshError, onEdit, onDelete }) => {
    const [deleting, setDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    const handleDeleteConfirm = async () => {
        if (!onDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await onDelete(recipe.id);
            setShowDeleteConfirm(false);
        } catch (err: any) {
            setDeleteError(err?.message || "Failed to delete recipe");
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div className="recipe-card card-row rounded shadow p-4 mb-4 flex flex-col gap-2" data-testid={`recipe-card-${recipe.id}`}>
            <div className="flex items-center justify-between gap-4 mb-2 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                        className="truncate text-sm font-semibold text-primary dark:text-primary-dark min-w-0"
                        data-testid="recipe-name"
                        title={recipe.name}
                    >
                        {recipe.name}
                    </span>
                    <span className="relative group text-sm font-normal text-gray-500 dark:text-gray-400 ml-2 shrink-0" data-testid="recipe-updated-at">
                        <TimeAgo date={recipe.updatedAt} />
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:flex px-2 py-1 rounded bg-surface text-xs text-primary shadow tooltip-fade border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
                            {new Date(recipe.updatedAt).toLocaleString()}
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="profit flex items-center gap-2 text-sm font-semibold text-primary dark:text-primary-dark">
                        <ProfitDisplay recipe={recipe} />
                    </div>
                    <Button
                        onClick={() => onRefresh(recipe.id)}
                        disabled={refreshing}
                        data-testid={`refresh-recipe-${recipe.id}`}
                        aria-label="Refresh recipe"
                        iconLeft={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                                data-testid={refreshing ? "refresh-spinner" : undefined}
                            >
                                <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" clipRule="evenodd" />
                            </svg>
                        } children={undefined} />
                    {onEdit && (
                        <Button
                            onClick={() => onEdit(recipe)}
                            data-testid={`edit-recipe-${recipe.id}`}
                            aria-label="Edit recipe"
                            iconLeft={
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                </svg>
                            }
                            children={undefined}
                        />
                    )}
                    {onDelete && (
                        <>
                            <Button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleting}
                                data-testid={`delete-recipe-${recipe.id}`}
                                data-color="danger"
                                aria-label="Delete recipe"
                                iconLeft={deleting ? (
                                    <span className="loader" data-testid="delete-spinner">⏳</span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
                                    </svg>
                                )}
                                children={undefined}
                            />
                            {showDeleteConfirm && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="delete-modal">
                                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg max-w-sm">
                                        <h2 className="text-lg font-bold mb-4" data-testid="delete-modal-title">Delete Recipe?</h2>
                                        <p className="text-gray-700 dark:text-gray-300 mb-6" data-testid="delete-modal-message">
                                            Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
                                        </p>
                                        {deleteError && <p className="text-red-500 mb-4 text-sm" data-testid="delete-error-msg">{deleteError}</p>}
                                        <div className="flex gap-3 justify-end">
                                            <Button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                disabled={deleting}
                                                data-testid="delete-modal-cancel-btn"
                                                children="Cancel"
                                            />
                                            <Button
                                                onClick={handleDeleteConfirm}
                                                disabled={deleting}
                                                data-testid="delete-modal-confirm-btn"
                                                children={deleting ? "Deleting..." : "Delete"}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {refreshError && <span className="refresh-error text-red-500" data-testid="refresh-error-msg">{refreshError}</span>}
                </div>
            </div>
            <div className="flex w-full gap-2">
                <div className="card-section flex flex-wrap gap-2 items-start content-start flex-1 min-w-0">
                    {recipe.inputs.map((item, idx) => (
                        <ItemChip key={idx} item={item} />
                    ))}
                </div>
                <div className="card-section flex flex-wrap gap-2 items-start content-start flex-1 min-w-0">
                    {recipe.outputs.map((item, idx) => (
                        <ItemChip key={"out-" + idx} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};
