import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemChip } from "../ItemChip";

describe("ItemChip", () => {
    const baseItem = {
        qty: 1,
        tradeUrl: "https://example.com",
        resolved: {
            name: "Test Item",
            iconUrl: "icon.png",
            originalMinPrice: { amount: 10, currency: "chaos" },
        },
    };

    it("renders icon and price for qty=1, but hides quantity", () => {
        render(<ItemChip item={baseItem} />);
        expect(screen.getByAltText("Test Item")).toBeInTheDocument();
        expect(screen.queryByText("1x")).not.toBeInTheDocument();
        // PriceDisplay uses an image for currency, so check for the chaos icon
        expect(screen.getByAltText("chaos")).toBeInTheDocument();
    });

    it("renders quantity before icon if qty > 1", () => {
        render(<ItemChip item={{ ...baseItem, qty: 3 }} />);
        const qty = screen.getByText("3x");
        expect(qty).toBeInTheDocument();
        // Quantity should appear before the icon in the DOM
        const icon = screen.getByAltText("Test Item");
        expect(qty.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders nothing if resolved is missing", () => {
        const { container } = render(<ItemChip item={{ ...baseItem, resolved: undefined }} />);
        expect(container).toBeEmptyDOMElement();
    });
});
