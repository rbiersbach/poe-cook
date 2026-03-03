import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipeItem } from "../../api/generated/models/RecipeItem";
import { DefaultService } from "../../api/generated/services/DefaultService";
import CreateRecipePage from "../CreateRecipePage";

describe("CreateRecipePage", () => {

    it("autofills the name field with the resolved output name when only output is filled", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Resolved Output Name",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: {}, sort: {} },
        });
        render(<CreateRecipePage />);
        // Only fill the output draft (second trade-url-input)
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Wait for output to resolve and autofill
        expect(await screen.findByText(/resolved output name/i)).toBeInTheDocument();
        // Name field should be autofilled
        const nameInput = await screen.findByDisplayValue("Resolved Output Name");
        expect(nameInput).toHaveValue("Resolved Output Name");
        mockResolve.mockRestore();
    });

    it("autofills the name field with the first output's resolved name if empty", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Autofill Output Name",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" }, sort: {} },
        });
        render(<CreateRecipePage />);
        // Output draft is the second trade-url-input
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Wait for output to resolve and autofill
        await screen.findByText(/autofill output name/i);
        // Wait for the name field to be autofilled
        await screen.findByDisplayValue("Autofill Output Name");
        const nameInput = screen.getByTestId("recipe-name-input");
        expect(nameInput).toHaveValue("Autofill Output Name");
        mockResolve.mockRestore();
    });
    it("renders all main sections (inputs, output, submit button)", () => {
        render(<CreateRecipePage />);
        // Inputs section
        expect(screen.getByTestId("recipe-item-list-inputs")).toBeInTheDocument();
        // Output section
        expect(screen.getByTestId("recipe-item-list-outputs")).toBeInTheDocument();
        // Submit button
        expect(screen.getByRole("button", { name: /submit recipe/i })).toBeInTheDocument();
    });

    it("can add and remove input drafts (never fewer than one)", async () => {
        render(<CreateRecipePage />);
        // Should start with two input drafts (input + output)
        expect(screen.getAllByTestId("trade-url-input")).toHaveLength(2);
        // Add input by providing a valid trade URL (mock API)
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" }, sort: {} },
        });
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();

        // Wait for the new empty draft to appear (should have empty value)
        await screen.findAllByTestId("recipe-item-row-draft");
        const draftInputs = screen.getAllByTestId("trade-url-input");
        // There should still be two inputs (one resolved, one draft)
        expect(draftInputs).toHaveLength(2);
        // Remove input (should not go below 1)
        const removeButtons = screen.getAllByTestId("remove-input-button");
        fireEvent.click(removeButtons[0]);
        expect(screen.getAllByTestId("trade-url-input")).toHaveLength(2);
        // Try to remove last input (there should be no remove button for draft inputs)
        expect(screen.queryAllByTestId("remove-input-button")).toHaveLength(0);
    });

    it("can edit input and output fields (tradeUrl, qty)", async () => {
        vi.spyOn(DefaultService, "postApiResolveItem").mockImplementation(() => new Promise(() => { }) as any);
        render(<CreateRecipePage />);
        // Edit input draft fields
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        expect(inputUrl).toHaveValue("https://www.pathofexile.com/trade/search/Standard/abcdefghij");

        const inputQty = screen.getAllByTestId("qty-input")[0];
        fireEvent.change(inputQty, { target: { value: 3 } });
        expect(inputQty).toHaveValue(3);

        // Edit output draft fields
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/klmnopqrst" } });
        expect(outputUrl).toHaveValue("https://www.pathofexile.com/trade/search/Standard/klmnopqrst");

        const outputQty = screen.getAllByTestId("qty-input")[1];
        fireEvent.change(outputQty, { target: { value: 2 } });
        expect(outputQty).toHaveValue(2);
        vi.restoreAllMocks();
    });

    it("triggers resolve when a valid trade URL is entered (mock API)", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" }, sort: {} },
        });
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        expect(screen.getByText(/10/)).toBeInTheDocument(); // price
        mockResolve.mockRestore();
    });

    it("shows loader and disables controls while resolving", async () => {
        let resolveDeferred: (value: any) => void;
        const deferredPromise = new Promise(resolve => { resolveDeferred = resolve; });
        // Return a CancelablePromise<ResolveItemResponse> for correct typing
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockImplementation(() => {
            // @ts-expect-error: ignore internal CancelablePromise implementation details for test
            return deferredPromise as unknown as CancelablePromise<ResolveItemResponse>;
        });
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Loader should appear while promise is unresolved
        expect(await screen.findByTestId("loader")).toBeInTheDocument();
        expect(inputUrl).toBeDisabled();
        // Now resolve the promise
        resolveDeferred!({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" }, sort: {} },
            error: null,
        });
        // Wait for loader to disappear and item to show
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        expect(screen.queryByTestId("loader")).toBeNull();
        mockResolve.mockRestore();
    });

    it("shows an error message if resolving an input fails", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockRejectedValue(new Error("Network error"));
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        expect(await screen.findByText(/failed to resolve item/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("moves resolved items to the resolved list", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" }, sort: {} },
        });
        render(<CreateRecipePage />);
        // Enter a valid trade URL
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        // The draft input should NOT contain the resolved trade URL
        const draftInputs = screen.getAllByTestId("trade-url-input");
        draftInputs.forEach(input => {
            expect(input).not.toHaveValue("https://www.pathofexile.com/trade/search/Standard/abcdefghij");
        });
        // The resolved item should be in the resolved list (look for Remove button in resolved row)
        expect(screen.getByTestId("remove-input-button")).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("moves resolved output to the resolved output row", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Output Item",
                iconUrl: "output.png",
                originalMinPrice: { amount: 50, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/klmnopqrst" }, sort: {} },
        });
        render(<CreateRecipePage />);
        // Enter a valid trade URL for output (second trade-url-input is output)
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/klmnopqrst" } });
        // Wait for resolved output to appear
        expect(await screen.findByText(/output item/i)).toBeInTheDocument();
        // None of the draft inputs should have the resolved trade URL
        screen.getAllByTestId("trade-url-input").forEach(input => {
            expect(input).not.toHaveValue("https://www.pathofexile.com/trade/search/Standard/klmnopqrst");
        });
        // The resolved output should be in the resolved row (look for Remove button)
        expect(screen.getByTestId("remove-input-button")).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("shows an error message if resolving the output fails", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockRejectedValue(new Error("Network error"));
        render(<CreateRecipePage />);
        // Output draft is the second trade-url-input
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/klmnopqrst" } });
        expect(await screen.findByText(/failed to resolve item/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("submits successfully with two inputs and one output", async () => {
        // Mock resolve for each item
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem")
            .mockResolvedValueOnce({
                resolved: { name: "Input1", iconUrl: "input1.png", originalMinPrice: { amount: 1, currency: "chaos" } },
                search: { query: { filters: { type: "input1-filter" } }, sort: {} },
            })
            .mockResolvedValueOnce({
                resolved: { name: "Input2", iconUrl: "input2.png", originalMinPrice: { amount: 2, currency: "chaos" } },
                search: { query: { filters: { type: "input2-filter" } }, sort: {} },
            })
            .mockResolvedValueOnce({
                resolved: { name: "Output", iconUrl: "output.png", originalMinPrice: { amount: 3, currency: "chaos" } },
                search: { query: { filters: { type: "output-filter" } }, sort: {} },
            });
        // Return a valid CreateRecipeResponse object
        const mockSubmit = vi.spyOn(DefaultService, "postApiRecipes").mockResolvedValue({
            recipe: {
                id: "mock-id",
                name: "Output",
                inputs: [],
                outputs: [
                    {
                        qty: 1,
                        type: RecipeItem.type.TRADE,
                        name: "Output",
                        icon: "",
                        item: {
                            tradeUrl: 'https://www.pathofexile.com/trade/search/Standard/outputurl1',
                            search: { query: { name: "Output" } },
                        },
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });
        render(<CreateRecipePage />);
        // Fill and resolve first input draft
        let inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/inputurlA1" } });
        expect(await screen.findByText("Input1")).toBeInTheDocument();
        // Wait for new draft to appear and fill/resolve it
        await screen.findAllByTestId("recipe-item-row-draft");
        inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/inputurlB2" } });
        expect(await screen.findByText("Input2")).toBeInTheDocument();
        // Fill and resolve output draft (second trade-url-input is output)
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/outputurlC" } });
        expect(await screen.findByText("Output")).toBeInTheDocument();
        // Submit — wait for state to propagate up via onResolvedChange before clicking
        const submitBtn = screen.getByRole("button", { name: /submit recipe/i });
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);
        expect(await screen.findByText(/recipe submitted successfully/i)).toBeInTheDocument();
        // Resolved rows should be cleared
        expect(screen.queryAllByTestId("recipe-item-row-resolved").length).toBe(0);
        // Assert submit API was called with correct payload and search property
        expect(mockSubmit).toHaveBeenCalledWith({
            name: "Output",
            inputs: [
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Input1',
                    item: expect.objectContaining({
                        tradeUrl: "https://www.pathofexile.com/trade/search/Standard/inputurlA1",
                        resolved: expect.objectContaining({ name: "Input1" }),
                        search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "input1-filter" }) }) })
                    })
                }),
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Input2',
                    item: expect.objectContaining({
                        tradeUrl: "https://www.pathofexile.com/trade/search/Standard/inputurlB2",
                        resolved: expect.objectContaining({ name: "Input2" }),
                        search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "input2-filter" }) }) })
                    })
                })
            ],
            outputs: [
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Output',
                    item: expect.objectContaining({
                        tradeUrl: "https://www.pathofexile.com/trade/search/Standard/outputurlC",
                        resolved: expect.objectContaining({ name: "Output" }),
                        search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "output-filter" }) }) })
                    })
                })
            ]
        });
        mockResolve.mockRestore();
        mockSubmit.mockRestore();
    });
    it("shows an error message if recipe submit fails", async () => {
        // Mock resolve for each item
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem")
            .mockResolvedValueOnce({
                resolved: { name: "Input1", iconUrl: "input1.png", originalMinPrice: { amount: 1, currency: "chaos" } },
                search: { query: { filters: { type: "input1-filter" } }, sort: {} },
            })
            .mockResolvedValueOnce({
                resolved: { name: "Input2", iconUrl: "input2.png", originalMinPrice: { amount: 2, currency: "chaos" } },
                search: { query: { filters: { type: "input2-filter" } }, sort: {} },
            })
            .mockResolvedValueOnce({
                resolved: { name: "Output", iconUrl: "output.png", originalMinPrice: { amount: 3, currency: "chaos" } },
                search: { query: { filters: { type: "output-filter" } }, sort: {} },
            });
        const mockSubmit = vi.spyOn(DefaultService, "postApiRecipes").mockRejectedValue(new Error("API error: failed to submit"));
        render(<CreateRecipePage />);

        // Fill out name
        const nameInput = screen.getByTestId("recipe-name-input");
        fireEvent.change(nameInput, { target: { value: "My Custom Recipe" } });
        // Fill and resolve first input draft
        let inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/inputurlA1" } });
        // Wait for Input1 to resolve
        await screen.findByText("Input1");
        // Wait for new draft to appear
        await screen.findAllByTestId("recipe-item-row-draft");
        // Fill and resolve second input draft
        inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/inputurlB2" } });
        // Wait for Input2 to resolve
        await screen.findByText("Input2");
        // Wait for output input to be present (should be second input)
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/outputurlC" } });
        // Wait for Output to resolve
        await screen.findByText("Output");

        // Submit — wait for state to propagate up via onResolvedChange before clicking
        const submitBtn = screen.getByRole("button", { name: /submit recipe/i });
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);
        // Error message should appear
        expect(await screen.findByText(/failed to submit recipe/i)).toBeInTheDocument();
        mockResolve.mockRestore();
        mockSubmit.mockRestore();
    });
    it("resolves input only when pressing Enter with invalid trade URL", async () => {
        render(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Manual Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 5, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Standard/invalidurl" }, sort: {} },
        });
        // Use an invalid trade URL (does not match auto-resolve pattern)
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        // Should not resolve automatically
        expect(screen.queryByText(/manual item/i)).toBeNull();
        // Now press Enter to trigger resolve
        fireEvent.keyDown(inputUrl, { key: "Enter", code: "Enter" });
        expect(await screen.findByText(/manual item/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("shows error and animates output draft row on failed resolve", async () => {
        render(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockRejectedValue(new Error("Network error"));
        // Use an invalid trade URL to avoid auto-resolve
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/invalidurl" } });
        // Should not resolve automatically
        expect(screen.queryByTestId("draft-error-msg")).toBeNull();
        // Press Enter to trigger resolve
        fireEvent.keyDown(outputUrl, { key: "Enter", code: "Enter" });
        // Error message should appear near the output draft row
        expect(await screen.findByTestId("draft-error-msg")).toHaveTextContent(/failed to resolve item/i);
        // Row should have error animation class
        const row = outputUrl.closest('[data-testid="recipe-item-row-draft"]');
        expect(row).not.toBeNull();
        expect((row as HTMLElement).className).toMatch(/bg-red-100/);
        mockResolve.mockRestore();
    });

    it("shows error and animates input draft row on failed resolve", async () => {
        render(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockRejectedValue(new Error("Network error"));
        // Use an invalid trade URL to avoid auto-resolve
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/invalidurl" } });
        // Should not resolve automatically
        expect(screen.queryByTestId("draft-error-msg")).toBeNull();
        // Press Enter to trigger resolve
        fireEvent.keyDown(inputUrl, { key: "Enter", code: "Enter" });
        // Error message should appear near the input draft row
        expect(await screen.findByTestId("draft-error-msg")).toHaveTextContent(/failed to resolve item/i);
        // Row should have error animation class
        const row = inputUrl.closest('[data-testid="recipe-item-row-draft"]');
        expect(row).not.toBeNull();
        expect((row as HTMLElement).className).toMatch(/bg-red-100/);
        mockResolve.mockRestore();
    });

    it("shows a link icon to the original trade URL in resolved rows (query does not contain tradeUrl)", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { someOtherField: "foo" }, sort: {} },
        });
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" } });
        fireEvent.keyDown(inputUrl, { key: "Enter", code: "Enter" });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        // The link icon should be present and correct
        const link = screen.getByTestId("trade-url-link");
        expect(link).toHaveAttribute("href", "https://www.pathofexile.com/trade/search/Standard/abcdefghij");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
        mockResolve.mockRestore();
    });
});
