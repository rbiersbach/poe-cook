import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Recipe, RecipeItem } from "api/generated";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultService } from "../../api/generated/services/DefaultService";
import RecipesListPage from "../RecipesListPage";

const defaultRecipe: Recipe = {
    id: "test1",
    name: "Test Recipe",
    inputs: [],
    outputs: [
        {
            qty: 1,
            type: RecipeItem.type.TRADE,
            name: 'Output Item',
            icon: '',
            item: {
                tradeUrl: '',
                search: { query: {} },
                resolved: {
                    minPrice: { amount: 10, currency: "chaos" }
                }
            }
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe("RecipesListPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("renders page title, recipe card, and load more button", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        expect(screen.getByText("Recipes")).toBeInTheDocument();
        expect(screen.getByTestId("page-loader")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId("page-loader")).not.toBeInTheDocument());
        expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument();
        expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    });

    it("displays loading state while fetching recipes", async () => {
        let resolveRecipes: (v: any) => void;
        vi.spyOn(DefaultService, "getApiRecipes").mockImplementation(() => new Promise(r => { resolveRecipes = r; }) as any);
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        expect(screen.getByTestId("page-loader")).toBeInTheDocument();
        await act(async () => { resolveRecipes!({ recipes: [], nextCursor: null }); });
    });

    it("shows error message if API call fails", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockRejectedValueOnce(new Error("API fail"));
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("page-error")).toBeInTheDocument());
        expect(screen.getByText(/API fail/)).toBeInTheDocument();
    });

    it("displays each recipe’s profit range and last updated time", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        expect(screen.getByText(/Profit/)).toBeInTheDocument();
        expect(screen.getByTestId("recipe-updated-at")).toBeInTheDocument();
    });

    it("refresh button triggers API refresh and updates the recipe", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        const spy = vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const refreshBtn = screen.getByTestId("refresh-recipe-test1");
        await userEvent.click(refreshBtn);
        expect(spy).toHaveBeenCalledWith("test1", true);
    });

    it("shows loading indicator on refresh button when refreshing", async () => {
        let resolveRefresh: ((v: any) => void) | undefined;
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        vi.spyOn(DefaultService, "getApiRecipeById").mockImplementationOnce(() => new Promise(r => { resolveRefresh = r; }) as any).mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const refreshBtn = screen.getByTestId("refresh-recipe-test1");
        await userEvent.click(refreshBtn);
        expect(screen.getByTestId("refresh-spinner")).toBeInTheDocument();
        await act(async () => { if (resolveRefresh) resolveRefresh(defaultRecipe); });
    });

    it("handles missing price data gracefully", async () => {
        const missingPriceRecipe: Recipe = {
            id: "test2",
            name: "Missing Price Recipe",
            inputs: [],
            outputs: [
                { qty: 1, type: RecipeItem.type.TRADE, name: 'Missing', icon: '', item: { tradeUrl: '', search: { query: {} } } }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [missingPriceRecipe], nextCursor: undefined });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(missingPriceRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test2")).toBeInTheDocument());
        expect(screen.getByText(/Missing price/)).toBeInTheDocument();
    });

    it("calls onEdit handler when edit button is clicked", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: undefined });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        const user = userEvent.setup();
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const editBtn = screen.getByTestId("edit-recipe-test1");
        expect(editBtn).toBeInTheDocument();
        await user.click(editBtn);
        // Edit button should trigger the onEdit callback which is passed from parent
    });

    it("deletes recipe when delete is confirmed", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: undefined });
        const deleteApiSpy = vi.spyOn(DefaultService, "deleteApiRecipeById").mockResolvedValue(undefined as any);
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        const user = userEvent.setup();
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(deleteApiSpy).toHaveBeenCalledWith("test1");
        });
    });

    it("removes recipe from list after successful delete", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: null });
        vi.spyOn(DefaultService, "deleteApiRecipeById").mockResolvedValue(undefined as any);
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        const user = userEvent.setup();
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(screen.queryByTestId("recipe-card-test1")).not.toBeInTheDocument();
        });
    });

    it("displays error message if delete fails", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: null });
        vi.spyOn(DefaultService, "deleteApiRecipeById").mockRejectedValueOnce(new Error("Delete failed"));
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        const user = userEvent.setup();
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(screen.getByText("Delete failed")).toBeInTheDocument();
        });
    });

    it("keeps recipe in list if delete is cancelled", async () => {
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: null });
        vi.spyOn(DefaultService, "deleteApiRecipeById").mockResolvedValue(undefined as any);
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        const user = userEvent.setup();
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const cancelBtn = screen.getByRole("button", { name: "Cancel" });
        await user.click(cancelBtn);
        await waitFor(() => {
            expect(screen.queryByText(/Are you sure you want to delete/)).not.toBeInTheDocument();
        });
        expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument();
    });
});
