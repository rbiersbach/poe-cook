import type { NinjaItem } from "api/generated/models/NinjaItem";
import { RecipeItem } from "api/generated/models/RecipeItem";
import type { TradeItem } from "api/generated/models/TradeItem";
import { DefaultService } from "api/generated/services/DefaultService";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useLeague } from "../../context/LeagueContext";
import { formatQty, isNinjaItem, isTradeItem } from "../../utils/itemHelpers";
import CurrencyIcon from "./CurrencyIcon";
import ItemIcon from "./ItemIcon";
import { PriceDisplay } from "./PriceDisplay";
import { TradeUrlLink } from "./TradeUrlLink";
import { VolumeDisplay } from "./VolumeDisplay";

interface ItemChipProps {
    item: RecipeItem;
}

function trendIndicator(history: number[]): { symbol: string; color: string } {
    if (history.length < 2) return { symbol: "→", color: "text-gray-400" };
    const first = history[0];
    const last = history[history.length - 1];
    if (last > first * 1.02) return { symbol: "▲", color: "text-green-600 dark:text-green-400" };
    if (last < first * 0.98) return { symbol: "▼", color: "text-red-500 dark:text-red-400" };
    return { symbol: "→", color: "text-gray-400" };
}

function isLowVolume(item: NinjaItem): boolean {
    return item.volume != null && item.price != null && item.volume < item.price * 10;
}

