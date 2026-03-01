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
    const minColor = min > 0 ? "text-green-600" : (min < 0 ? "text-red-600" : "text-neutral-600");
    const maxColor = max > 0 ? "text-green-600" : (max < 0 ? "text-red-600" : "text-neutral-600");
    // Show minus sign for negative values
    const minStr = min < 0 ? `-${Math.abs(min)}` : min.toString();
    const maxStr = max < 0 ? `-${Math.abs(max)}` : max.toString();
    return (
        <span className={className || "inline-flex items-center gap-1 text-primary"}>
            <span className={minColor}>{minStr}</span>
            <span className="mx-1">–</span>
            <span className={maxColor}>{maxStr}</span>
            <span style={{ display: 'inline-block', width: 6 }} />
                {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : currency}
        </span>
    );
};
