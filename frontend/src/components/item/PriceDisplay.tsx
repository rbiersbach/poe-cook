import React from "react";
import { useExchangeRate } from "../../context/ExchangeRateContext";
import { convertChaosPrice } from "../../utils/itemHelpers";
import CurrencyIcon from "./CurrencyIcon";

export interface PriceProps {
  amount?: number;
  currency?: string;
  className?: string;
  color?: string;
  showPlusMinus?: boolean;
  /** When true, skips conversion and rounding — used for detailed tooltip views */
  exact?: boolean;
}

export const PriceDisplay: React.FC<PriceProps> = ({ amount, currency, className, color, showPlusMinus, exact }) => {
  const { divineRate } = useExchangeRate();
  if (amount == null || currency == null) return null;

  // Auto-convert chaos → divine when not in exact/detail mode
  let displayAmount = amount;
  let displayCurrency = currency;
  if (!exact && currency.toLowerCase() === "chaos") {
    const converted = convertChaosPrice(amount, divineRate);
    displayAmount = converted.amount;
    displayCurrency = converted.currency;
  }

  const icon = displayCurrency?.toLowerCase();
  const sign = showPlusMinus ? (displayAmount > 0 ? "+" : displayAmount < 0 ? "-" : "") : "";
  const absAmount = showPlusMinus ? Math.abs(displayAmount) : displayAmount;
  const formatted = exact ? absAmount.toString() : parseFloat(absAmount.toFixed(1)).toString();
  const isApproxZero = !exact && formatted === "0" && displayAmount !== 0;
  const displayStr = isApproxZero ? "~0" : formatted;
  return (
    <span
      className={className || color || "inline-flex items-center gap-1 text-primary"}
    >
      {sign}{displayStr}
      {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : displayCurrency}
    </span>
  );
};
