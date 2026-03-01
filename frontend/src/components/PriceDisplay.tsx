import React from "react";



import CurrencyIcon from "./CurrencyIcon";


export interface PriceProps {
  amount?: number;
  currency?: string;
  className?: string;
  color?: string;
  showPlusMinus?: boolean;
}

export const PriceDisplay: React.FC<PriceProps> = ({ amount, currency, className, color, showPlusMinus }) => {
  if (amount == null || currency == null) return null;
  const icon = currency?.toLowerCase();
  let sign = "";
  if (showPlusMinus) {
    if (amount > 0) sign = "+";
    else if (amount < 0) sign = "-";
  }
  const displayAmount = showPlusMinus ? Math.abs(amount) : amount;
  return (
    <span className={className || color || "inline-flex items-center gap-1 text-primary"}>
      {sign}{displayAmount}
      {icon ? <CurrencyIcon currency={icon} className="inline w-5 h-5 align-middle" /> : currency}
    </span>
  );
};
