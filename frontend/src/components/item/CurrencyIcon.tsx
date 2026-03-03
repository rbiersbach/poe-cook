import React from "react";
import chaosIcon from "../../../resources/assets/chaos.png";
import divineIcon from "../../../resources/assets/divine.png";

const currencyIcons: Record<string, string> = {
  chaos: chaosIcon,
  divine: divineIcon,
};

interface CurrencyIconProps {
  currency: string;
  className?: string;
}

const CurrencyIcon: React.FC<CurrencyIconProps> = ({ currency, className }) => {
  const icon = currencyIcons[currency.toLowerCase()];
  if (!icon) return null;
  return <img src={icon} alt={currency} className={className || "inline w-5 h-5 align-middle"} />;
};

export default CurrencyIcon;