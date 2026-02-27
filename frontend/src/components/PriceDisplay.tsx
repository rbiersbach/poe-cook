import React from "react";


import chaosIcon from "../../resources/assets/chaos.png";
import divineIcon from "../../resources/assets/divine.png";

const currencyIcons: Record<string, string> = {
  chaos: chaosIcon,
  divine: divineIcon,
};

export interface PriceProps {
  amount?: number;
  currency?: string;
  className?: string;
}

export const PriceDisplay: React.FC<PriceProps> = ({ amount, currency, className }) => {
  if (!amount || !currency) return null;
  const icon = currencyIcons[currency.toLowerCase()];
  return (
    <span className={className || "inline-flex items-center gap-1 text-primary"}>
      {amount}
      {icon && (
        <img src={icon} alt={currency} className="inline w-5 h-5 align-middle" />
      )}
      {!icon && currency}
    </span>
  );
};
