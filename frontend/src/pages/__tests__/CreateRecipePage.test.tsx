import { fireEvent, render, screen, within } from "@testing-library/react";
import CreateRecipePage from "pages/CreateRecipePage";
import { describe, expect, it, vi } from "vitest";
import { DefaultService } from "../../api/generated/services/DefaultService";

describe("CreateRecipePage", () => {
    it("renders all main sections (inputs, output, submit button)", () => {
        render(<CreateRecipePage />);
        // Inputs section
        expect(screen.getByText(/inputs/i)).toBeInTheDocument();
        // Output section
        expect(screen.getByText(/output/i)).toBeInTheDocument();
        // Submit button
        expect(screen.getByRole("button", { name: /submit recipe/i })).toBeInTheDocument();
    });

    it("can add and remove input drafts (never fewer than one)", () => {
        render(<CreateRecipePage />);
        // Should start with two input drafts (input + output)
        expect(screen.getAllByPlaceholderText(/trade url/i)).toHaveLength(2);
        // Add input
        fireEvent.click(screen.getByRole("button", { name: /add input/i }));
        expect(screen.getAllByPlaceholderText(/trade url/i)).toHaveLength(3);
        // Remove input (should not go below 1)
        fireEvent.click(screen.getAllByText(/remove/i)[0]);
        expect(screen.getAllByPlaceholderText(/trade url/i)).toHaveLength(2);
        // Try to remove last input (there should be no remove button)
        expect(screen.queryByText(/remove/i)).toBeNull();
    });

    it("can edit input and output fields (tradeUrl, qty, fallbackPrice)", () => {
        render(<CreateRecipePage />);
        // Edit input draft fields
        const inputUrl = screen.getAllByPlaceholderText(/trade url/i)[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" } });
        expect(inputUrl).toHaveValue("https://www.pathofexile.com/trade/search/Keepers/abcdefghij");

        const inputQty = screen.getAllByRole("spinbutton")[0];
        fireEvent.change(inputQty, { target: { value: 3 } });
        expect(inputQty).toHaveValue(3);

        const inputFallback = screen.getAllByPlaceholderText(/fallback price/i)[0];
        fireEvent.change(inputFallback, { target: { value: 42 } });
        expect(inputFallback).toHaveValue(42);

        // Edit output draft fields
        const outputUrl = screen.getAllByPlaceholderText(/trade url/i)[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/klmnopqrst" } });
        expect(outputUrl).toHaveValue("https://www.pathofexile.com/trade/search/Keepers/klmnopqrst");

        const outputQty = screen.getAllByRole("spinbutton")[1];
        fireEvent.change(outputQty, { target: { value: 5 } });
        expect(outputQty).toHaveValue(5);

        const outputFallback = screen.getAllByPlaceholderText(/fallback price/i)[1];
        fireEvent.change(outputFallback, { target: { value: 99 } });
        expect(outputFallback).toHaveValue(99);
    });

    it("triggers resolve when a valid trade URL is entered (mock API)", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Test Item",
                iconUrl: "icon.png",
                originalMinPrice: { amount: 10, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" }, sort: {} },
        });
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByPlaceholderText(/trade url/i)[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        expect(screen.getByText(/10/)).toBeInTheDocument(); // price
        mockResolve.mockRestore();
    });

    it("shows loader and disables controls while resolving", async () => {
        let resolveDeferred: (value: any) => void;
        const deferredPromise = new Promise(resolve => { resolveDeferred = resolve; });
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockImplementation(() => deferredPromise);
        render(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" } });
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
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" }, sort: {} },
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
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" } });
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
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" }, sort: {} },
        });
        render(<CreateRecipePage />);
        // Enter a valid trade URL
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/abcdefghij" } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        // The draft input should NOT contain the resolved trade URL
        const draftInputs = screen.getAllByTestId("trade-url-input");
        draftInputs.forEach(input => {
            expect(input).not.toHaveValue("https://www.pathofexile.com/trade/search/Keepers/abcdefghij");
        });
        // The resolved item should be in the resolved list (look for Remove button in resolved row)
        expect(screen.getByText(/remove/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("moves resolved output to the resolved output row", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockResolvedValue({
            resolved: {
                name: "Output Item",
                iconUrl: "output.png",
                originalMinPrice: { amount: 50, currency: "chaos" },
            },
            search: { query: { tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/klmnopqrst" }, sort: {} },
            error: null,
        });
        render(<CreateRecipePage />);
        // Enter a valid trade URL for output (second trade-url-input is output)
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/klmnopqrst" } });
        // Wait for resolved output to appear
        expect(await screen.findByText(/output item/i)).toBeInTheDocument();
        // None of the draft inputs should have the resolved trade URL
        screen.getAllByTestId("trade-url-input").forEach(input => {
            expect(input).not.toHaveValue("https://www.pathofexile.com/trade/search/Keepers/klmnopqrst");
        });
        // The resolved output should be in the resolved row (look for Remove button)
        expect(screen.getByText(/remove/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("shows an error message if resolving the output fails", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiResolveItem").mockRejectedValue(new Error("Network error"));
        render(<CreateRecipePage />);
        // Output draft is the second trade-url-input
        const allInputs = screen.getAllByTestId("trade-url-input");
        const outputUrl = allInputs[1];
        fireEvent.change(outputUrl, { target: { value: "https://www.pathofexile.com/trade/search/Keepers/klmnopqrst" } });
        expect(await screen.findByText(/failed to resolve output item/i)).toBeInTheDocument();
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
        const mockSubmit = vi.spyOn(DefaultService, "postApiRecipes").mockResolvedValue({});
        render(<CreateRecipePage />);
        // Add a second input
        fireEvent.click(screen.getByRole("button", { name: /add input/i }));
        // Enter trade URLs for both and the output
        const inputUrls = screen.getAllByTestId("trade-url-input");
        fireEvent.change(inputUrls[0], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/inputurlA1" } });
        fireEvent.change(inputUrls[1], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/inputurlB2" } });
        fireEvent.change(inputUrls[2], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/outputurlC" } });

        // Wait for both inputs and output to resolve
        let resolvedRows = await screen.findAllByTestId("recipe-item-row-resolved");
        expect(resolvedRows.some(row => within(row).queryByText("Input1"))).toBeTruthy();
        expect(resolvedRows.some(row => within(row).queryByText("Input2"))).toBeTruthy();
        expect(resolvedRows.some(row => within(row).queryByText("Output"))).toBeTruthy();
        // Submit
        const submitBtn = screen.getByRole("button", { name: /submit recipe/i });
        fireEvent.click(submitBtn);
        expect(await screen.findByText(/recipe submitted successfully/i)).toBeInTheDocument();
        // Resolved rows should be cleared
        expect(screen.queryAllByTestId("recipe-item-row-resolved").length).toBe(0);
        // Assert submit API was called with correct payload and search property
        expect(mockSubmit).toHaveBeenCalledWith({
            inputs: [
                expect.objectContaining({
                    tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/inputurlA1",
                    resolved: expect.objectContaining({ name: "Input1" }),
                    search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "input1-filter" }) }) })
                }),
                expect.objectContaining({
                    tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/inputurlB2",
                    resolved: expect.objectContaining({ name: "Input2" }),
                    search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "input2-filter" }) }) })
                })
            ],
            output: expect.objectContaining({
                tradeUrl: "https://www.pathofexile.com/trade/search/Keepers/outputurlC",
                resolved: expect.objectContaining({ name: "Output" }),
                search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "output-filter" }) }) })
            })
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
        // Add a second input
        fireEvent.click(screen.getByRole("button", { name: /add input/i }));
        // Enter trade URLs for both and the output
        const inputUrls = screen.getAllByTestId("trade-url-input");
        fireEvent.change(inputUrls[0], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/inputurlA1" } });
        fireEvent.change(inputUrls[1], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/inputurlB2" } });
        fireEvent.change(inputUrls[2], { target: { value: "https://www.pathofexile.com/trade/search/Keepers/outputurlC" } });

        // Wait for both inputs and output to resolve
        let resolvedRows = await screen.findAllByTestId("recipe-item-row-resolved");
        expect(resolvedRows.some(row => within(row).queryByText("Input1"))).toBeTruthy();
        expect(resolvedRows.some(row => within(row).queryByText("Input2"))).toBeTruthy();
        expect(resolvedRows.some(row => within(row).queryByText("Output"))).toBeTruthy();
        // Submit
        const submitBtn = screen.getByRole("button", { name: /submit recipe/i });
        fireEvent.click(submitBtn);
        // Error message should appear
        expect(await screen.findByText(/failed to submit recipe|api error/i)).toBeInTheDocument();
        // Resolved rows should still be present (not cleared)
        expect(screen.queryAllByTestId("recipe-item-row-resolved").length).toBeGreaterThan(0);
        mockResolve.mockRestore();
        mockSubmit.mockRestore();
    });
});
