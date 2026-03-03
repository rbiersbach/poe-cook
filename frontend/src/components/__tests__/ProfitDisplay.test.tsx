import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Recipe, RecipeItem } from "../../api/generated";
import { ProfitDisplay } from "../item/ProfitDisplay";

describe("ProfitDisplay", () => {
    function makeRecipe(profit: number): Recipe {
        return {
            id: "r1",
            name: "Test Recipe",
            inputs: [{ qty: 1, type: RecipeItem.type.TRADE, name: 'Input', icon: '', item: { tradeUrl: '', search: { query: {} }, resolved: { minPrice: { amount: 0, currency: "chaos" } } } }],
            outputs: [{ qty: 1, type: RecipeItem.type.TRADE, name: 'Output', icon: '', item: { tradeUrl: '', search: { query: {} }, resolved: { minPrice: { amount: profit, currency: "chaos" } } } }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    it("shows both values green when both are positive", () => {
        render(<ProfitDisplay recipe={makeRecipe(100)} />);
        const min = screen.getByTestId("price-min");
        const max = screen.getByTestId("price-max");
        expect(min).toHaveClass("price-positive");
        expect(max).toHaveClass("price-positive");
    });

    it("shows both values red when both are negative", () => {
        render(<ProfitDisplay recipe={makeRecipe(-100)} />);
        const min = screen.getByTestId("price-min");
        const max = screen.getByTestId("price-max");
        expect(min).toHaveClass("price-negative");
        expect(max).toHaveClass("price-negative");
    });

    it("shows min red and max green when min is negative and max is positive", () => {
        const recipe: Recipe = {
            id: "r2",
            name: "Test Recipe",
            inputs: [{ qty: 1, type: RecipeItem.type.TRADE, name: 'Input', icon: '', item: { tradeUrl: '', search: { query: {} }, resolved: { minPrice: { amount: 970, currency: "chaos" } } } }],
            outputs: [{ qty: 1, type: RecipeItem.type.TRADE, name: 'Output', icon: '', item: { tradeUrl: '', search: { query: {} }, resolved: { minPrice: { amount: 1000, currency: "chaos" } } } }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        render(<ProfitDisplay recipe={recipe} />);
        const min = screen.getByTestId("price-min");
        const max = screen.getByTestId("price-max");
        expect(min).toHaveClass("price-negative");
        expect(max).toHaveClass("price-positive");
    });
});
