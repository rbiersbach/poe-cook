import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRecipe } from "../../__tests__/fixtures";
import { RecipeCard } from "../recipe/RecipeCard";

const defaultRecipe = makeRecipe();

describe("RecipeCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders recipe name, inputs, and outputs", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
            />
        );
        expect(screen.getByTestId("recipe-name")).toHaveTextContent("Test Recipe");
        expect(screen.getByAltText("Input Trade Item")).toBeInTheDocument();
        expect(screen.getByAltText("Output Trade Item")).toBeInTheDocument();
    });

    it("shows profit display and recipe updated time", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
            />
        );
        expect(screen.getByTestId("recipe-updated-at")).toBeInTheDocument();
        expect(screen.getByTestId("profit-tooltip")).toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked", async () => {
        const mockOnRefresh = vi.fn();
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
            />
        );
        const refreshBtn = screen.getByTestId("refresh-recipe-test1");
        await user.click(refreshBtn);
        expect(mockOnRefresh).toHaveBeenCalledWith("test1");
    });

    it("disables refresh button when refreshing", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={true}
            />
        );
        const refreshBtn = screen.getByTestId("refresh-recipe-test1") as HTMLButtonElement;
        expect(refreshBtn.disabled).toBe(true);
    });

    it("displays refresh spinner when refreshing", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={true}
            />
        );
        expect(screen.getByTestId("refresh-spinner")).toBeInTheDocument();
    });

    it("hides edit button when onEdit is not provided", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
            />
        );
        expect(screen.queryByTestId("edit-recipe-test1")).not.toBeInTheDocument();
    });

    it("shows edit button and calls onEdit when clicked", async () => {
        const mockOnRefresh = vi.fn();
        const mockOnEdit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onEdit={mockOnEdit}
            />
        );
        const editBtn = screen.getByTestId("edit-recipe-test1");
        expect(editBtn).toBeInTheDocument();
        await user.click(editBtn);
        expect(mockOnEdit).toHaveBeenCalledWith(defaultRecipe);
    });

    it("hides delete button when onDelete is not provided", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
            />
        );
        expect(screen.queryByTestId("delete-recipe-test1")).not.toBeInTheDocument();
    });

    it("shows delete button and opens confirmation modal when clicked", async () => {
        const mockOnRefresh = vi.fn();
        const mockOnDelete = vi.fn();
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        expect(deleteBtn).toBeInTheDocument();
        await user.click(deleteBtn);
        expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
        expect(screen.getByTestId("delete-modal-title")).toHaveTextContent("Delete Recipe?");
    });

    it("closes confirmation modal when Cancel button is clicked", async () => {
        const mockOnRefresh = vi.fn();
        const mockOnDelete = vi.fn();
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        expect(screen.getByText(/Delete Recipe\?/)).toBeInTheDocument();
        const cancelBtn = screen.getByRole("button", { name: "Cancel" });
        await user.click(cancelBtn);
        await waitFor(() => {
            expect(screen.queryByText(/Delete Recipe\?/)).not.toBeInTheDocument();
        });
    });

    it("calls onDelete when Delete button is clicked in confirmation modal", async () => {
        const mockOnRefresh = vi.fn();
        const mockOnDelete = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(mockOnDelete).toHaveBeenCalledWith("test1");
        });
    });

    it("disables buttons and shows Deleting state during delete", async () => {
        const mockOnRefresh = vi.fn();
        let resolveDelete: ((v: any) => void) | undefined;
        const mockOnDelete = vi.fn(
            () => new Promise(r => { resolveDelete = r; }) as any
        );
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(screen.getByText("Deleting...")).toBeInTheDocument();
        });
        const cancelBtn = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
        expect(cancelBtn.disabled).toBe(true);
        await act(async () => {
            if (resolveDelete) resolveDelete(undefined);
        });
    });

    it("shows delete spinner during delete operation", async () => {
        const mockOnRefresh = vi.fn();
        let resolveDelete: ((v: any) => void) | undefined;
        const mockOnDelete = vi.fn(
            () => new Promise(r => { resolveDelete = r; }) as any
        );
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(screen.getByTestId("delete-spinner")).toBeInTheDocument();
        });
        await act(async () => {
            if (resolveDelete) resolveDelete(undefined);
        });
    });

    it("displays error message if delete fails", async () => {
        const mockOnRefresh = vi.fn();
        const mockOnDelete = vi.fn().mockRejectedValueOnce(
            new Error("Delete failed")
        );
        const user = userEvent.setup();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                onDelete={mockOnDelete}
            />
        );
        const deleteBtn = screen.getByTestId("delete-recipe-test1");
        await user.click(deleteBtn);
        const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/ });
        await user.click(confirmDeleteBtn);
        await waitFor(() => {
            expect(screen.getByText("Delete failed")).toBeInTheDocument();
        });
    });

    it("displays refresh error if provided", () => {
        const mockOnRefresh = vi.fn();
        render(
            <RecipeCard
                recipe={defaultRecipe}
                onRefresh={mockOnRefresh}
                refreshing={false}
                refreshError="Refresh failed"
            />
        );
        expect(screen.getByTestId("refresh-error-msg")).toBeInTheDocument();
        expect(screen.getByTestId("refresh-error-msg")).toHaveTextContent("Refresh failed");
    });
});
