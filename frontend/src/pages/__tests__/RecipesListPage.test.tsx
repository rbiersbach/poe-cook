import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultService } from "../../api/generated/services/DefaultService";
import RecipesListPage from "../RecipesListPage";
import { beforeEach, describe, expect, it, vi } from "vitest";

const defaultRecipe = {
    id: "test1",
    name: "Test Recipe",
    inputs: [],
    outputs: [
        {
            qty: 1,
            resolved: {
                minPrice: { amount: 10, currency: "chaos" }
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
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        expect(screen.getByTestId("page-loader")).toBeInTheDocument();
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
        let resolveRefresh: (() => void) | undefined;
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [defaultRecipe], nextCursor: "abc" });
        vi.spyOn(DefaultService, "getApiRecipeById").mockImplementationOnce(() => new Promise<void>(res => { resolveRefresh = res; })).mockResolvedValue(defaultRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test1")).toBeInTheDocument());
        const refreshBtn = screen.getByTestId("refresh-recipe-test1");
        await userEvent.click(refreshBtn);
        expect(screen.getByTestId("refresh-spinner")).toBeInTheDocument();
        if (resolveRefresh) resolveRefresh();
    });

    it("handles missing price data gracefully", async () => {
        const missingPriceRecipe = {
            id: "test2",
            name: "Missing Price Recipe",
            inputs: [],
            outputs: [
                { qty: 1, resolved: null }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        vi.spyOn(DefaultService, "getApiRecipes").mockResolvedValue({ recipes: [missingPriceRecipe], nextCursor: null });
        vi.spyOn(DefaultService, "getApiRecipeById").mockResolvedValue(missingPriceRecipe);
        render(<RecipesListPage />);
        await waitFor(() => expect(screen.getByTestId("recipe-card-test2")).toBeInTheDocument());
        expect(screen.getByText(/Missing price/)).toBeInTheDocument();
    });
});
