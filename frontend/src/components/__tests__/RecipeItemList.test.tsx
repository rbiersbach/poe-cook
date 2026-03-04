import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeItem } from "api/generated";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeNinjaItem, makeTradeItem, makeTradeRecipeItem } from "../../__tests__/fixtures";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { LeagueProvider } from "../../context/LeagueContext";
import { RecipeItemList } from "../recipe/RecipeItemList";

function wrap(ui: React.ReactElement) {
    return render(<LeagueProvider defaultLeague={{ id: "Standard", realm: "pc", text: "Standard" }}>{ui}</LeagueProvider>);
}

const mockNinjaItem = makeNinjaItem();

const mockTradeItem = makeTradeRecipeItem({
    qty: 2,
    name: "Mirror of Kalandra",
    icon: "https://example.com/mirror.png",
    item: makeTradeItem({
        resolved: {
            name: "Mirror of Kalandra",
            iconUrl: "https://example.com/mirror.png",
            originalMinPrice: { amount: 1500, currency: "chaos" },
        },
    }),
});

const mockResolveItem = vi.fn().mockResolvedValue(mockTradeItem);

describe("RecipeItemList", () => {
    let mockGetNinjaItems: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockResolveItem.mockResolvedValue(mockTradeItem);
        mockGetNinjaItems = vi.spyOn(DefaultService, "getApiLeagueNinjaItems").mockResolvedValue({
            items: [mockNinjaItem],
        });
    });

    afterEach(() => {
        mockGetNinjaItems.mockRestore();
    });

    it("renders the label and ninja item search input", () => {
        wrap(
            <RecipeItemList
                label="Inputs"
                onResolvedChange={vi.fn()}
                resolveItem={mockResolveItem}
            />
        );
        expect(screen.getByTestId("recipe-item-list-inputs")).toBeInTheDocument();
        expect(screen.getByTestId("ninja-item-search")).toBeInTheDocument();
        expect(screen.getByTestId("item-search-field")).toBeInTheDocument();
    });

    it("adds a ninja item to resolved list when selected from search", async () => {
        const onResolvedChange = vi.fn();
        wrap(
            <RecipeItemList
                label="Inputs"
                onResolvedChange={onResolvedChange}
                resolveItem={mockResolveItem}
            />
        );

        const searchInput = screen.getByTestId("item-search-field");
        fireEvent.change(searchInput, { target: { value: "orb" } });

        await waitFor(() =>
            expect(screen.getByTestId(`item-suggestion-${mockNinjaItem.id}`)).toBeInTheDocument()
        );

        fireEvent.mouseDown(screen.getByTestId(`item-suggestion-${mockNinjaItem.id}`));

        await waitFor(() =>
            expect(onResolvedChange).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: RecipeItem.type.NINJA,
                        name: "Orb of Alteration",
                        item: expect.objectContaining({ id: mockNinjaItem.id }),
                    })
                ])
            )
        );
    });

    it("adds a trade item to resolved list when draft URL is resolved", async () => {
        const onResolvedChange = vi.fn();
        wrap(
            <RecipeItemList
                label="Inputs"
                onResolvedChange={onResolvedChange}
                resolveItem={mockResolveItem}
            />
        );

        const draftInput = screen.getByTestId("trade-url-input");
        fireEvent.change(draftInput, {
            target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" },
        });

        await waitFor(() =>
            expect(screen.getByTestId("item-name")).toHaveTextContent("Mirror of Kalandra")
        );
        expect(onResolvedChange).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    type: RecipeItem.type.TRADE,
                    name: 'Mirror of Kalandra',
                    item: expect.objectContaining({
                        resolved: expect.objectContaining({ name: "Mirror of Kalandra" })
                    })
                })
            ])
        );
    });

    it("removing a resolved item updates the resolved list", async () => {
        const onResolvedChange = vi.fn();
        wrap(
            <RecipeItemList
                label="Inputs"
                onResolvedChange={onResolvedChange}
                resolveItem={mockResolveItem}
                initialResolved={[mockTradeItem]}
            />
        );

        // Initially Mirror of Kalandra should be in the resolved list
        expect(screen.getByTestId("item-name")).toHaveTextContent("Mirror of Kalandra");

        // Click the remove button for the resolved item (testid from RecipeItemRow)
        const removeBtn = screen.getByTestId("remove-input-button");
        fireEvent.click(removeBtn);

        await waitFor(() =>
            expect(screen.queryByText("Mirror of Kalandra")).not.toBeInTheDocument()
        );
    });

    it("search input is disabled while a draft is being resolved", async () => {
        // Use a promise that never resolves to keep resolvingIdx set
        const neverResolve = vi.fn().mockImplementation(() => new Promise(() => { }));

        wrap(
            <RecipeItemList
                label="Inputs"
                onResolvedChange={vi.fn()}
                resolveItem={neverResolve}
            />
        );

        fireEvent.change(screen.getByTestId("trade-url-input"), {
            target: { value: "https://www.pathofexile.com/trade/search/Standard/abcdefghij" },
        });

        await waitFor(() =>
            expect(screen.getByTestId("item-search-field")).toBeDisabled()
        );
    });
});
