import React from "react";
import CurrencyIcon from "./CurrencyIcon";

export function formatVolume(value: number): string {
    if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}m`;
    if (value >= 1_000) return `${Math.floor(value / 1_000)}k`;
    return value.toString();
}

interface VolumeDisplayProps {
    volume: number;
    currency?: string;
    className?: string;
}

export const VolumeDisplay: React.FC<VolumeDisplayProps> = ({ volume, currency = "chaos", className }) => {
    return (
        <span className={className ?? "inline-flex items-center gap-1 text-primary"} data-testid="volume-display">
            <span data-testid="volume-value">{formatVolume(volume)}</span>
            <CurrencyIcon currency={currency.toLowerCase()} className="inline w-4 h-4 align-middle" />
            <span className="text-gray-400">/h</span>
        </span>
    );
};
