import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TradeSearchResults } from "../TradeSearchResults";

describe("TradeSearchResults", () => {
    it("shows no results message when empty", () => {
        render(<TradeSearchResults results={[]} />);
        expect(screen.getByText(/No results to display/i)).toBeInTheDocument();
    });

    it("renders results list", () => {
        const results = [
            { id: "abc", price: "100 chaos" },
            { id: "def", price: "200 divine" }
        ];
        render(<TradeSearchResults results={results} />);
        expect(screen.getByText("abc")).toBeInTheDocument();
        expect(screen.getByText("100 chaos")).toBeInTheDocument();
        expect(screen.getByText("def")).toBeInTheDocument();
        expect(screen.getByText("200 divine")).toBeInTheDocument();
    });
});