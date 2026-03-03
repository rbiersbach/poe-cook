import type { NinjaItem } from "api/generated/models/NinjaItem";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import CurrencyIcon from "./CurrencyIcon";
import { PriceDisplay } from "./PriceDisplay";
import { VolumeDisplay } from "./VolumeDisplay";

interface NinjaPriceTooltipProps {
    item: NinjaItem;
}

function trendIndicator(history: number[]): { symbol: string; color: string } {
    if (history.length < 2) return { symbol: "→", color: "text-gray-400" };
    const first = history[0];
    const last = history[history.length - 1];
    if (last > first * 1.02) return { symbol: "▲", color: "text-green-500" };
    if (last < first * 0.98) return { symbol: "▼", color: "text-red-500" };
    return { symbol: "→", color: "text-gray-400" };
}

export const NinjaPriceTooltip: React.FC<NinjaPriceTooltipProps> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [fade, setFade] = useState(false);
    const priceRef = React.useRef<HTMLSpanElement>(null);
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

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

    React.useEffect(() => {
        if (showPopup && priceRef.current) {
            const rect = priceRef.current.getBoundingClientRect();
            setTooltipPos({
                left: rect.left + rect.width / 2,
                top: rect.bottom + 4,
            });
        }
    }, [showPopup]);

    const trend = trendIndicator(item.priceHistory ?? []);

    return (
        <span
            className="relative"
            data-testid="ninja-price-tooltip"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            aria-label="Show ninja item price details"
            ref={priceRef}
        >
            <span className="inline-flex items-center gap-1">
                <PriceDisplay amount={item.price} currency="chaos" />
                <span className={`text-xs ${trend.color}`}>{trend.symbol}</span>
            </span>
            {showPopup && tooltipPos && createPortal(
                <div
                    className={`hover-tooltip fixed transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
                    style={{ left: tooltipPos.left, top: tooltipPos.top, transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 50 }}
                >
                    <div className="flex items-center gap-1">
                        Rate:
                        <PriceDisplay amount={item.price} currency="chaos" exact />
                    </div>
                    {item.maxVolumeRate != null && item.maxVolumeCurrency && (() => {
                        const rate = item.maxVolumeRate;
                        const thisQty = rate >= 1 ? Math.round(rate) : 1;
                        const thatQty = rate >= 1 ? 1 : Math.round(1 / rate);
                        return (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span>Bulk:</span>
                                <span>{thisQty}</span>
                                <img src={item.icon} alt={item.name} className="inline w-4 h-4 align-middle" />
                                <span className="text-gray-400">=</span>
                                <span>{thatQty}</span>
                                <CurrencyIcon currency={item.maxVolumeCurrency.toLowerCase()} className="inline w-4 h-4 align-middle" />
                            </div>
                        );
                    })()}
                    <div className="flex items-center gap-1 mt-0.5">
                        Volume: <VolumeDisplay volume={item.volume} />
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${trend.color}`}>
                        Trend: {trend.symbol}
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
};
