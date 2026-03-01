import { Recipe } from "api/generated/models/Recipe";
import React, { useState } from "react";
import CurrencyIcon from "./CurrencyIcon";
import ItemIcon from "./ItemIcon";
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
    // Conservative profit is the 10% reduced value (first value from computeProfit)
    const conservativeProfit = minProfit;
    const [hover, setHover] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [fade, setFade] = useState(false);

    React.useEffect(() => {
        if (hover) {
            setShowPopup(true);
            setFade(false);
        } else if (showPopup) {
            setFade(true);
            const timeout = setTimeout(() => {
                setShowPopup(false);
                setFade(false);
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [hover, showPopup]);

    if (minProfit == null || maxProfit == null) {
        return <span className="missing-price text-red-500">Missing price</span>;
    }

    // Helper for formatting chaos values
    function formatChaos(amount: number | undefined): string {
        if (amount == null) return "?";
        return amount.toLocaleString();
    }

    return (
        <span
            className="relative profit-tooltip-wrapper"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            aria-label="Show profit calculation details"
        >
            <span className="font-semibold mr-1">Profit: </span>
            <PriceRangeDisplay min={minProfit} max={maxProfit} currency="chaos" />
            {showPopup && (
                <div
                    className={`tooltip hover-tooltip absolute transition-opacity duration-300 z-20 ${fade ? "opacity-0" : "opacity-100"}`}
                    style={{ left: "50%", top: "100%", transform: "translateX(-50%)", marginTop: "0.25rem", minWidth: 240 }}
                >
                    <div className="font-semibold mb-1">Calculation details</div>
                    <div className="mb-1">
                        {recipe.inputs.map((item, idx) => (
                            <div key={"input-" + idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                                <span className="flex items-center gap-1 min-w-0">
                                    <ItemIcon src={item.resolved?.iconUrl || ''} alt={item.resolved?.name || ''} width="1.35rem" height="1.35rem" />
                                </span>
                                <span className="flex items-center gap-1 profit-red ml-2">
                                    {formatChaos(item.resolved?.minPrice?.amount)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                    <span className="text-white">×</span> <span className="text-white">{item.qty}</span> = {formatChaos((item.resolved?.minPrice?.amount ?? 0) * item.qty)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                </span>
                            </div>
                        ))}
                        {recipe.outputs.map((item, idx) => (
                            <div key={"output-" + idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                                <span className="flex items-center gap-1 min-w-0">
                                    <ItemIcon src={item.resolved?.iconUrl || ''} alt={item.resolved?.name || ''} width="1.35rem" height="1.35rem" />
                                </span>
                                <span className="flex items-center gap-1 profit-green ml-2">
                                    {formatChaos(item.resolved?.minPrice?.amount)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                    <span className="text-white">×</span> <span className="text-white">{item.qty}</span> = {formatChaos((item.resolved?.minPrice?.amount ?? 0) * item.qty)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 justify-end">
                        <span className="font-semibold">Range:</span>
                        <span className={
                            `${(conservativeProfit ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} font-semibold flex items-center gap-1`}
                        >
                            {conservativeProfit}
                            <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                        </span>
                        <span className="text-gray-400">(-10%)</span>
                        <span className="text-white">-</span>
                        <span className={
                            `${(maxProfit ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} font-semibold flex items-center gap-1`}
                        >
                            {maxProfit}
                            <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                        </span>
                    </div>
                </div>
            )}
        </span>
    );
};
