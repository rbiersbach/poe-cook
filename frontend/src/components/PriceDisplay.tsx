import React from "react";



import CurrencyIcon from "./CurrencyIcon";


export interface PriceProps {
  amount?: number;
  currency?: string;
  className?: string;
  color?: string;
  showPlusMinus?: boolean;
  /** When true, skips rounding and shows the full precision value */
  exact?: boolean;
}

export const PriceDisplay: React.FC<PriceProps> = ({ amount, currency, className, color, showPlusMinus, exact }) => {
  if (amount == null || currency == null) return null;
  const icon = currency?.toLowerCase();
  let sign = "";
  if (showPlusMinus) {
    if (amount > 0) sign = "+";
    else if (amount < 0) sign = "-";
  }
  const displayAmount = showPlusMinus ? Math.abs(amount) : amount;
  const formatted = exact ? displayAmount.toString() : parseFloat(displayAmount.toFixed(1)).toString();
  const isApproxZero = !exact && formatted === "0" && displayAmount !== 0;
  const displayStr = isApproxZero ? "~0" : formatted;
  return (
    <span
      className={className || color || "inline-flex items-center gap-1 text-primary"}
    >
      {sign}{displayStr}
      {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : currency}
    </span>
  );
};
