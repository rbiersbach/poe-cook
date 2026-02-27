import { ResolvedMarketData } from "api/generated/models/ResolvedMarketData";
import React, { useState } from "react";
import { PriceDisplay } from "./PriceDisplay";

interface PriceWithTooltipProps {
    resolved: ResolvedMarketData;
}

function formatChaos(amount: number | undefined): string {
    if (amount == null) return "?";
    return amount.toLocaleString();
}

export const PriceWithTooltip: React.FC<PriceWithTooltipProps> = ({ resolved }) => {
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
    const minChaos = resolved.minPrice?.amount;
    const medianChaos = resolved.medianPrice?.amount;

    const showMinChaos = resolved.originalMinPrice?.currency !== "chaos" && resolved.minPrice;
    const showMedianChaos = resolved.originalMedianPrice?.currency !== "chaos" && resolved.medianPrice;

    return (
        <span
            className="price-text relative"
            data-testid="price-tooltip"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            aria-label="Show price details"
        >
            <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} />
            {showPopup && (
                <div
                    className={`tooltip hover-tooltip absolute transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
                    style={{ left: "50%", top: "100%", transform: "translateX(-50%)", marginTop: "0.25rem", whiteSpace: "nowrap" }}
                >
                    <div>Min: <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} /></div>
                    {showMinChaos && (
                        <div>Normalized Min: <PriceDisplay amount={minChaos} currency="chaos" /></div>
                    )}
                    <div>Median: <PriceDisplay amount={resolved.originalMedianPrice?.amount} currency={resolved.originalMedianPrice?.currency} /></div>
                    {showMedianChaos && (
                        <div>Normalized Median: <PriceDisplay amount={medianChaos} currency="chaos" /></div>
                    )}
                    <div>Median Listings: {resolved.medianCount ?? "?"}</div>
                </div>
            )}
        </span>
    );
};
