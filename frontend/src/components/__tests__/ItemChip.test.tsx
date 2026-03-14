import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTradeItem, makeTradeRecipeItem } from "../../__tests__/fixtures";
import { ItemChip } from "../item/ItemChip";

describe("ItemChip", () => {
    const baseItem = makeTradeRecipeItem();
    const baseTradeItem = makeTradeItem();

    it("renders icon and price for qty=1, but hides quantity", () => {
        render(<ItemChip item={baseItem} />);
        expect(screen.getByAltText("Test Item")).toBeInTheDocument();
        expect(screen.queryByText("1x")).not.toBeInTheDocument();
        // PriceDisplay uses an image for currency, so check for the chaos icon
        expect(screen.getByAltText("chaos")).toBeInTheDocument();
    });

    it("renders quantity after icon if qty > 1", () => {
        render(<ItemChip item={{ ...baseItem, qty: 3 }} />);
        const qty = screen.getByText("3x");
        expect(qty).toBeInTheDocument();
        // Icon should appear before the quantity badge in the DOM
        const icon = screen.getByAltText("Test Item");
        expect(icon.compareDocumentPosition(qty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders nothing if resolved is missing", () => {
        const noResolved = { ...baseItem, item: { ...baseTradeItem, resolved: undefined } };
        const { container } = render(<ItemChip item={noResolved} />);
        expect(container).toBeEmptyDOMElement();
    });
});