export const ItemChip: React.FC<ItemChipProps> = ({ item }) => {
    const qty = item.qty;
    const qtyFmt = formatQty(qty);
    const iconUrl = item.icon;
    const name = item.name;
    const { league } = useLeague();

    const [hover, setHover] = useState(false);
    const [tooltipHover, setTooltipHover] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [fade, setFade] = useState(false);
    const chipRef = React.useRef<HTMLDivElement>(null);
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

    const [travelState, setTravelState] = useState<"idle" | "loading" | "success" | "error">("idle");

    const isActive = hover || tooltipHover;

    React.useEffect(() => {
        if (isActive) {
            setShowPopup(true);
            setFade(false);
        } else if (showPopup) {
            setFade(true);
            const timeout = setTimeout(() => {
                setShowPopup(false);
                setFade(false);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [isActive, showPopup]);

    React.useEffect(() => {
        if (showPopup && chipRef.current) {
            const rect = chipRef.current.getBoundingClientRect();
            setTooltipPos({
                left: rect.left + rect.width / 2,
                top: rect.bottom + 4,
            });
        }
    }, [showPopup]);

    const qtyBadge = qty !== 1 ? (
        qtyFmt.isRate
            ? <span className="font-bold text-gray-500 dark:text-gray-400">{qtyFmt.value}</span>
            : <span className="font-bold">{qtyFmt.value}x</span>
    ) : null;

    if (isTradeItem(item)) {
        const tradeData = item.item as TradeItem;
        if (!tradeData.resolved) return null;
        const resolved = tradeData.resolved;
        const showMinChaos = resolved.originalMinPrice?.currency !== "chaos" && resolved.minPrice;
        const showMedianChaos = resolved.originalMedianPrice?.currency !== "chaos" && resolved.medianPrice;
        return (
            <div
                className="item-chip"
                data-testid="item-chip"
                ref={chipRef}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <ItemIcon src={iconUrl} alt={name} />
                <span className="flex items-center gap-1 ml-auto">
                    {qtyBadge}
                    <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} />
                </span>
                {showPopup && tooltipPos && createPortal(
                    <div
                        className={`hover-tooltip fixed transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
                        style={{ left: tooltipPos.left, top: tooltipPos.top, transform: "translateX(-50%)", zIndex: 50 }}
                        onMouseEnter={() => setTooltipHover(true)}
                        onMouseLeave={() => setTooltipHover(false)}
                    >
                        <div className="font-semibold mb-1 flex items-center gap-2">
                            <span>{name}</span>
                            {tradeData.tradeUrl && <TradeUrlLink url={tradeData.tradeUrl} />}
                            {tradeData.search && league && (
                                <button
                                    data-testid="travel-to-hideout-button"
                                    disabled={travelState === "loading"}
                                    className="inline-flex items-center link trade-link rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Travel to seller's hideout"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (travelState !== "idle") return;
                                        setTravelState("loading");
                                        try {
                                            await DefaultService.postApiLeagueTravelToItem(league.text, { search: tradeData.search });
                                            setTravelState("success");
                                            setTimeout(() => setTravelState("idle"), 2000);
                                        } catch {
                                            setTravelState("error");
                                            setTimeout(() => setTravelState("idle"), 3000);
                                        }
                                    }}
                                >
                                    {travelState === "idle" && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                        </svg>
                                    )}
                                    {travelState === "loading" && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 animate-spin">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                    )}
                                    {travelState === "success" && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-green-600 dark:text-green-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    )}
                                    {travelState === "error" && (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-red-500 dark:text-red-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span>Price:</span>
                            <PriceDisplay amount={resolved.originalMinPrice?.amount} currency={resolved.originalMinPrice?.currency} exact />
                            {showMinChaos && (
                                <span className="text-muted">(<PriceDisplay amount={resolved.minPrice?.amount} currency="chaos" exact />)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span>Median:</span>
                            <PriceDisplay amount={resolved.originalMedianPrice?.amount} currency={resolved.originalMedianPrice?.currency} exact />
                            {showMedianChaos && (
                                <span className="text-muted">(<PriceDisplay amount={resolved.medianPrice?.amount} currency="chaos" exact />)</span>
                            )}
                        </div>
                        <div className="mt-0.5 text-muted text-xs"># Listings ≤ Median: {resolved.medianCount ?? "?"}</div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    if (isNinjaItem(item)) {
        const ninjaData = item.item as NinjaItem;
        const trend = trendIndicator(ninjaData.priceHistory ?? []);
        const lowVolume = isLowVolume(ninjaData);
        return (
            <div
                className="item-chip"
                data-testid="item-chip"
                ref={chipRef}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <ItemIcon src={iconUrl} alt={name} />
                {lowVolume && <span className="text-xs text-yellow-500 dark:text-yellow-400">⚠</span>}
                <span className="flex items-center gap-1 ml-auto">
                    {qtyBadge}
                    <PriceDisplay amount={ninjaData.price} currency="chaos" />
                </span>
                {showPopup && tooltipPos && createPortal(
                    <div
                        className={`hover-tooltip fixed transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
                        style={{ left: tooltipPos.left, top: tooltipPos.top, transform: "translateX(-50%)", zIndex: 50 }}
                    >
                        <div className="font-semibold mb-1">{name}</div>
                        <div className="flex items-center gap-1">
                            Price: <PriceDisplay amount={ninjaData.price} currency="chaos" exact />
                        </div>
                        {ninjaData.maxVolumeRate != null && ninjaData.maxVolumeCurrency && (() => {
                            const rate = ninjaData.maxVolumeRate;
                            const thisQty = rate >= 1 ? Math.round(rate) : 1;
                            const thatQty = rate >= 1 ? 1 : Math.round(1 / rate);
                            return (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span>Bulk:</span>
                                    <span>{thisQty}</span>
                                    <img src={ninjaData.icon} alt={ninjaData.name} className="inline w-4 h-4 align-middle" />
                                    <span className="text-gray-400">=</span>
                                    <span>{thatQty}</span>
                                    <CurrencyIcon currency={ninjaData.maxVolumeCurrency.toLowerCase()} className="inline w-4 h-4 align-middle" />
                                </div>
                            );
                        })()}
                        <div className="flex items-center gap-1 mt-0.5">
                            Volume: <VolumeDisplay volume={ninjaData.volume} />
                        </div>
                        {lowVolume && (
                            <div className="flex items-center gap-1 mt-0.5 text-yellow-500 dark:text-yellow-400">
                                <span>⚠</span><span>Low volume</span>
                            </div>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 ${trend.color}`}>
                            Trend: {trend.symbol}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    return null;
};
