import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfitDisplay } from "../ProfitDisplay";

describe("ProfitDisplay", () => {
    function makeRecipe(profit: number) {
        return {
            id: "r1",
            inputs: [{ qty: 1, resolved: { minPrice: { amount: 0, currency: "chaos" } } }],
            output: { qty: 1, resolved: { minPrice: { amount: profit, currency: "chaos" } } },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    it("shows both values green when both are positive", () => {
        render(<ProfitDisplay recipe={makeRecipe(100)} />);
        const min = screen.getByText("90");
        const max = screen.getByText("100");
        expect(min).toHaveClass("text-green-600");
        expect(max).toHaveClass("text-green-600");
    });

    it("shows both values red when both are negative", () => {
        render(<ProfitDisplay recipe={makeRecipe(-100)} />);
        const min = screen.getByText("90");
        const max = screen.getByText("100");
        // Since we use Math.abs, the numbers are positive, but color should be red
        expect(min).toHaveClass("text-red-600");
        expect(max).toHaveClass("text-red-600");
    });

    it("shows min red and max green when min is negative and max is positive", () => {
        const recipe = {
            id: "r2",
            inputs: [{ qty: 1, resolved: { minPrice: { amount: 970, currency: "chaos" } } }],
            output: { qty: 1, resolved: { minPrice: { amount: 1000, currency: "chaos" } } },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        render(<ProfitDisplay recipe={recipe} />);
        const min = screen.getByText("70");
        const max = screen.getByText("30");
        expect(min).toHaveClass("text-red-600");
        expect(max).toHaveClass("text-green-600");
    });
});
