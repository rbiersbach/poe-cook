export enum NinjaCategory {
    Currency = "Currency",
    Fragment = "Fragment",
    Runegraft = "Runegraft",
    AllflameEmber = "AllflameEmber",
    Tattoo = "Tattoo",
    Omen = "Omen",
    DivinationCard = "DivinationCard",
    Artifact = "Artifact",
    Oil = "Oil",
    Scarab = "Scarab",
    Fossil = "Fossil",
    Resonator = "Resonator",
    Essence = "Essence",
}
export interface NinjaItem {
    id: string;
    name: string;
    icon: string;
    category: NinjaCategory;
    detailsId: string;
    price: number;
    priceHistory: number[];
    volume: number;
    maxVolumeCurrency: string;
    maxVolumeRate: number;
    fetchedAt: string; // ISO date string
}

// Types for the ninja currency API response

export interface NinjaCurrencyOverviewResponse {
    core: NinjaCore;
    lines: NinjaCurrencyLine[];
    items: NinjaCoreItem[];
}

export interface NinjaCore {
    items: NinjaCoreItem[];
    rates: Record<string, number>;
    primary: string;
    secondary: string;
}

export interface NinjaCoreItem {
    id: string;
    name: string;
    image?: string;
    category: string;
    detailsId: string;
}

export interface NinjaCurrencyLine {
    id: string;
    primaryValue: number;
    volumePrimaryValue: number;
    maxVolumeCurrency: string;
    maxVolumeRate: number;
    sparkline: {
        totalChange: number;
        data: number[];
    };
}

/**
 * A single league-scoped exchange rate, normalised to chaos orb = 1.
 * `id` is the poe.ninja item id (e.g. "divine", "chaos").
 */
export interface ExchangeRate {
    id: string;
    name: string;
    chaosValue: number;
    fetchedAt: string;
}

