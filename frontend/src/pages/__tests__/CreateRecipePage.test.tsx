import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeRecipe, makeResolveItemResponse } from "../../__tests__/fixtures";
import { RecipeItem } from "../../api/generated/models/RecipeItem";
import { DefaultService } from "../../api/generated/services/DefaultService";
import CreateRecipePage from "../CreateRecipePage";
import { LeagueProvider } from "../../context/LeagueContext";
import type { SelectedLeague } from "../../context/LeagueContext";

const TEST_LEAGUE: SelectedLeague = { id: "Standard", realm: "pc", text: "Standard" };

function renderWithLeague(ui: React.ReactElement) {
    return render(<LeagueProvider defaultLeague={TEST_LEAGUE}>{ui}</LeagueProvider>);
}

const VALID_URL = "https://www.pathofexile.com/trade/search/Standard/abcdefghij";
const ALT_URL = "https://www.pathofexile.com/trade/search/Standard/klmnopqrst";
const INVALID_URL = "https://www.pathofexile.com/trade/search/Standard/invalidurl";
const INPUT_URL_A = "https://www.pathofexile.com/trade/search/Standard/inputurlA1";
const INPUT_URL_B = "https://www.pathofexile.com/trade/search/Standard/inputurlB2";
const OUTPUT_URL_C = "https://www.pathofexile.com/trade/search/Standard/outputurlC";

function mockThreeResolves() {
    return vi.spyOn(DefaultService, "postApiLeagueResolveItem")
        .mockResolvedValueOnce(makeResolveItemResponse({ name: "Input1", iconUrl: "input1.png", amount: 1, search: { query: { filters: { type: "input1-filter" } }, sort: {} } }))
        .mockResolvedValueOnce(makeResolveItemResponse({ name: "Input2", iconUrl: "input2.png", amount: 2, search: { query: { filters: { type: "input2-filter" } }, sort: {} } }))
        .mockResolvedValueOnce(makeResolveItemResponse({ name: "Output", iconUrl: "output.png", amount: 3, search: { query: { filters: { type: "output-filter" } }, sort: {} } }));
}

