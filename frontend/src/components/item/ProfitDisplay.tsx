import { Recipe } from "api/generated/models/Recipe";
import React, { useState } from "react";
import { getItemPriceChaos } from "../../utils/itemHelpers";
import CurrencyIcon from "./CurrencyIcon";
import ItemIcon from "./ItemIcon";
import { PriceDisplay } from "./PriceDisplay";
import { PriceRangeDisplay } from "./PriceRangeDisplay";

interface ProfitDisplayProps {
    recipe: Recipe;
}

function computeProfit(recipe: Recipe): [number, number] | null {
    if (!recipe.inputs.every(i => getItemPriceChaos(i) != null)) return null;
    if (!recipe.outputs.every(o => getItemPriceChaos(o) != null)) return null;
    const costChaos = recipe.inputs.reduce((sum, item) => sum + (item.qty * (getItemPriceChaos(item) ?? 0)), 0);
    const revenueChaos = recipe.outputs.reduce((sum, out) => sum + (out.qty * (getItemPriceChaos(out) ?? 0)), 0);
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
        return <span className="missing-price text-red-500" data-testid="missing-price">Missing price</span>;
    }

    // Helper for formatting chaos values in the tooltip — max 4 decimal places
    function formatChaos(amount: number | undefined): string {
        if (amount == null) return "?";
        return parseFloat(amount.toFixed(4)).toString();
    }

    return (
        <span
            className="relative profit-tooltip-wrapper"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            aria-label="Show profit calculation details"
            data-testid="profit-tooltip"
        >
            <span className="font-semibold mr-1">Profit: </span>
            <PriceRangeDisplay min={minProfit} max={maxProfit} currency="chaos" />
            {showPopup && (
                <div
                    className={`tooltip hover-tooltip absolute transition-opacity duration-300 z-20 ${fade ? "opacity-0" : "opacity-100"}`}
                    style={{ left: "50%", top: "100%", transform: "translateX(-50%)", marginTop: "0.25rem" }}
                >
                    <div className="mb-1">Calculation details</div>
                    <div className="mb-1">
                        {recipe.inputs.map((item, idx) => (
                            <div key={"input-" + idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                                <span className="flex items-center gap-1 min-w-0">
                                    <ItemIcon src={item.icon} alt={item.name} width="1.35rem" height="1.35rem" />
                                </span>
                                <span className="flex items-center gap-1 profit-red ml-2">
                                    {formatChaos(getItemPriceChaos(item))}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                    <span className="text-white">×</span> <span className="text-white">{parseFloat(item.qty.toFixed(4))}</span> = {formatChaos((getItemPriceChaos(item) ?? 0) * item.qty)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                </span>
                            </div>
                        ))}
                        {recipe.outputs.map((item, idx) => (
                            <div key={"output-" + idx} className="flex items-center justify-between text-xs gap-2 py-0.5">
                                <span className="flex items-center gap-1 min-w-0">
                                    <ItemIcon src={item.icon} alt={item.name} width="1.35rem" height="1.35rem" />
                                </span>
                                <span className="flex items-center gap-1 profit-green ml-2">
                                    {formatChaos(getItemPriceChaos(item))}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                    <span className="text-white">×</span> <span className="text-white">{parseFloat(item.qty.toFixed(4))}</span> = {formatChaos((getItemPriceChaos(item) ?? 0) * item.qty)}
                                    <CurrencyIcon currency="chaos" className="inline w-4 h-4 align-middle" />
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 justify-end">
                        <span>Range:</span>
                        <PriceDisplay
                            amount={conservativeProfit ?? undefined}
                            currency="chaos"
                            className={`${(conservativeProfit ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} inline-flex items-center gap-1`}
                        />
                        <span className="text-gray-400">(-10%)</span>
                        <span className="text-white">-</span>
                        <PriceDisplay
                            amount={maxProfit ?? undefined}
                            currency="chaos"
                            className={`${(maxProfit ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} inline-flex items-center gap-1`}
                        />
                    </div>
                </div>
            )}
        </span>
    );
};
