import React from "react";

import CurrencyIcon from "./CurrencyIcon";

export interface PriceRangeDisplayProps {
    min: number;
    max: number;
    currency: string;
    className?: string;
    color?: string;
}

export const PriceRangeDisplay: React.FC<PriceRangeDisplayProps> = ({ min, max, currency, className }) => {
    if (min == null || max == null || currency == null) return null;
        const icon = currency?.toLowerCase();

    // Define colors for min and max values based on profitability, each on their own
    const minColor = min > 0 ? "price-positive" : (min < 0 ? "price-negative" : "price-neutral");
    const maxColor = max > 0 ? "price-positive" : (max < 0 ? "price-negative" : "price-neutral");
    // Show minus sign for negative values, max 1 decimal
    const fmt = (n: number) => parseFloat(Math.abs(n).toFixed(1)).toString();
    const minFmt = fmt(min);
    const maxFmt = fmt(max);
    const minApproxZero = minFmt === "0" && min !== 0;
    const maxApproxZero = maxFmt === "0" && max !== 0;
    const minStr = (min < 0 ? `-${minFmt}` : minFmt);
    const maxStr = (max < 0 ? `-${maxFmt}` : maxFmt);
    return (
        <span className={className || "inline-flex items-center gap-1 text-primary"}>
            <span className={minColor} data-testid="price-min">{minApproxZero ? `~${minStr}` : minStr}</span>
            <span className="mx-1">–</span>
            <span className={maxColor} data-testid="price-max">{maxApproxZero ? `~${maxStr}` : maxStr}</span>
            <span style={{ display: 'inline-block', width: 6 }} />
                {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : currency}
        </span>
    );
};
