export interface NinjaItem {
    id: string;
    name: string;
    icon: string;
    category: string;
    detailsId: string;
    price: number;
    priceHistory: number[];
    volume: number;
    maxVolumeCurrency: string;
    maxVolumeRate: number;
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
    image: string;
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

