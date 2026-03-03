import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NinjaItem } from "../../api/generated/models/NinjaItem";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { ItemSearchInput } from "../item/ItemSearchInput";

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

const mockNinjaItem2: NinjaItem = {
    ...mockNinjaItem,
    id: "orb-of-alchemy",
    name: "Orb of Alchemy",
    detailsId: "orb-of-alchemy",
    price: 3,
};

describe("ItemSearchInput", () => {
    let mockGet: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        mockGet = vi.spyOn(DefaultService, "getApiNinjaItems").mockResolvedValue({
            items: [mockNinjaItem, mockNinjaItem2],
        });
    });

    afterEach(() => {
        mockGet.mockRestore();
    });

    it("renders the search input", () => {
        render(<ItemSearchInput onSelect={vi.fn()} />);
        expect(screen.getByTestId("item-search-field")).toBeInTheDocument();
    });

    it("fetches suggestions after debounce and shows dropdown", async () => {
        render(<ItemSearchInput onSelect={vi.fn()} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "orb" } });

        await waitFor(() =>
            expect(screen.getByTestId("item-search-dropdown")).toBeInTheDocument()
        );
        expect(screen.getByTestId("item-suggestion-orb-of-alteration")).toBeInTheDocument();
        expect(screen.getByTestId("item-suggestion-orb-of-alchemy")).toBeInTheDocument();
    });

    it("calls onSelect with the item when a suggestion is clicked", async () => {
        const onSelect = vi.fn();
        render(<ItemSearchInput onSelect={onSelect} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "orb" } });
        await waitFor(() =>
            expect(screen.getByTestId("item-suggestion-orb-of-alteration")).toBeInTheDocument()
        );

        fireEvent.mouseDown(screen.getByTestId("item-suggestion-orb-of-alteration"));
        expect(onSelect).toHaveBeenCalledWith(mockNinjaItem);
    });

    it("clears input and closes dropdown after selection", async () => {
        render(<ItemSearchInput onSelect={vi.fn()} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "orb" } });
        await waitFor(() =>
            expect(screen.getByTestId("item-suggestion-orb-of-alteration")).toBeInTheDocument()
        );
        fireEvent.mouseDown(screen.getByTestId("item-suggestion-orb-of-alteration"));

        expect(input).toHaveValue("");
        expect(screen.queryByTestId("item-search-dropdown")).not.toBeInTheDocument();
    });

    it("closes dropdown on Escape key", async () => {
        render(<ItemSearchInput onSelect={vi.fn()} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "orb" } });
        await waitFor(() =>
            expect(screen.getByTestId("item-search-dropdown")).toBeInTheDocument()
        );

        fireEvent.keyDown(input, { key: "Escape" });
        expect(screen.queryByTestId("item-search-dropdown")).not.toBeInTheDocument();
    });

    it("navigates suggestions with arrow keys and selects on Enter", async () => {
        const onSelect = vi.fn();
        render(<ItemSearchInput onSelect={onSelect} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "orb" } });
        await waitFor(() =>
            expect(screen.getByTestId("item-search-dropdown")).toBeInTheDocument()
        );

        // Navigate to first item (idx 0), then second (idx 1)
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onSelect).toHaveBeenCalledWith(mockNinjaItem2);
    });

    it("does not fetch or show dropdown for empty query", async () => {
        vi.useFakeTimers();
        render(<ItemSearchInput onSelect={vi.fn()} />);
        const input = screen.getByTestId("item-search-field");

        fireEvent.change(input, { target: { value: "" } });
        // Advance past the debounce delay to confirm nothing is fetched
        await act(async () => { vi.advanceTimersByTime(400); });

        expect(mockGet).not.toHaveBeenCalled();
        expect(screen.queryByTestId("item-search-dropdown")).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it("is disabled when disabled prop is true", () => {
        render(<ItemSearchInput onSelect={vi.fn()} disabled={true} />);
        expect(screen.getByTestId("item-search-field")).toBeDisabled();
    });
});