describe("CreateRecipePage", () => {

    it("autofills the name field with the resolved output name when only output is filled", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ name: "Resolved Output Name" })
        );
        renderWithLeague(<CreateRecipePage />);
        // Only fill the output draft (second trade-url-input)
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: VALID_URL } });
        // Wait for output to resolve and autofill
        expect(await screen.findByText(/resolved output name/i)).toBeInTheDocument();
        // Name field should be autofilled
        const nameInput = await screen.findByDisplayValue("Resolved Output Name");
        expect(nameInput).toHaveValue("Resolved Output Name");
        mockResolve.mockRestore();
    });

    it("autofills the name field with the first output's resolved name if empty", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ name: "Autofill Output Name", search: { query: { tradeUrl: VALID_URL }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        // Output draft is the second trade-url-input
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: VALID_URL } });
        // Wait for output to resolve and autofill
        await screen.findByText(/autofill output name/i);
        // Wait for the name field to be autofilled
        await screen.findByDisplayValue("Autofill Output Name");
        const nameInput = screen.getByTestId("recipe-name-input");
        expect(nameInput).toHaveValue("Autofill Output Name");
        mockResolve.mockRestore();
    });
    it("renders all main sections (inputs, output, submit button, clear button)", () => {
        renderWithLeague(<CreateRecipePage />);
        // Inputs section
        expect(screen.getByTestId("recipe-item-list-inputs")).toBeInTheDocument();
        // Output section
        expect(screen.getByTestId("recipe-item-list-outputs")).toBeInTheDocument();
        // Submit button
        expect(screen.getByRole("button", { name: /submit recipe/i })).toBeInTheDocument();
        // Clear button (disabled when form is empty)
        const clearBtn = screen.getByTestId("cancel-recipe-button");
        expect(clearBtn).toBeInTheDocument();
        expect(clearBtn).toHaveTextContent(/clear/i);
        expect(clearBtn).toBeDisabled();
    });

    it("can add and remove input drafts (never fewer than one)", async () => {
        renderWithLeague(<CreateRecipePage />);
        // Should start with two input drafts (input + output)
        expect(screen.getAllByTestId("trade-url-input")).toHaveLength(2);
        // Add input by providing a valid trade URL (mock API)
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ search: { query: { tradeUrl: VALID_URL }, sort: {} } })
        );
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
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
        vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockImplementation(() => new Promise(() => { }) as any);
        renderWithLeague(<CreateRecipePage />);
        // Edit input draft fields
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        expect(inputUrl).toHaveValue(VALID_URL);

        const inputQty = screen.getAllByTestId("qty-input")[0];
        fireEvent.change(inputQty, { target: { value: 3 } });
        expect(inputQty).toHaveValue(3);

        // Edit output draft fields
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: ALT_URL } });
        expect(outputUrl).toHaveValue(ALT_URL);

        const outputQty = screen.getAllByTestId("qty-input")[1];
        fireEvent.change(outputQty, { target: { value: 2 } });
        expect(outputQty).toHaveValue(2);
        vi.restoreAllMocks();
    });

    it("triggers resolve when a valid trade URL is entered (mock API)", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ search: { query: { tradeUrl: VALID_URL }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        expect(screen.getByText(/10/)).toBeInTheDocument(); // price
        mockResolve.mockRestore();
    });

    it("shows loader and disables controls while resolving", async () => {
        let resolveDeferred: (value: any) => void;
        const deferredPromise = new Promise(resolve => { resolveDeferred = resolve; });
        // Return a CancelablePromise<ResolveItemResponse> for correct typing
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockImplementation(() => {
            // @ts-expect-error: ignore internal CancelablePromise implementation details for test
            return deferredPromise as unknown as CancelablePromise<ResolveItemResponse>;
        });
        renderWithLeague(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        // Loader should appear while promise is unresolved
        expect(await screen.findByTestId("loader")).toBeInTheDocument();
        expect(inputUrl).toBeDisabled();
        // Now resolve the promise
        resolveDeferred!({
            ...makeResolveItemResponse({ search: { query: { tradeUrl: VALID_URL }, sort: {} } }),
            error: null,
        });
        // Wait for loader to disappear and item to show
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        expect(screen.queryByTestId("loader")).toBeNull();
        mockResolve.mockRestore();
    });

    it("shows an error message if resolving an input fails", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockRejectedValue(new Error("Network error"));
        renderWithLeague(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        expect(await screen.findByText(/failed to resolve item/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("moves resolved items to the resolved list", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ search: { query: { tradeUrl: VALID_URL }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        // Enter a valid trade URL
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        // The draft input should NOT contain the resolved trade URL
        screen.getAllByTestId("trade-url-input").forEach(input => {
            expect(input).not.toHaveValue(VALID_URL);
        });
        // The resolved item should be in the resolved list (look for Remove button in resolved row)
        expect(screen.getByTestId("remove-input-button")).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("moves resolved output to the resolved output row", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ name: "Output Item", iconUrl: "output.png", amount: 50, search: { query: { tradeUrl: ALT_URL }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        // Enter a valid trade URL for output (second trade-url-input is output)
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: ALT_URL } });
        // Wait for resolved output to appear
        expect(await screen.findByText(/output item/i)).toBeInTheDocument();
        // None of the draft inputs should have the resolved trade URL
        screen.getAllByTestId("trade-url-input").forEach(input => {
            expect(input).not.toHaveValue(ALT_URL);
        });
        // The resolved output should be in the resolved row (look for Remove button)
        expect(screen.getByTestId("remove-input-button")).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("shows an error message if resolving the output fails", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockRejectedValue(new Error("Network error"));
        renderWithLeague(<CreateRecipePage />);
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: ALT_URL } });
        expect(await screen.findByText(/failed to resolve item/i)).toBeInTheDocument();
        mockResolve.mockRestore();
    });

    it("submits successfully with two inputs and one output", async () => {
        const mockResolve = mockThreeResolves();
        const mockSubmit = vi.spyOn(DefaultService, "postApiLeagueRecipes").mockResolvedValue({
            recipe: makeRecipe({ id: "mock-id", name: "Output" }),
        });
        renderWithLeague(<CreateRecipePage />);
        // Fill and resolve first input draft
        let inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: INPUT_URL_A } });
        expect(await screen.findByText("Input1")).toBeInTheDocument();
        // Wait for new draft to appear and fill/resolve it
        await screen.findAllByTestId("recipe-item-row-draft");
        inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: INPUT_URL_B } });
        expect(await screen.findByText("Input2")).toBeInTheDocument();
        // Fill and resolve output draft (second trade-url-input is output)
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: OUTPUT_URL_C } });
        expect(await screen.findByText("Output")).toBeInTheDocument();
        // Submit — wait for state to propagate up via onResolvedChange before clicking
        const submitBtn = screen.getByRole("button", { name: /submit recipe/i });
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);
        expect(await screen.findByText(/recipe submitted successfully/i)).toBeInTheDocument();
        // Resolved rows should be cleared
        expect(screen.queryAllByTestId("recipe-item-row-resolved").length).toBe(0);
        // Assert submit API was called with correct payload and search property
        expect(mockSubmit).toHaveBeenCalledWith(TEST_LEAGUE.id, {
            name: "Output",
            inputs: [
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Input1',
                    item: expect.objectContaining({
                        tradeUrl: INPUT_URL_A,
                        resolved: expect.objectContaining({ name: "Input1" }),
                        search: expect.objectContaining({ query: expect.objectContaining({ filters: expect.objectContaining({ type: "input1-filter" }) }) })
                    })
                }),
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Input2',
                    item: expect.objectContaining({
                        tradeUrl: INPUT_URL_B,
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
                        tradeUrl: OUTPUT_URL_C,
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
        const mockResolve = mockThreeResolves();
        const mockSubmit = vi.spyOn(DefaultService, "postApiLeagueRecipes").mockRejectedValue(new Error("API error: failed to submit"));
        renderWithLeague(<CreateRecipePage />);

        // Fill out name
        const nameInput = screen.getByTestId("recipe-name-input");
        fireEvent.change(nameInput, { target: { value: "My Custom Recipe" } });
        // Fill and resolve first input draft
        let inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: INPUT_URL_A } });
        // Wait for Input1 to resolve
        await screen.findByText("Input1");
        // Wait for new draft to appear
        await screen.findAllByTestId("recipe-item-row-draft");
        // Fill and resolve second input draft
        inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: INPUT_URL_B } });
        // Wait for Input2 to resolve
        await screen.findByText("Input2");
        // Fill and resolve output draft
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: OUTPUT_URL_C } });
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
        renderWithLeague(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ name: "Manual Item", amount: 5, search: { query: { tradeUrl: INVALID_URL }, sort: {} } })
        );
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
        renderWithLeague(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockRejectedValue(new Error("Network error"));
        // Use an invalid trade URL to avoid auto-resolve
        const outputUrl = screen.getAllByTestId("trade-url-input")[1];
        fireEvent.change(outputUrl, { target: { value: INVALID_URL } });
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
        renderWithLeague(<CreateRecipePage />);
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockRejectedValue(new Error("Network error"));
        // Use an invalid trade URL to avoid auto-resolve
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: INVALID_URL } });
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
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ search: { query: { someOtherField: "foo" }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        fireEvent.keyDown(inputUrl, { key: "Enter", code: "Enter" });
        // Wait for resolved item to appear
        expect(await screen.findByText(/test item/i)).toBeInTheDocument();
        // The link icon should be present and correct
        const link = screen.getByTestId("trade-url-link");
        expect(link).toHaveAttribute("href", VALID_URL);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
        mockResolve.mockRestore();
    });

    it("'Clear' button becomes enabled when name is filled and resets the form on click", async () => {
        renderWithLeague(<CreateRecipePage />);
        const nameInput = screen.getByTestId("recipe-name-input");
        const clearBtn = screen.getByTestId("cancel-recipe-button");

        // Disabled initially
        expect(clearBtn).toBeDisabled();

        // Type a name — button should enable
        fireEvent.change(nameInput, { target: { value: "My Recipe" } });
        expect(clearBtn).not.toBeDisabled();

        // Click clear — name should be reset and button disabled again
        fireEvent.click(clearBtn);
        expect(nameInput).toHaveValue("");
        expect(clearBtn).toBeDisabled();
    });

    it("'Clear' button becomes enabled when an input is resolved and clears resolved items on click", async () => {
        const mockResolve = vi.spyOn(DefaultService, "postApiLeagueResolveItem").mockResolvedValue(
            makeResolveItemResponse({ name: "Some Item", search: { query: { tradeUrl: VALID_URL }, sort: {} } })
        );
        renderWithLeague(<CreateRecipePage />);
        const inputUrl = screen.getAllByTestId("trade-url-input")[0];
        fireEvent.change(inputUrl, { target: { value: VALID_URL } });
        await screen.findByText(/some item/i);

        const clearBtn = screen.getByTestId("cancel-recipe-button");
        expect(clearBtn).not.toBeDisabled();

        fireEvent.click(clearBtn);

        // Resolved rows should be gone
        expect(screen.queryAllByTestId("recipe-item-row-resolved")).toHaveLength(0);
        expect(clearBtn).toBeDisabled();
        mockResolve.mockRestore();
    });
});
