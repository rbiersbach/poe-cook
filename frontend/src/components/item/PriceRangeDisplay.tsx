import React from "react";
import { useExchangeRate } from "../../context/ExchangeRateContext";
import { convertChaosPrice } from "../../utils/itemHelpers";
import CurrencyIcon from "./CurrencyIcon";

export interface PriceRangeDisplayProps {
    min: number;
    max: number;
    currency: string;
    className?: string;
    color?: string;
}

export const PriceRangeDisplay: React.FC<PriceRangeDisplayProps> = ({ min, max, currency, className }) => {
    const { divineRate } = useExchangeRate();
    if (min == null || max == null || currency == null) return null;

    // Auto-convert chaos → divine: use largest absolute value to decide consistently for the pair
    let displayMin = min;
    let displayMax = max;
    let displayCurrency = currency;
    if (currency.toLowerCase() === "chaos") {
        const absMax = Math.max(Math.abs(min), Math.abs(max));
        const { currency: converted } = convertChaosPrice(absMax, divineRate);
        if (converted === "divine" && divineRate) {
            displayMin = min / divineRate;
            displayMax = max / divineRate;
            displayCurrency = "divine";
        }
    }

    const icon = displayCurrency?.toLowerCase();
    // Define colors for min and max values based on profitability, each on their own
    const minColor = displayMin > 0 ? "price-positive" : (displayMin < 0 ? "price-negative" : "price-neutral");
    const maxColor = displayMax > 0 ? "price-positive" : (displayMax < 0 ? "price-negative" : "price-neutral");
    // Show minus sign for negative values, max 1 decimal
    const fmt = (n: number) => parseFloat(Math.abs(n).toFixed(1)).toString();
    const minFmt = fmt(displayMin);
    const maxFmt = fmt(displayMax);
    const minApproxZero = minFmt === "0" && displayMin !== 0;
    const maxApproxZero = maxFmt === "0" && displayMax !== 0;
    const minStr = (displayMin < 0 ? `-${minFmt}` : minFmt);
    const maxStr = (displayMax < 0 ? `-${maxFmt}` : maxFmt);
    return (
        <span className={className || "inline-flex items-center gap-1 text-primary"}>
            <span className={minColor} data-testid="price-min">{minApproxZero ? `~${minStr}` : minStr}</span>
            <span className="mx-1">–</span>
            <span className={maxColor} data-testid="price-max">{maxApproxZero ? `~${maxStr}` : maxStr}</span>
            <span style={{ display: 'inline-block', width: 6 }} />
            {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : displayCurrency}
        </span>
    );
};
