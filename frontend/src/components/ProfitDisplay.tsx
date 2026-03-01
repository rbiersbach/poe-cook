import { Recipe } from "api/generated/models/Recipe";
import React from "react";
import { PriceRangeDisplay } from "./PriceRangeDisplay";

interface ProfitDisplayProps {
    recipe: Recipe;
}

function computeProfit(recipe: Recipe): [number, number] | null {
    if (!recipe.inputs.every(i => i.resolved && i.resolved.minPrice)) {
        return null;
    }
    // Sum all outputs' value
    const allOutputsHavePrice = recipe.outputs.every(o => o.resolved && o.resolved.minPrice);
    if (!allOutputsHavePrice) return null;
    const costChaos = recipe.inputs.reduce((sum, item) => sum + (item.qty * (item.resolved?.minPrice?.amount ?? 0)), 0);
    const revenueChaos = recipe.outputs.reduce((sum, out) => sum + (out.qty * (out.resolved?.minPrice?.amount ?? 0)), 0);
    const conservativeRevenue = revenueChaos * 0.9;
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
