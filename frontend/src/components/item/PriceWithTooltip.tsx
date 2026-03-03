import { ResolvedMarketData } from "api/generated/models/ResolvedMarketData";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { PriceDisplay } from "./PriceDisplay";

interface PriceWithTooltipProps {
    resolved: ResolvedMarketData;
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

    const showMinChaos = resolved.originalMinPrice?.currency !== "chaos" && resolved.minPrice;
    const showMedianChaos = resolved.originalMedianPrice?.currency !== "chaos" && resolved.medianPrice;

    const priceRef = React.useRef<HTMLSpanElement>(null);
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
    React.useEffect(() => {
        if (showPopup && priceRef.current) {
            const rect = priceRef.current.getBoundingClientRect();
            setTooltipPos({
                left: rect.left + rect.width / 2,
                top: rect.bottom + 4,
            });
        }
    }, [showPopup]);

    return (
        <span
            className="relative"
            data-testid="price-tooltip"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            aria-label="Show price details"
            ref={priceRef}
        >
            <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} />
            {showPopup && tooltipPos && createPortal(
                <div
                    className={`hover-tooltip fixed transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
                    style={{ left: tooltipPos.left, top: tooltipPos.top, transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 50 }}
                >
                    <div className="flex items-center gap-1">
                        <span>Price:</span>
                        <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} exact />
                        {showMinChaos && (
                            <span className="text-muted">(
                                <PriceDisplay amount={resolved.minPrice?.amount} currency="chaos" exact />
                            )</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span>Median:</span>
                        <PriceDisplay amount={resolved.originalMedianPrice?.amount} currency={resolved.originalMedianPrice?.currency} exact />
                        {showMedianChaos && (
                            <span className="text-muted">(
                                <PriceDisplay amount={resolved.medianPrice?.amount} currency="chaos" exact />
                            )</span>
                        )}
                    </div>
                    <div className="mt-0.5 text-muted text-xs">Listings: {resolved.medianCount ?? "?"}</div>
                </div>,
                document.body
            )}
        </span>
    );
};
