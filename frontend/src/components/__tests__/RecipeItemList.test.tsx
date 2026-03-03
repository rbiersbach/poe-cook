import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NinjaItem } from "../../api/generated/models/NinjaItem";
import { RecipeItem } from "../../api/generated/models/RecipeItem";
import type { TradeItem } from "../../api/generated/models/TradeItem";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { RecipeItemList } from "../recipe/RecipeItemList";

const mockNinjaItem: NinjaItem = {
    id: "orb-of-alteration",
    name: "Orb of Alteration",
    icon: "https://example.com/alt.png",
    category: NinjaItem.category.CURRENCY,
    detailsId: "orb-of-alteration",
    price: 1.5,
    priceHistory: [1.2, 1.4, 1.5],
    volume: 1000,
    maxVolumeCurrency: "chaos",
    maxVolumeRate: 0.5,
    fetchedAt: new Date().toISOString(),
};

const mockTradeItem: RecipeItem = {
    qty: 2,
    type: RecipeItem.type.TRADE,
    name: "Mirror of Kalandra",
    icon: "https://example.com/mirror.png",
    item: {
        tradeUrl: "https://www.pathofexile.com/trade/search/Standard/abcdefghij",
        search: {} as TradeItem['search'],
        resolved: {
            name: "Mirror of Kalandra",
            iconUrl: "https://example.com/mirror.png",
            originalMinPrice: { amount: 1500, currency: "chaos" },
        },
    } as TradeItem,
};

const mockResolveItem = vi.fn().mockResolvedValue(mockTradeItem);
const tradeUrlPattern = /https:\/\/www\.pathofexile\.com\/trade\//;

describe("RecipeItemList", () => {
    let mockGetNinjaItems: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockResolveItem.mockResolvedValue(mockTradeItem);
        mockGetNinjaItems = vi.spyOn(DefaultService, "getApiNinjaItems").mockResolvedValue({
            items: [mockNinjaItem],
        });
    });

    afterEach(() => {
        mockGetNinjaItems.mockRestore();
    });

    it("renders the label and ninja item search input", () => {
        render(
            <RecipeItemList
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
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
        render(
            <RecipeItemList
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
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
        render(
            <RecipeItemList
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
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
        render(
            <RecipeItemList
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
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

        render(
            <RecipeItemList
                label="Inputs"
                tradeUrlPattern={tradeUrlPattern}
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
