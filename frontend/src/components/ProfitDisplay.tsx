import { Recipe } from "api/generated/models/Recipe";
import React from "react";
import { PriceRangeDisplay } from "./PriceRangeDisplay";

interface ProfitDisplayProps {
    recipe: Recipe;
}

function computeProfit(recipe: Recipe): [number, number] | null {
    if (!recipe.inputs.every(i => i.resolved && i.resolved.minPrice) || !recipe.output.resolved || !recipe.output.resolved.minPrice) {
        return null;
    }
    const costChaos = recipe.inputs.reduce((sum, item) => sum + (item.qty * (item.resolved?.minPrice?.amount ?? 0)), 0);
    const revenueChaos = recipe.output.qty * (recipe.output.resolved.minPrice.amount ?? 0);
    const conservativeRevenue = revenueChaos * 0.9; // Assume we only get 90% of the listed price on average
    return [conservativeRevenue - costChaos, revenueChaos - costChaos];
}

export const ProfitDisplay: React.FC<ProfitDisplayProps> = ({ recipe }) => {
    const [minProfit, maxProfit] = computeProfit(recipe) ?? [null, null];
    if (minProfit == null || maxProfit == null) {
        return <span className="missing-price text-red-500">Missing price</span>;
    }
    return (
        <span>
            <span className="font-semibold mr-1">Profit: </span>
            <PriceRangeDisplay min={minProfit} max={maxProfit} currency="chaos" />
        </span>
    );
};
