import React, { useState } from "react";
import ItemIcon from "./ItemIcon";
import { TradeUrlLink } from "./TradeUrlLink";

interface ItemIconWithHoverProps {
  iconUrl: string;
  name?: string;
  tradeUrl?: string;
  alt?: string;
  className?: string;
}

export const ItemIconWithHover: React.FC<ItemIconWithHoverProps> = ({ iconUrl, name, tradeUrl, alt = "icon", className }) => {
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

  return (
    <span
      className={"relative " + (className || "")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      tabIndex={0}
      aria-label="Show item name"
    >
      <ItemIcon src={iconUrl} alt={alt} />
      {showPopup && name && (
        <div
          className={`hover-tooltip absolute transition-opacity duration-300 flex items-center gap-2 ${fade ? "opacity-0" : "opacity-100"}`}
          style={{ left: "50%", top: "100%", transform: "translateX(-50%)", marginTop: "0.25rem", whiteSpace: "nowrap" }}
        >
          <span>{name}</span>
          {tradeUrl && <TradeUrlLink url={tradeUrl} className="ml-2" />}
        </div>
      )}
    </span>
  );
};
